/**
 * 1회성(멱등) — S3 폴더 구조를 서비스 도메인에 맞게 재배치한다.
 *
 *   images/v1/template_thumbnail/{NN}.jpeg     →  templates/{templateId}/thumbnail.jpeg
 *   images/v1/wedding/gallery_sm/...001.jpg    →  templates/wedding-classic-.../gallery/001.jpg
 *   images/v1/{wedding|baby|...}/...           →  templates/{해당 templateId}/...
 *   images/v1/icon_image/...                   →  system/icons/...
 *   music/{wedding|baby}/...                   →  presets/bgm/{wedding|baby}/...
 *   music/tracks.json                          →  presets/bgm/tracks.json
 *
 *   uploads/{file}  → DB 참조 추적:
 *     - Template에서 참조  →  templates/{templateId}/uploads/{file}
 *     - Invitation에서 참조 →  users/{userId}/invitations/{invitationId}/{file}
 *     - 양쪽 모두 참조      →  양쪽에 복사 (각 위치마다 URL 갱신)
 *     - 어디에도 안 쓰임   →  손대지 않음 (수동 정리 단계)
 *
 * 작업:
 *   1) 옛 S3 키 → 새 S3 키로 CopyObject (server-side, 빠름)
 *   2) DB의 모든 Template/Invitation JSON에서 옛 절대 URL → 새 절대 URL 일괄 치환
 *   3) 옛 키 삭제는 환경 변수 DELETE_OLD=1 일 때만 (안전 기본값)
 *
 * 실행:
 *   docker exec openday_nextjs_local npx tsx scripts/migrate-s3-restructure.ts
 *   docker exec -e DELETE_OLD=1 openday_nextjs_local npx tsx scripts/migrate-s3-restructure.ts   # 검증 후 옛 키 정리
 */

import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { Prisma, PrismaClient } from '@prisma/client'
import { ASSET_BASE_URL } from '../src/lib/asset-paths'

const BUCKET = process.env.S3_BUCKET
const ENDPOINT = process.env.S3_ENDPOINT
const REGION = process.env.S3_REGION || 'us-east-1'
const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID
const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY
const FORCE_PATH_STYLE = (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true'
const DELETE_OLD = process.env.DELETE_OLD === '1'

if (!BUCKET || !ENDPOINT || !ACCESS_KEY || !SECRET_KEY) {
  console.error('Missing S3 env vars')
  process.exit(1)
}

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: FORCE_PATH_STYLE,
})
const prisma = new PrismaClient()

// ── 1) 정적 자산 매핑 ─────────────────────────────────────────────────────────

const TEMPLATE_BY_THUMB_NUMBER: Record<string, string> = {
  '01': 'wedding-classic-template-001',
  '02': 'baby-first-birthday-template-001',
  '03': 'business-seminar-template-001',
  '04': 'business-launch-template-001',
  '05': 'sports-tennis-template-001',
  '06': 'social-vip-night-template-001',
  '07': 'seasonal-yearend-template-001',
}

const TEMPLATE_BY_DIR: Record<string, string> = {
  wedding: 'wedding-classic-template-001',
  baby: 'baby-first-birthday-template-001',
  seminar: 'business-seminar-template-001',
  launch: 'business-launch-template-001',
  tennis: 'sports-tennis-template-001',
  'vip-night': 'social-vip-night-template-001',
  yearend: 'seasonal-yearend-template-001',
}

function mapStaticKey(oldKey: string): string | null {
  // template_thumbnail
  const thumb = oldKey.match(/^images\/v1\/template_thumbnail\/(\d{2})\.jpeg$/)
  if (thumb) {
    const tid = TEMPLATE_BY_THUMB_NUMBER[thumb[1]]
    return tid ? `templates/${tid}/thumbnail.jpeg` : null
  }

  // wedding gallery_sm/gallery_img_sm_001.jpg → gallery/001.jpg
  const wgallery = oldKey.match(/^images\/v1\/wedding\/gallery_sm\/gallery_img_sm_(\d{3})\.jpg$/)
  if (wgallery) {
    return `templates/wedding-classic-template-001/gallery/${wgallery[1]}.jpg`
  }

  // 카테고리별 폴더 → 해당 templateId
  const dirMatch = oldKey.match(/^images\/v1\/([^/]+)\/(.+)$/)
  if (dirMatch) {
    const [, dir, rest] = dirMatch
    if (dir === 'icon_image') return `system/icons/${rest}`
    if (dir === 'template_thumbnail') return null // 이미 위에서 처리
    const tid = TEMPLATE_BY_DIR[dir]
    if (tid) return `templates/${tid}/${rest}`
    console.warn(`[?] unknown images/v1 dir: ${dir} (key=${oldKey})`)
    return null
  }

  // music
  if (oldKey === 'music/tracks.json') return 'presets/bgm/tracks.json'
  const m = oldKey.match(/^music\/([^/]+)\/(.+)$/)
  if (m) return `presets/bgm/${m[1]}/${m[2]}`

  return null
}

// ── 2) 사용자 업로드(uploads/) 매핑 — DB 참조 추적 ────────────────────────────

interface UploadRefMap {
  templates: Set<string>
  invitations: Map<string, string> // invitationId → userId
}

const UPLOAD_PATTERN_FRAGMENT = /\/(?:api\/)?uploads\/([A-Za-z0-9._-]+)/g
const ABSOLUTE_UPLOAD_PATTERN = new RegExp(`${ASSET_BASE_URL.replace(/\./g, '\\.')}/uploads/([A-Za-z0-9._-]+)`, 'g')

function collectUploadFilesFromString(s: string, sink: Set<string>) {
  for (const m of s.matchAll(UPLOAD_PATTERN_FRAGMENT)) sink.add(m[1])
  for (const m of s.matchAll(ABSOLUTE_UPLOAD_PATTERN)) sink.add(m[1])
}

function collectUploadFiles(value: unknown, sink: Set<string>) {
  if (typeof value === 'string') return collectUploadFilesFromString(value, sink)
  if (Array.isArray(value)) {
    for (const v of value) collectUploadFiles(v, sink)
    return
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectUploadFiles(v, sink)
  }
}

async function buildUploadRefMap(): Promise<Map<string, UploadRefMap>> {
  const map = new Map<string, UploadRefMap>()
  const ensure = (file: string) => {
    let entry = map.get(file)
    if (!entry) {
      entry = { templates: new Set(), invitations: new Map() }
      map.set(file, entry)
    }
    return entry
  }

  const templates = await prisma.template.findMany()
  for (const t of templates) {
    const sink = new Set<string>()
    if (t.thumbnail) collectUploadFiles(t.thumbnail, sink)
    collectUploadFiles(t.defaultContent, sink)
    collectUploadFiles(t.defaultModules, sink)
    collectUploadFiles(t.styles, sink)
    collectUploadFiles(t.infoConfig, sink)
    collectUploadFiles(t.themeConfig, sink)
    for (const f of sink) ensure(f).templates.add(t.id)
  }

  const invitations = await prisma.invitation.findMany({
    select: {
      id: true,
      userId: true,
      thumbnailUrl: true,
      contentJson: true,
      modulesJson: true,
      styles: true,
      templateConfigJson: true,
    },
  })
  for (const inv of invitations) {
    const sink = new Set<string>()
    if (inv.thumbnailUrl) collectUploadFiles(inv.thumbnailUrl, sink)
    collectUploadFiles(inv.contentJson, sink)
    collectUploadFiles(inv.modulesJson, sink)
    collectUploadFiles(inv.styles, sink)
    collectUploadFiles(inv.templateConfigJson, sink)
    for (const f of sink) ensure(f).invitations.set(inv.id, inv.userId)
  }

  return map
}

// ── 3) S3 작업 ────────────────────────────────────────────────────────────────

async function listAll(prefix: string): Promise<string[]> {
  const keys: string[] = []
  let token: string | undefined
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      })
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key)
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return keys
}

async function copyKey(srcKey: string, destKey: string) {
  if (srcKey === destKey) return
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: destKey,
      CopySource: `/${BUCKET}/${srcKey
        .split('/')
        .map((seg) => encodeURIComponent(seg))
        .join('/')}`,
      ACL: 'public-read',
    })
  )
}

async function deleteKey(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// ── 4) DB URL 일괄 치환 ───────────────────────────────────────────────────────

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 모든 매칭을 단일 regex alternation으로 한 번에 처리한다. 길이가 긴 키가
// 먼저 매칭되도록 정렬해 부분 문자열 키가 우선 매칭되는 일을 막고, 결과
// 안에 새로 들어간 URL 조각이 다시 매칭되어 누적되는 무한 누적을 방지한다.
function rewriteUrlsInString(s: string, urlMap: Map<string, string>): string {
  if (urlMap.size === 0) return s
  const entries = Array.from(urlMap.entries()).sort((a, b) => b[0].length - a[0].length)
  const pattern = new RegExp(entries.map(([k]) => escapeRegExp(k)).join('|'), 'g')
  return s.replace(pattern, (match) => {
    const found = entries.find(([k]) => k === match)
    return found ? found[1] : match
  })
}

function rewriteUrlsInJson(value: unknown, urlMap: Map<string, string>): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const next = rewriteUrlsInString(value, urlMap)
    return { value: next, changed: next !== value }
  }
  if (Array.isArray(value)) {
    let changed = false
    const next = value.map((v) => {
      const r = rewriteUrlsInJson(v, urlMap)
      if (r.changed) changed = true
      return r.value
    })
    return { value: next, changed }
  }
  if (value && typeof value === 'object') {
    let changed = false
    const next: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = rewriteUrlsInJson(v, urlMap)
      if (r.changed) changed = true
      next[k] = r.value
    }
    return { value: next, changed }
  }
  return { value, changed: false }
}

// ── 5) 메인 ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Restructuring s3://${BUCKET} (endpoint=${ENDPOINT})\n`)

  // 5-1) 정적 자산 매핑 — images/v1, music
  console.log('[1/4] static assets (images/v1/*, music/*)')
  const staticOldKeys = [...(await listAll('images/v1/')), ...(await listAll('music/'))]
  const staticPairs: Array<[string, string]> = []
  for (const oldKey of staticOldKeys) {
    const newKey = mapStaticKey(oldKey)
    if (!newKey) {
      console.warn(`  [skip] no mapping: ${oldKey}`)
      continue
    }
    staticPairs.push([oldKey, newKey])
  }
  console.log(`  ${staticPairs.length} static keys to copy`)
  for (const [src, dest] of staticPairs) {
    await copyKey(src, dest)
    console.log(`  copied  ${src}  →  ${dest}`)
  }

  // 5-2) 사용자 업로드 매핑 — uploads/
  console.log('\n[2/4] user uploads (uploads/*)')
  const uploadKeys = await listAll('uploads/')
  const refMap = await buildUploadRefMap()
  const uploadPairs: Array<{ src: string; dest: string }> = []
  for (const oldKey of uploadKeys) {
    const m = oldKey.match(/^uploads\/(.+)$/)
    if (!m) continue
    const file = m[1]
    const ref = refMap.get(file)
    if (!ref) {
      console.log(`  [orphan] uploads/${file}  (not referenced anywhere — leaving in place)`)
      continue
    }
    // Template 참조 — templates/{tid}/uploads/{file}
    for (const tid of ref.templates) {
      uploadPairs.push({ src: oldKey, dest: `templates/${tid}/uploads/${file}` })
    }
    // Invitation 참조 — users/{uid}/invitations/{iid}/{file}
    for (const [iid, uid] of ref.invitations) {
      uploadPairs.push({ src: oldKey, dest: `users/${uid}/invitations/${iid}/${file}` })
    }
  }
  console.log(`  ${uploadPairs.length} user-upload copies to perform`)
  for (const { src, dest } of uploadPairs) {
    await copyKey(src, dest)
    console.log(`  copied  ${src}  →  ${dest}`)
  }

  // 5-3) DB 안의 절대 URL 일괄 치환
  console.log('\n[3/4] DB URL rewrites')
  const urlMap = new Map<string, string>()
  for (const [oldKey, newKey] of staticPairs) {
    urlMap.set(`${ASSET_BASE_URL}/${oldKey}`, `${ASSET_BASE_URL}/${newKey}`)
  }
  // uploads는 참조 위치별로 다른 URL로 매핑되므로 entity별로 처리
  await rewriteTemplates(urlMap, refMap)
  await rewriteInvitations(urlMap, refMap)

  // 5-4) 옛 키 정리 — 명시적 옵션일 때만
  console.log('\n[4/4] old key cleanup')
  if (!DELETE_OLD) {
    console.log('  DELETE_OLD!=1 → skipping deletion (옛 키 유지). 검증 후 다시 실행:')
    console.log('  docker exec -e DELETE_OLD=1 openday_nextjs_local npx tsx scripts/migrate-s3-restructure.ts')
  } else {
    const deletable = new Set<string>()
    for (const [src] of staticPairs) deletable.add(src)
    for (const { src } of uploadPairs) deletable.add(src)
    console.log(`  deleting ${deletable.size} old keys…`)
    for (const k of deletable) {
      await deleteKey(k)
      console.log(`  deleted ${k}`)
    }
  }

  console.log('\nDone.')
}

async function rewriteTemplates(staticUrlMap: Map<string, string>, refMap: Map<string, UploadRefMap>) {
  const templates = await prisma.template.findMany()
  let updatedCount = 0
  for (const t of templates) {
    // 이 템플릿 안에서 참조되는 uploads/{file}을 templates/{t.id}/uploads/{file} 로 매핑
    const tUrlMap = new Map(staticUrlMap)
    for (const [file, ref] of refMap) {
      if (!ref.templates.has(t.id)) continue
      // `/uploads/{file}` 단독 패턴은 새 URL `templates/.../uploads/{file}` 안에 부분 일치하므로
      // 매칭 대상에서 제외한다. 옛 상대 경로는 `/api/uploads/{file}` 형식만 처리한다.
      const oldVariants = [
        `${ASSET_BASE_URL}/uploads/${file}`,
        `/api/uploads/${file}`,
      ]
      const newUrl = `${ASSET_BASE_URL}/templates/${t.id}/uploads/${file}`
      for (const ov of oldVariants) tUrlMap.set(ov, newUrl)
    }

    const data: Record<string, unknown> = {}
    let dirty = false

    if (t.thumbnail) {
      const next = rewriteUrlsInString(t.thumbnail, tUrlMap)
      if (next !== t.thumbnail) {
        data.thumbnail = next
        dirty = true
      }
    }

    for (const field of ['defaultContent', 'defaultModules', 'styles', 'infoConfig', 'themeConfig'] as const) {
      const cur = t[field]
      if (cur == null) continue
      const r = rewriteUrlsInJson(cur, tUrlMap)
      if (r.changed) {
        data[field] = r.value as Prisma.InputJsonValue
        dirty = true
      }
    }

    if (dirty) {
      await prisma.template.update({ where: { id: t.id }, data })
      updatedCount += 1
      console.log(`  Template ${t.id} updated`)
    }
  }
  console.log(`  templates: ${updatedCount}/${templates.length} updated`)
}

async function rewriteInvitations(staticUrlMap: Map<string, string>, refMap: Map<string, UploadRefMap>) {
  const invitations = await prisma.invitation.findMany()
  let updatedCount = 0
  for (const inv of invitations) {
    const iUrlMap = new Map(staticUrlMap)
    for (const [file, ref] of refMap) {
      if (!ref.invitations.has(inv.id)) continue
      const userId = ref.invitations.get(inv.id)!
      // `/uploads/{file}` 단독 패턴은 새 URL `templates/.../uploads/{file}` 안에 부분 일치하므로
      // 매칭 대상에서 제외한다. 옛 상대 경로는 `/api/uploads/{file}` 형식만 처리한다.
      const oldVariants = [
        `${ASSET_BASE_URL}/uploads/${file}`,
        `/api/uploads/${file}`,
      ]
      const newUrl = `${ASSET_BASE_URL}/users/${userId}/invitations/${inv.id}/${file}`
      for (const ov of oldVariants) iUrlMap.set(ov, newUrl)
    }

    const data: Record<string, unknown> = {}
    let dirty = false

    if (inv.thumbnailUrl) {
      const next = rewriteUrlsInString(inv.thumbnailUrl, iUrlMap)
      if (next !== inv.thumbnailUrl) {
        data.thumbnailUrl = next
        dirty = true
      }
    }

    for (const field of ['contentJson', 'modulesJson', 'styles', 'templateConfigJson'] as const) {
      const cur = inv[field]
      if (cur == null) continue
      const r = rewriteUrlsInJson(cur, iUrlMap)
      if (r.changed) {
        data[field] = r.value as Prisma.InputJsonValue
        dirty = true
      }
    }

    if (dirty) {
      await prisma.invitation.update({ where: { id: inv.id }, data })
      updatedCount += 1
      console.log(`  Invitation ${inv.id} updated`)
    }
  }
  console.log(`  invitations: ${updatedCount}/${invitations.length} updated`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

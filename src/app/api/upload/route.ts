import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { uploadObject } from '@/lib/objectstore'
import { prisma } from '@/lib/prisma'

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
const AUDIO_EXTS = ['mp3', 'm4a', 'wav', 'ogg', 'aac']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
}

const AUDIO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
}

interface UploadCtx {
  userId: string
  isAdmin: boolean
  invitationId: string | null
  templateId: string | null
}

async function resolveS3Key(ext: string, ctx: UploadCtx): Promise<{ ok: true; key: string } | { ok: false; error: string; status: number }> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // invitation 소유자 검증 — 사용자 데이터는 users/{userId}/invitations/{invitationId}/ 로
  if (ctx.invitationId) {
    const inv = await prisma.invitation.findFirst({
      where: { id: ctx.invitationId, userId: ctx.userId },
      select: { id: true },
    })
    if (!inv) return { ok: false, error: '초대장을 찾을 수 없거나 권한이 없습니다.', status: 403 }
    return { ok: true, key: `users/${ctx.userId}/invitations/${ctx.invitationId}/${filename}` }
  }

  // 템플릿 어드민 작업 — templates/{templateId}/uploads/ 로 (어드민만 허용)
  if (ctx.templateId) {
    if (!ctx.isAdmin) return { ok: false, error: '관리자 권한이 필요합니다.', status: 403 }
    const tpl = await prisma.template.findUnique({ where: { id: ctx.templateId }, select: { id: true } })
    if (!tpl) return { ok: false, error: '템플릿을 찾을 수 없습니다.', status: 404 }
    return { ok: true, key: `templates/${ctx.templateId}/uploads/${filename}` }
  }

  // 컨텍스트 미지정 — 사용자 단위 미분류 영역
  return { ok: true, key: `users/${ctx.userId}/uploads/${filename}` }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const ctx: UploadCtx = {
    userId: session.user.id,
    isAdmin: isAdminEmail(session.user.email),
    invitationId: null,
    templateId: null,
  }

  const url = new URL(req.url)
  ctx.invitationId = url.searchParams.get('invitationId')
  ctx.templateId = url.searchParams.get('templateId')
  const kind = url.searchParams.get('kind')

  if (kind === 'base64') {
    let dataUrl: string
    try {
      const body = (await req.json()) as { dataUrl?: string }
      dataUrl = body?.dataUrl ?? ''
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const m = DATA_URL_RE.exec(dataUrl)
    if (!m) {
      return NextResponse.json({ error: '지원하지 않는 이미지 형식입니다.' }, { status: 400 })
    }
    const ext = m[1] === 'jpg' ? 'jpeg' : m[1]
    const buf = Buffer.from(m[2], 'base64')
    if (buf.byteLength > MAX_IMAGE_BYTES) {
      const maxMb = Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)
      return NextResponse.json({ error: `이미지가 너무 큽니다. 최대 ${maxMb}MB까지 업로드할 수 있습니다.` }, { status: 413 })
    }
    const k = await resolveS3Key(ext, ctx)
    if (!k.ok) return NextResponse.json({ error: k.error }, { status: k.status })
    try {
      const publicUrl = await uploadObject({
        key: k.key,
        body: buf,
        contentType: IMAGE_MIME[ext] ?? 'application/octet-stream',
      })
      return NextResponse.json({ url: publicUrl })
    } catch (err) {
      console.error('[upload] base64 S3 upload failed', err)
      return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
    }
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isImage = IMAGE_EXTS.includes(ext)
  const isAudio = AUDIO_EXTS.includes(ext)
  if (!isImage && !isAudio) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const limit = isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES
  if (file.size > limit) {
    const maxMb = Math.floor(limit / 1024 / 1024)
    return NextResponse.json({ error: `파일이 너무 큽니다. 최대 ${maxMb}MB까지 업로드할 수 있습니다.` }, { status: 413 })
  }

  const k = await resolveS3Key(ext, ctx)
  if (!k.ok) return NextResponse.json({ error: k.error }, { status: k.status })

  try {
    const bytes = await file.arrayBuffer()
    const contentType = file.type || (isImage ? IMAGE_MIME[ext] : AUDIO_MIME[ext]) || 'application/octet-stream'
    const publicUrl = await uploadObject({
      key: k.key,
      body: Buffer.from(bytes),
      contentType,
    })
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[upload] multipart S3 upload failed', err)
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 })
  }
}

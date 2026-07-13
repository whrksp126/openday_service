import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getValidDriveAccessToken, uploadFileMultipart } from '@/lib/google-drive'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ── In-memory rate limiter (IP + invitationId, 분당 5회) ──────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxPerMinute = 5): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= maxPerMinute) {
    return false
  }

  entry.count += 1
  return true
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60_000)

// ── Handler ───────────────────────────────────────────────────────────────────

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: invitationId } = await params

  // Rate limit
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const rateLimitKey = `upload-proxy:${ip}:${invitationId}`

  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  }

  // invitation 존재 + 발행 확인
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, isPublished: true },
    select: { id: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found or not published' }, { status: 404 })
  }

  // multipart/form-data 파싱
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const name = formData.get('name')
  const relation = formData.get('relation')
  const moduleId = formData.get('moduleId')

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (!name || typeof name !== 'string' || name.length < 1 || name.length > 30) {
    return NextResponse.json({ error: 'name must be 1-30 characters' }, { status: 400 })
  }

  if (!relation || typeof relation !== 'string' || relation.length < 1 || relation.length > 30) {
    return NextResponse.json({ error: 'relation must be 1-30 characters' }, { status: 400 })
  }

  if (!moduleId || typeof moduleId !== 'string' || moduleId.length < 1 || moduleId.length > 64) {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })
  }

  const mimeType = file.type
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json(
      { error: 'Only image/jpeg, image/png, image/webp, image/heic are allowed' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }

  // Drive link 확인 (모듈별)
  const driveLink = await prisma.invitationDriveLink.findUnique({
    where: { invitationId_moduleId: { invitationId, moduleId } },
    select: { driveFolderId: true },
  })

  if (!driveLink) {
    return NextResponse.json({ error: 'Drive not connected' }, { status: 409 })
  }

  // Buffer로 변환
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 유효한 access token
  let accessToken: string
  try {
    accessToken = await getValidDriveAccessToken(invitationId, moduleId)
  } catch (e) {
    console.error('[upload-proxy] getValidDriveAccessToken error:', e)
    return NextResponse.json({ error: 'Drive token unavailable' }, { status: 503 })
  }

  // 파일명 생성
  const ext = mimeType.split('/')[1] || 'jpg'
  const safeName = name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
  const fileName = `${Date.now()}_${safeName}.${ext}`

  // multipart 업로드
  let driveFileId: string
  try {
    const result = await uploadFileMultipart({
      accessToken,
      folderId: driveLink.driveFolderId,
      name: fileName,
      mimeType,
      body: buffer,
    })
    driveFileId = result.id
  } catch (e) {
    console.error('[upload-proxy] uploadFileMultipart error:', e)
    return NextResponse.json({ error: 'Upload to Drive failed' }, { status: 502 })
  }

  return NextResponse.json({ driveFileId })
}

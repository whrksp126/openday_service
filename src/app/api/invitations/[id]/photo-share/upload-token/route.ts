import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sha256Hex } from '@/lib/google-drive'
import { pendingSubmissions } from '../_shared/pending-submissions'

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

// 오래된 항목 주기적 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60_000)

// ── Zod Schema ────────────────────────────────────────────────────────────────

const UploadTokenSchema = z.object({
  name: z.string().min(1).max(30),
  relation: z.string().min(1).max(30),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024), // 20MB
  moduleId: z.string().min(1).max(64),
})

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: invitationId } = await params

  // Rate limit
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const rateLimitKey = `upload-token:${ip}:${invitationId}`

  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  }

  // invitation 존재 확인 (공개 라우트 — 소유자 검증 없음, 발행 여부만 확인)
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, isPublished: true },
    select: { id: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found or not published' }, { status: 404 })
  }

  // Zod 검증
  let parsed: z.infer<typeof UploadTokenSchema>
  try {
    const body = await request.json()
    const result = UploadTokenSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }
    parsed = result.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Drive link 확인 (실 업로드는 /upload 라우트에서 처리. 여기선 연결 여부만 검증)
  const driveLink = await prisma.invitationDriveLink.findUnique({
    where: { invitationId_moduleId: { invitationId, moduleId: parsed.moduleId } },
    select: { driveFolderId: true },
  })

  if (!driveLink) {
    return NextResponse.json(
      { error: 'Drive not connected for this module' },
      { status: 409 }
    )
  }

  const submissionId = `ps_${randomUUID().replace(/-/g, '')}`
  const deleteToken = `${randomUUID()}${randomUUID()}`.replace(/-/g, '')

  pendingSubmissions.set(submissionId, {
    deleteTokenHash: sha256Hex(deleteToken),
    invitationId,
    moduleId: parsed.moduleId,
    expiresAt: Date.now() + 30 * 60_000,
  })

  return NextResponse.json({ submissionId, deleteToken })
}


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getValidDriveAccessToken, makeFilePublic, getDriveFile, sha256Hex } from '@/lib/google-drive'
import { pendingSubmissions } from '../_shared/pending-submissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ── POST: 메타 등록 ───────────────────────────────────────────────────────────

const SubmissionCreateSchema = z.object({
  submissionId: z.string().min(1),
  moduleId: z.string().min(1).max(64),
  driveFileId: z.string().min(1),
  name: z.string().min(1).max(30),
  relation: z.string().min(1).max(30),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  deleteToken: z.string().min(1),
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: invitationId } = await params

  // invitation 존재 + 발행 확인
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, isPublished: true },
    select: { id: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found or not published' }, { status: 404 })
  }

  // Zod 검증
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SubmissionCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { submissionId, moduleId, driveFileId, name, relation, mimeType, sizeBytes, width, height, deleteToken } = parsed.data

  // deleteToken 검증
  const pending = pendingSubmissions.get(submissionId)
  let deleteTokenHash: string

  if (pending) {
    const expectedHash = pending.deleteTokenHash
    const actualHash = sha256Hex(deleteToken)
    if (expectedHash !== actualHash) {
      return NextResponse.json({ error: 'Invalid deleteToken' }, { status: 403 })
    }
    if (pending.invitationId !== invitationId) {
      return NextResponse.json({ error: 'Invitation mismatch' }, { status: 403 })
    }
    if (pending.moduleId !== moduleId) {
      return NextResponse.json({ error: 'Module mismatch' }, { status: 403 })
    }
    deleteTokenHash = actualHash
    pendingSubmissions.delete(submissionId)
  } else {
    deleteTokenHash = sha256Hex(deleteToken)
  }

  // Drive link 확인 (모듈별)
  const driveLink = await prisma.invitationDriveLink.findUnique({
    where: { invitationId_moduleId: { invitationId, moduleId } },
    select: { driveFolderId: true },
  })

  if (!driveLink) {
    return NextResponse.json({ error: 'Drive not connected' }, { status: 409 })
  }

  let accessToken: string
  try {
    accessToken = await getValidDriveAccessToken(invitationId, moduleId)
  } catch (e) {
    console.error('[submission POST] getValidDriveAccessToken error:', e)
    return NextResponse.json({ error: 'Drive token unavailable' }, { status: 503 })
  }

  // 공개 권한 부여
  try {
    await makeFilePublic(accessToken, driveFileId)
  } catch (e) {
    console.error('[submission POST] makeFilePublic error:', e)
    return NextResponse.json({ error: 'Failed to make file public' }, { status: 502 })
  }

  // 파일 메타 조회 (thumbnailLink, webContentLink)
  let thumbnailUrl: string | undefined
  let driveDirectUrl: string | undefined
  try {
    const fileMeta = await getDriveFile(accessToken, driveFileId, 'thumbnailLink,webContentLink')
    thumbnailUrl = typeof fileMeta.thumbnailLink === 'string' ? fileMeta.thumbnailLink : undefined
    driveDirectUrl = typeof fileMeta.webContentLink === 'string' ? fileMeta.webContentLink : undefined
  } catch (e) {
    console.error('[submission POST] getDriveFile error:', e)
    // 메타 조회 실패해도 등록은 진행
  }

  // DB 저장
  const submission = await prisma.photoShareSubmission.create({
    data: {
      id: submissionId.startsWith('ps_') ? submissionId : undefined,
      invitationId,
      moduleId,
      authorName: name,
      relation,
      driveFileId,
      driveThumbnailUrl: thumbnailUrl,
      driveDirectUrl,
      mimeType,
      sizeBytes,
      width: width ?? null,
      height: height ?? null,
      deleteTokenHash,
    },
    select: {
      id: true,
      driveFileId: true,
      driveThumbnailUrl: true,
      driveDirectUrl: true,
      authorName: true,
      relation: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    id: submission.id,
    driveFileId: submission.driveFileId,
    thumbnailUrl: submission.driveThumbnailUrl,
    driveDirectUrl: submission.driveDirectUrl,
    authorName: submission.authorName,
    relation: submission.relation,
    createdAt: submission.createdAt,
  })
}

// ── GET: 목록 조회 ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: invitationId } = await params

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') || undefined
  const moduleId = searchParams.get('moduleId') || ''
  const limitRaw = parseInt(searchParams.get('limit') || '20', 10)
  const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 20 : limitRaw), 50)

  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId required' }, { status: 400 })
  }

  // invitation 존재 확인
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId },
    select: { id: true, modulesJson: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // previewPublic 확인 (해당 module 의 config)
  type ModuleItem = { id?: string; type: string; config?: { previewPublic?: boolean } }
  let previewPublic = true // default ON
  try {
    const modules = invitation.modulesJson as ModuleItem[]
    if (Array.isArray(modules)) {
      const target = modules.find((m) => m.type === 'photo_share' && m.id === moduleId)
      if (target?.config && typeof target.config.previewPublic === 'boolean') {
        previewPublic = target.config.previewPublic
      }
    }
  } catch {
    // ignore
  }

  if (!previewPublic) {
    return NextResponse.json({ items: [], nextCursor: null })
  }

  // 목록 조회 (모듈별)
  const items = await prisma.photoShareSubmission.findMany({
    where: {
      invitationId,
      moduleId,
      isHidden: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // +1로 다음 페이지 여부 확인
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      authorName: true,
      relation: true,
      driveFileId: true,
      driveThumbnailUrl: true,
      driveDirectUrl: true,
      mimeType: true,
      width: true,
      height: true,
      createdAt: true,
    },
  })

  let nextCursor: string | null = null
  if (items.length > limit) {
    const nextItem = items.pop()!
    nextCursor = nextItem.id
  }

  return NextResponse.json({ items, nextCursor })
}

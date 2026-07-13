import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST: Drive 연결 상태 조회 (모듈별)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // 소유자 검증
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, slug: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { returnTo?: unknown; moduleId?: unknown } = {}
  try {
    body = (await request.json().catch(() => ({}))) as typeof body
  } catch {
    /* ignore */
  }

  const moduleId = typeof body.moduleId === 'string' ? body.moduleId : ''
  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId required' }, { status: 400 })
  }

  // Drive 연결 상태 조회
  const driveLink = await prisma.invitationDriveLink.findUnique({
    where: { invitationId_moduleId: { invitationId: id, moduleId } },
    select: { driveFolderId: true },
  })

  if (driveLink) {
    const folderUrl = `https://drive.google.com/drive/folders/${driveLink.driveFolderId}`
    return NextResponse.json({
      status: 'connected',
      folderUrl,
      folderId: driveLink.driveFolderId,
    })
  }

  let returnTo = `/editor/${invitation.id}`
  if (typeof body.returnTo === 'string' && body.returnTo.startsWith('/')) {
    returnTo = body.returnTo
  }

  const authStartUrl = `/api/oauth/drive/start?invitationId=${id}&moduleId=${encodeURIComponent(moduleId)}&returnTo=${encodeURIComponent(returnTo)}`

  return NextResponse.json({
    status: 'needs_auth',
    authStartUrl,
  })
}

// DELETE: Drive 연결 해제 (DB row만 삭제, Drive 폴더 보존)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // 소유자 검증
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { moduleId?: unknown } = {}
  try {
    body = (await request.json().catch(() => ({}))) as typeof body
  } catch {
    /* ignore */
  }
  const moduleId = typeof body.moduleId === 'string' ? body.moduleId : ''
  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId required' }, { status: 400 })
  }

  await prisma.invitationDriveLink.deleteMany({
    where: { invitationId: id, moduleId },
  })

  return NextResponse.json({ ok: true })
}

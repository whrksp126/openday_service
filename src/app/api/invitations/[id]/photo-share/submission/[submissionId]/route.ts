import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getValidDriveAccessToken, deleteDriveFile, sha256Hex } from '@/lib/google-drive'

interface RouteParams {
  params: Promise<{ id: string; submissionId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: invitationId, submissionId } = await params

  const { searchParams } = new URL(request.url)
  const hideOnly = searchParams.get('hide') === 'true'

  // submission 조회
  const submission = await prisma.photoShareSubmission.findFirst({
    where: { id: submissionId, invitationId },
    select: {
      id: true,
      moduleId: true,
      driveFileId: true,
      deleteTokenHash: true,
      invitation: { select: { userId: true } },
    },
  })

  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 권한 확인 — 두 경로 중 하나:
  // 1) x-delete-token 헤더 검증
  // 2) 세션(소유자) 확인

  const deleteTokenHeader = request.headers.get('x-delete-token')
  const session = await auth()

  const isOwner =
    session?.user?.id && session.user.id === submission.invitation.userId

  let authorized = false

  if (deleteTokenHeader) {
    const hash = sha256Hex(deleteTokenHeader)
    authorized = hash === submission.deleteTokenHash
  }

  if (!authorized && isOwner) {
    authorized = true
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // hide=true: isHidden 토글 (소유자만)
  if (hideOnly) {
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the invitation owner can hide submissions' }, { status: 403 })
    }
    await prisma.photoShareSubmission.update({
      where: { id: submissionId },
      data: { isHidden: true },
    })
    return NextResponse.json({ ok: true })
  }

  // 실제 삭제: Drive 파일 삭제 → DB 행 삭제
  try {
    const accessToken = await getValidDriveAccessToken(invitationId, submission.moduleId)
    await deleteDriveFile(accessToken, submission.driveFileId)
  } catch (e) {
    // Drive 토큰 없거나 파일 이미 삭제된 경우도 DB 삭제는 진행
    console.error('[submission DELETE] Drive delete error (proceeding with DB delete):', e)
  }

  await prisma.photoShareSubmission.delete({
    where: { id: submissionId },
  })

  return NextResponse.json({ ok: true })
}

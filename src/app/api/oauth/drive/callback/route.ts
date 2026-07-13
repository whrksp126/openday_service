import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyOAuthState, createDriveFolder } from '@/lib/google-drive'

interface TokenExchangeResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
  id_token?: string
}

interface GoogleTokenInfoResponse {
  sub?: string
  email?: string
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/?auth=required', request.url))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('[drive/callback] Google OAuth error:', error)
    return NextResponse.redirect(new URL('/?drive=error', request.url))
  }

  if (!code || !stateParam) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  // State 검증
  const statePayload = verifyOAuthState(stateParam)
  if (!statePayload) {
    return NextResponse.json({ error: 'Invalid or expired state' }, { status: 400 })
  }

  const { invitationId, moduleId, returnTo } = statePayload

  // 소유자 확인
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: { id: true, title: true, slug: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI!
  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!

  // Code → Token 교환
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('[drive/callback] Token exchange failed:', errText)
    return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 })
  }

  const tokenData: TokenExchangeResponse = await tokenRes.json()

  if (!tokenData.refresh_token) {
    // refresh_token이 없으면 재동의 필요 — prompt=consent 했는데도 없으면 이미 연결된 상태
    console.error('[drive/callback] No refresh_token in response')
    return NextResponse.json({ error: 'No refresh_token returned. Please revoke access and retry.' }, { status: 400 })
  }

  // Google Account ID 조회 (tokeninfo)
  let googleAccountId = 'unknown'
  try {
    const infoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(tokenData.access_token)}`
    )
    if (infoRes.ok) {
      const info: GoogleTokenInfoResponse = await infoRes.json()
      if (typeof info.sub === 'string') {
        googleAccountId = info.sub
      }
    }
  } catch (e) {
    console.warn('[drive/callback] Failed to fetch tokeninfo:', e)
  }

  // Drive 폴더 생성
  const rawName = `OpenDay - ${invitation.title || invitation.slug}`
  const folderName = rawName.slice(0, 50)

  let driveFolderId: string
  let folderWebViewLink: string | undefined

  try {
    const folder = await createDriveFolder(tokenData.access_token, folderName)
    driveFolderId = folder.id
    folderWebViewLink = folder.webViewLink
  } catch (e) {
    console.error('[drive/callback] createDriveFolder failed:', e)
    return NextResponse.json({ error: 'Failed to create Drive folder' }, { status: 500 })
  }

  // accessExpiresAt 계산 (expires_in - 60초 버퍼)
  const accessExpiresAt = new Date(Date.now() + (tokenData.expires_in - 60) * 1000)

  // InvitationDriveLink upsert (모듈별)
  await prisma.invitationDriveLink.upsert({
    where: { invitationId_moduleId: { invitationId, moduleId } },
    create: {
      invitationId,
      moduleId,
      ownerUserId: session.user.id,
      googleAccountId,
      scope: tokenData.scope,
      refreshToken: tokenData.refresh_token,
      accessToken: tokenData.access_token,
      accessExpiresAt,
      driveFolderId,
    },
    update: {
      ownerUserId: session.user.id,
      googleAccountId,
      scope: tokenData.scope,
      refreshToken: tokenData.refresh_token,
      accessToken: tokenData.access_token,
      accessExpiresAt,
      driveFolderId,
    },
  })
  // folderWebViewLink 는 응답 redirect 에 직접 사용하지 않으므로 별도 저장 안 함
  void folderWebViewLink

  // returnTo로 302 리다이렉트
  const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : '/'
  const redirectTarget = new URL(safeReturnTo, process.env.NEXT_PUBLIC_APP_URL || request.url)
  redirectTarget.searchParams.set('drive', 'connected')

  return NextResponse.redirect(redirectTarget.toString())
}

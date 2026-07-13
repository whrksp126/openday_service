import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { signOAuthState } from '@/lib/google-drive'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const invitationId = searchParams.get('invitationId')
  const moduleId = searchParams.get('moduleId')
  const returnTo = searchParams.get('returnTo') || '/'

  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId is required' }, { status: 400 })
  }
  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId is required' }, { status: 400 })
  }

  // 소유자 확인
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId: session.user.id },
    select: { id: true },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI
  if (!redirectUri) {
    return NextResponse.json({ error: 'GOOGLE_DRIVE_REDIRECT_URI not configured' }, { status: 500 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 })
  }

  const state = signOAuthState({
    invitationId,
    moduleId,
    nonce: randomUUID(),
    ts: Date.now(),
    returnTo,
  })

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('include_granted_scopes', 'true')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}

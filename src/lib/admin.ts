import { NextResponse } from 'next/server'
import { auth } from './auth'

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

export async function getAdminSession() {
  const session = await auth()
  if (!session?.user?.id || !isAdminEmail(session.user.email)) return null
  return session
}

export async function requireAdminApi(): Promise<NextResponse | null> {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}

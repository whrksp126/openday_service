import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DeleteSchema = z.object({ password: z.string().optional() })

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  const { id, entryId } = await params
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    select: { id: true, userId: true },
  })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const entry = await prisma.guestbookEntry.findFirst({
    where: { id: entryId, invitationId: id },
  })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const session = await auth()
  const isOwner = !!session?.user?.id && session.user.id === invitation.userId

  if (!isOwner) {
    let payload: unknown
    try { payload = await request.json() } catch { payload = {} }
    const parsed = DeleteSchema.safeParse(payload)
    const password = parsed.success ? parsed.data.password : undefined
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 401 })
    const ok = await bcrypt.compare(password, entry.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
  }

  await prisma.guestbookEntry.delete({ where: { id: entryId } })
  return NextResponse.json({ ok: true })
}

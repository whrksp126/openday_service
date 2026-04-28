import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const Schema = z.object({ token: z.string().min(8).max(32) })

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const invite = await prisma.coupleInvite.findUnique({ where: { token: parsed.data.token } })
  if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invite.acceptedById && invite.acceptedById !== session.user.id) {
    return NextResponse.json({ error: 'Already accepted' }, { status: 409 })
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Expired' }, { status: 410 })
  }

  await prisma.coupleInvite.update({
    where: { id: invite.id },
    data: { acceptedById: session.user.id },
  })

  return NextResponse.json({ ok: true, invitationId: invite.invitationId })
}

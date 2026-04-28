import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInviteToken } from '@/lib/nanoid'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invites = await prisma.coupleInvite.findMany({
    where: { invitationId: id },
    orderBy: { createdAt: 'desc' },
    include: { acceptedBy: { select: { name: true, email: true } } },
  })
  return NextResponse.json({ invites })
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const created = await prisma.coupleInvite.create({
    data: {
      invitationId: id,
      token: generateInviteToken(),
      role: 'editor',
      expiresAt: new Date(Date.now() + 30 * 24 * 3600_000),
    },
    include: { acceptedBy: { select: { name: true, email: true } } },
  })
  return NextResponse.json({ invite: created }, { status: 201 })
}

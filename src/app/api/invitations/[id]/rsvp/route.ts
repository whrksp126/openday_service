import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CreateSchema = z.object({
  guestName: z.string().min(1).max(40),
  side: z.enum(['groom', 'bride', 'baby']).nullable().optional(),
  attending: z.boolean(),
  partySize: z.number().int().min(1).max(20).optional(),
  meal: z.boolean().nullable().optional(),
  phone: z.string().max(40).optional(),
  message: z.string().max(500).optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const responses = await prisma.rsvpResponse.findMany({
    where: { invitationId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ responses })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invitation = await prisma.invitation.findUnique({
    where: { id },
    select: { id: true, isPublished: true },
  })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!invitation.isPublished) return NextResponse.json({ error: 'Not published' }, { status: 403 })

  const parsed = CreateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const created = await prisma.rsvpResponse.create({
    data: {
      invitationId: id,
      guestName: parsed.data.guestName,
      side: parsed.data.side ?? null,
      attending: parsed.data.attending,
      partySize: parsed.data.partySize ?? 1,
      meal: parsed.data.meal ?? null,
      phone: parsed.data.phone,
      message: parsed.data.message,
    },
  })
  return NextResponse.json({ response: created }, { status: 201 })
}

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findEditableInvitation } from '@/lib/invitation-access'
import { z } from 'zod'

const UpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  contentJson: z.record(z.unknown()).optional(),
  modulesJson: z.array(z.unknown()).optional(),
  styles: z.record(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  linkShareTitle: z.string().max(100).nullable().optional(),
  linkShareText: z.string().max(500).nullable().optional(),
  kakaoShareTitle: z.string().max(100).nullable().optional(),
  kakaoShareText: z.string().max(500).nullable().optional(),
  kakaoShareExtra: z.string().max(500).nullable().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const invitation = await prisma.invitation.findFirst({
    where: {
      id,
      OR: [
        { userId: session.user.id },
        { coupleInvites: { some: { acceptedById: session.user.id } } },
      ],
    },
    include: { template: { include: { category: { select: { slug: true } } } } },
  })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { template, ...rest } = invitation
  return NextResponse.json({ ...rest, categorySlug: template?.category?.slug ?? null })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await findEditableInvitation(id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { contentJson, modulesJson, styles, ...rest } = parsed.data
  const data: Prisma.InvitationUpdateInput = {
    ...rest,
    ...(contentJson !== undefined ? { contentJson: contentJson as Prisma.InputJsonValue } : {}),
    ...(modulesJson !== undefined ? { modulesJson: modulesJson as Prisma.InputJsonValue } : {}),
    ...(styles !== undefined ? { styles: styles as Prisma.InputJsonValue } : {}),
    ...(parsed.data.isPublished && !existing.isPublished ? { publishedAt: new Date() } : {}),
  }
  const updated = await prisma.invitation.update({ where: { id }, data })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.invitation.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.invitation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

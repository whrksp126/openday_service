import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findEditableInvitation } from '@/lib/invitation-access'

const CreateSchema = z.object({
  authorName: z.string().min(1).max(40),
  message: z.string().min(1).max(1000),
  password: z.string().min(4).max(20),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invitation = await prisma.invitation.findUnique({ where: { id }, select: { id: true, isPublished: true } })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // 비공개 초대장은 소유자·짝꿍만 조회 가능. 존재 여부 노출을 막기 위해 404로 응답
  if (!invitation.isPublished) {
    const session = await auth()
    const editable = session?.user?.id ? await findEditableInvitation(id, session.user.id) : null
    if (!editable) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const entries = await prisma.guestbookEntry.findMany({
    where: { invitationId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, authorName: true, message: true, createdAt: true },
  })
  return NextResponse.json({ entries })
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

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  const created = await prisma.guestbookEntry.create({
    data: {
      invitationId: id,
      authorName: parsed.data.authorName,
      message: parsed.data.message,
      passwordHash,
    },
    select: { id: true, authorName: true, message: true, createdAt: true },
  })
  return NextResponse.json({ entry: created }, { status: 201 })
}

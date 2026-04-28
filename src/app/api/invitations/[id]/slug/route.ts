import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SLUG_RE = /^[a-zA-Z0-9-]{3,50}$/

const Schema = z.object({
  slug: z.string().regex(SLUG_RE, '영문, 숫자, 하이픈만 사용해 3~50자로 입력해주세요.'),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.invitation.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { slug } = parsed.data
  if (slug === existing.slug) {
    return NextResponse.json({ ok: true, slug })
  }

  const conflict = await prisma.invitation.findUnique({ where: { slug } })
  if (conflict) return NextResponse.json({ error: 'slug_taken' }, { status: 409 })

  const updated = await prisma.invitation.update({ where: { id }, data: { slug } })
  return NextResponse.json({ ok: true, slug: updated.slug })
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = await prisma.template.findFirst({
    where: { id, isPublic: true },
    include: { category: true, subcategory: true },
  })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(template)
}

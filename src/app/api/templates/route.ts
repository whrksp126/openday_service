import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const templates = await prisma.template.findMany({
    where: {
      isPublic: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    include: { category: true, subcategory: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(templates)
}

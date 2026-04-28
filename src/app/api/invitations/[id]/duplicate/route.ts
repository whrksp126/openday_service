import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/nanoid'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const source = await prisma.invitation.findFirst({ where: { id, userId: session.user.id } })
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const created = await prisma.invitation.create({
    data: {
      slug: generateSlug(),
      title: `${source.title} (복사본)`.slice(0, 100),
      userId: session.user.id,
      templateId: source.templateId,
      contentJson: (source.contentJson ?? {}) as Prisma.InputJsonValue,
      modulesJson: (source.modulesJson ?? []) as Prisma.InputJsonValue,
      styles: source.styles === null ? Prisma.JsonNull : (source.styles as Prisma.InputJsonValue),
      templateConfigJson:
        source.templateConfigJson === null ? Prisma.JsonNull : (source.templateConfigJson as Prisma.InputJsonValue),
      thumbnailUrl: source.thumbnailUrl,
      linkShareTitle: source.linkShareTitle,
      linkShareText: source.linkShareText,
      kakaoShareTitle: source.kakaoShareTitle,
      kakaoShareText: source.kakaoShareText,
      kakaoShareExtra: source.kakaoShareExtra,
      isPublished: false,
    },
  })

  return NextResponse.json(created)
}

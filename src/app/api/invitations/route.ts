import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/nanoid'
import { z } from 'zod'

const CreateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().optional(),
  contentJson: z.record(z.unknown()).optional(),
  modulesJson: z.array(z.unknown()).optional(),
  styles: z.record(z.unknown()).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const invitations = await prisma.invitation.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { coupleInvites: { some: { acceptedById: session.user.id } } },
      ],
    },
    include: { template: { include: { category: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(invitations)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { templateId } = parsed.data
  let { title, contentJson, modulesJson, styles } = parsed.data
  let templateConfigJson: Prisma.InputJsonValue | undefined

  // 템플릿 기반 생성: 누락된 필드를 템플릿 기본값으로 채워 사용자 소유 invitation에 복제
  if (templateId) {
    const template = await prisma.template.findFirst({
      where: { id: templateId, isPublic: true },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (!title) title = template.name
    if (contentJson === undefined) contentJson = (template.defaultContent ?? {}) as Record<string, unknown>
    if (modulesJson === undefined) modulesJson = Array.isArray(template.defaultModules) ? (template.defaultModules as unknown[]) : []
    if (styles === undefined) styles = (template.styles ?? {}) as Record<string, unknown>
    // 정보 그룹/테마 정의를 invitation에 스냅샷 — 이후 템플릿 변경의 영향을 받지 않게 고정
    templateConfigJson = {
      info: (template.infoConfig ?? null) as Prisma.InputJsonValue,
      theme: (template.themeConfig ?? null) as Prisma.InputJsonValue,
    } as Prisma.InputJsonValue
  }

  const slug = generateSlug()
  const invitation = await prisma.invitation.create({
    data: {
      slug,
      title: title ?? '제목 없음',
      userId: session.user.id,
      templateId,
      contentJson: (contentJson ?? {}) as Prisma.InputJsonValue,
      modulesJson: (modulesJson ?? []) as Prisma.InputJsonValue,
      styles: (styles ?? {}) as Prisma.InputJsonValue,
      ...(templateConfigJson !== undefined ? { templateConfigJson } : {}),
    },
  })

  return NextResponse.json(invitation, { status: 201 })
}

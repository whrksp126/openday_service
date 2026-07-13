import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = await prisma.template.findFirst({
    where: { id, isPublic: true },
    include: { category: true, subcategory: true },
  })
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(template)
}

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  defaultContent: z.record(z.unknown()).optional(),
  defaultModules: z.array(z.unknown()).optional(),
  styles: z.record(z.unknown()).optional(),
  infoConfig: z.record(z.unknown()).nullable().optional(),
  themeConfig: z.record(z.unknown()).nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await prisma.template.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = UpdateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { defaultContent, defaultModules, styles, infoConfig, themeConfig, ...rest } = parsed.data
  const data: Prisma.TemplateUpdateInput = {
    ...rest,
    ...(defaultContent !== undefined ? { defaultContent: defaultContent as Prisma.InputJsonValue } : {}),
    ...(defaultModules !== undefined ? { defaultModules: defaultModules as Prisma.InputJsonValue } : {}),
    ...(styles !== undefined ? { styles: styles as Prisma.InputJsonValue } : {}),
    ...(infoConfig !== undefined ? { infoConfig: (infoConfig ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull } : {}),
    ...(themeConfig !== undefined ? { themeConfig: (themeConfig ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull } : {}),
  }
  const updated = await prisma.template.update({ where: { id }, data })
  return NextResponse.json(updated)
}

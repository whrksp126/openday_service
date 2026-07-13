import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditorClient from '@/app/editor/[id]/EditorClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminTemplateEditPage({ params }: Props) {
  const { id } = await params
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) notFound()

  return <EditorClient id={id} templateId={null} mode="template" />
}

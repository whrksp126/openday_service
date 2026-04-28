import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import TemplatePreviewClient from '@/components/templates/TemplatePreviewClient'
import StartEditingButton from '@/components/templates/StartEditingButton'
import type { InvitationContent, InvitationModule, InvitationStyles } from '@/types/invitation'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const template = await prisma.template.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!template) return {}
  return {
    title: `${template.name} — ${template.category.name} 템플릿`,
    description: template.description ?? undefined,
  }
}

export default async function TemplatePreviewPage({ params }: Props) {
  const { id } = await params
  const template = await prisma.template.findUnique({
    where: { id },
    include: { category: true, subcategory: true },
  })

  if (!template) notFound()

  const defaultContent = (template.defaultContent ?? {}) as unknown as InvitationContent
  const defaultModules = (Array.isArray(template.defaultModules) ? template.defaultModules : []) as unknown as InvitationModule[]
  const styles = (template.styles ?? {}) as unknown as InvitationStyles
  const hasTemplateData = defaultModules.length > 0

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 최소 상단 바 */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <Link href="/templates" className="text-xs text-gray-400 hover:text-gray-600">
          ← 목록으로
        </Link>
        <span className="text-xs text-gray-500 font-medium">{template.name}</span>
        <StartEditingButton templateId={template.id} />
      </div>

      {/* 초대장 본문 */}
      <div className="pt-12 bg-[#edeae6] min-h-screen">
        {hasTemplateData ? (
          <TemplatePreviewClient content={defaultContent} modules={defaultModules} styles={styles} />
        ) : template.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={template.thumbnail} alt={template.name} className="w-full max-w-[375px] mx-auto" />
        ) : (
          <div className="flex items-center justify-center min-h-screen text-gray-300 text-sm">
            미리보기 준비 중
          </div>
        )}
      </div>
    </div>
  )
}

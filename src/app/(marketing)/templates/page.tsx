import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import TemplateGrid from '@/components/templates/TemplateGrid'
import CategoryFilter from '@/components/templates/CategoryFilter'

export const metadata: Metadata = {
  title: '템플릿 목록 — 복잡한 디자인, 3분이면 끝!',
  description: '수만 개의 템플릿으로 시간을 절약하세요.',
}

interface SearchParams {
  category?: string
  search?: string
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [categories, templates] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.template.findMany({
      where: {
        isPublic: true,
        ...(params.category ? { category: { slug: params.category } } : {}),
      },
      include: { category: true, subcategory: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">복잡한 디자인, 템플릿으로 3분이면 끝!</h1>
        <p className="mt-2 text-gray-500">수만 개의 템플릿으로 시간을 절약하세요</p>
      </div>

      <CategoryFilter categories={categories} selected={params.category} />
      <TemplateGrid templates={templates} />
    </div>
  )
}

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/shared/Header'

export const dynamic = 'force-dynamic'

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({
    include: { category: true, subcategory: true },
    orderBy: [{ category: { order: 'asc' } }, { createdAt: 'desc' }],
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← 메인으로</Link>
          <p className="text-xs text-gray-400 mt-3 mb-1">관리자</p>
          <h1 className="text-2xl font-bold text-gray-900">템플릿 관리</h1>
          <p className="text-sm text-gray-400 mt-2">
            각 템플릿을 클릭해 기본값(메인 화면·정보·테마·모듈)을 편집하세요. 편집 결과는 명시적으로 저장해야 반영됩니다.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/admin/templates/${t.id}/edit`}
              className="group block rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-primary transition-colors"
            >
              <div className="aspect-square bg-gray-100">
                {t.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    썸네일 없음
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">
                  {t.category.name}
                  {t.subcategory ? ` · ${t.subcategory.name}` : ''}
                </p>
                <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                <span className="mt-2 inline-block text-xs text-primary">편집하기 →</span>
              </div>
            </Link>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-400">
            아직 등록된 템플릿이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

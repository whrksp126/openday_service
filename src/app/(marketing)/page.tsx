import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'OpenDay — 세상의 모든 초대장',
}

export const dynamic = 'force-dynamic'

const FEATURED_BOXES = [
  { label: '결혼식',     slug: 'wedding'   },
  { label: '생일 잔치', slug: 'birthday'  },
  { label: '돌잔치',    slug: 'baby'      },
  { label: '입학식',    slug: 'education' },
] as const

export default async function HomePage() {
  const slugs = FEATURED_BOXES.map((b) => b.slug)
  const featured = await prisma.template.findMany({
    where: { isPublic: true, category: { slug: { in: [...slugs] } } },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  const bySlug = new Map<string, typeof featured[number]>()
  for (const t of featured) {
    if (!bySlug.has(t.category.slug)) bySlug.set(t.category.slug, t)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-white py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          세상의 모든 초대장 제작은
          <br />
          오픈데이로 완성
        </h1>
        <p className="mt-4 text-gray-500 text-lg">
          청첩장과 돌잔치부터 컨퍼런스까지 템플릿으로 쉽고 간편하게 시작해보세요!
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            href="/templates"
            className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            바로 시작하기
          </Link>
          <Link
            href="/templates"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            템플릿 보러가기
          </Link>
        </div>
      </section>

      {/* Template Preview Grid */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-primary text-sm font-medium text-center mb-2">53만 개 이상의 템플릿</p>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            모든 템플릿이 한 곳에
          </h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURED_BOXES.map(({ label, slug }) => {
              const tpl = bySlug.get(slug)
              return (
                <Link key={slug} href={`/templates?category=${slug}`} className="group">
                  <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 group-hover:opacity-90 transition-opacity">
                    {tpl?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">가장 소중한 사람을 빛나게</p>
                  <span className="text-xs text-primary">템플릿 보러 가기 →</span>
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/templates"
              className="border border-primary text-primary px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              모든 템플릿 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-center">
        <h2 className="text-2xl font-bold text-white">나만의 디자인을 시작해보세요!</h2>
        <div className="mt-6">
          <Link
            href="/templates"
            className="bg-white text-primary px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            바로 시작하기
          </Link>
        </div>
      </section>
    </div>
  )
}

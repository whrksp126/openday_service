import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'
import InvitationCard, { type InvitationCardData } from '@/components/my/InvitationCard'
import { buildFallbackTitle, buildFallbackVenueText, formatEventDateText } from '@/lib/share-fallback'

export const metadata: Metadata = { title: '내 초대장' }

export default async function MyPage() {
  // Auth checked server-side (not middleware) — CVE-2025-29927 대응
  const session = await auth()
  if (!session?.user?.id) redirect('/?auth=required')

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

  const cards: InvitationCardData[] = invitations.map((inv) => {
    const content = (inv.contentJson ?? {}) as Parameters<typeof buildFallbackTitle>[0]['content']
    const categorySlug = inv.template?.category.slug ?? null
    const eventDateText = formatEventDateText(content.eventDate, content.eventTime)
    const venueText = buildFallbackVenueText(content)
    const fallbackTitle = buildFallbackTitle({ content, categorySlug, invitationTitle: inv.title })

    return {
      id: inv.id,
      slug: inv.slug,
      title: inv.title,
      isPublished: inv.isPublished,
      thumbnailUrl: inv.thumbnailUrl,
      categoryName: inv.template?.category.name ?? null,
      linkShareTitle: inv.linkShareTitle,
      linkShareText: inv.linkShareText,
      kakaoShareTitle: inv.kakaoShareTitle,
      kakaoShareText: inv.kakaoShareText,
      kakaoShareExtra: inv.kakaoShareExtra,
      fallbackTitle,
      fallbackText: eventDateText,
      fallbackExtra: venueText,
      eventDateText,
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 초대장</h1>
        <Link
          href="/templates"
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          + 새 초대장 만들기
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">아직 만든 초대장이 없어요</p>
          <Link href="/templates" className="mt-4 inline-block text-primary text-sm">
            첫 초대장 만들기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <InvitationCard key={card.id} data={card} />
          ))}
        </div>
      )}
    </div>
  )
}

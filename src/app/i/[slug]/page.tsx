import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import InvitationView from '@/components/invitation/InvitationView'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function pickFirst<T>(...values: Array<T | null | undefined>): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v
  }
  return undefined
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const invitation = await prisma.invitation.findUnique({
    where: { slug, isPublished: true },
    include: { template: { include: { category: true } } },
  })

  if (!invitation) return { title: '초대장을 찾을 수 없습니다' }

  const content = (invitation.contentJson ?? {}) as Record<string, string>
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://openday.ghmate.com'

  const title = pickFirst(invitation.kakaoShareTitle, invitation.linkShareTitle, invitation.title) ?? '초대장'
  const description = pickFirst(
    invitation.linkShareText,
    invitation.kakaoShareText,
    content.greetingMessage,
    content.message,
    `${invitation.template?.category.name ?? ''} 초대장`,
  ) ?? ''
  const ogImage = pickFirst(invitation.thumbnailUrl, content.coverImage)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : [],
      url: `${appUrl}/i/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

async function recordVisit(invitationId: string) {
  try {
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? ''
    const ua = h.get('user-agent') ?? ''
    if (!ip && !ua) return
    const visitorHash = createHash('sha256').update(`${ip}|${ua}|${invitationId}`).digest('hex').slice(0, 64)
    const since = new Date(Date.now() - 60_000)
    const recent = await prisma.visitLog.findFirst({
      where: { invitationId, visitorHash, visitedAt: { gte: since } },
      select: { id: true },
    })
    if (recent) return
    const referer = h.get('referer') ?? null
    await prisma.visitLog.create({ data: { invitationId, visitorHash, referer } })
    await prisma.invitation.update({ where: { id: invitationId }, data: { viewCount: { increment: 1 } } })
  } catch {
    // 통계는 best-effort. 본 페이지 렌더에는 영향 없음.
  }
}

export default async function InvitationPage({ params }: Props) {
  const { slug } = await params
  const invitation = await prisma.invitation.findUnique({
    where: { slug, isPublished: true },
    include: { template: true },
  })

  if (!invitation) notFound()

  await recordVisit(invitation.id)

  return <InvitationView invitation={invitation} />
}

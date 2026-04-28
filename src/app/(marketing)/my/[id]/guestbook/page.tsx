import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import GuestbookList from './GuestbookList'

interface Props { params: Promise<{ id: string }> }

export default async function GuestbookPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/?auth=required')

  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true },
  })
  if (!invitation) notFound()

  const entries = await prisma.guestbookEntry.findMany({
    where: { invitationId: id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, authorName: true, message: true, createdAt: true },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/my" className="inline-flex items-center gap-1 text-xs text-gray-400 mb-6">
        <ChevronLeft size={14} />
        내 초대장
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">방명록 조회</h1>
      <p className="text-sm text-gray-400 mb-8">{invitation.title} · 총 {entries.length}건</p>

      <GuestbookList
        invitationId={id}
        initialEntries={entries.map((e) => ({
          id: e.id,
          authorName: e.authorName,
          message: e.message,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}

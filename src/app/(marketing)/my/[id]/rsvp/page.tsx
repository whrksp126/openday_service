import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import RsvpTable from './RsvpTable'

interface Props { params: Promise<{ id: string }> }

const SIDE_LABEL: Record<string, string> = {
  groom: '신랑측',
  bride: '신부측',
  baby: '주인공측',
}

export default async function RsvpPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/?auth=required')

  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true },
  })
  if (!invitation) notFound()

  const responses = await prisma.rsvpResponse.findMany({
    where: { invitationId: id },
    orderBy: { createdAt: 'desc' },
  })

  const totalAttending = responses.filter((r) => r.attending).length
  const totalDeclined = responses.filter((r) => !r.attending).length
  const totalParty = responses.filter((r) => r.attending).reduce((s, r) => s + r.partySize, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/my" className="inline-flex items-center gap-1 text-xs text-gray-400 mb-6">
        <ChevronLeft size={14} />
        내 초대장
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">참석 정보 조회</h1>
      <p className="text-sm text-gray-400 mb-6">{invitation.title} · 총 {responses.length}건</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400">참석</p>
          <p className="text-lg font-medium text-gray-900">{totalAttending}건</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400">불참</p>
          <p className="text-lg font-medium text-gray-900">{totalDeclined}건</p>
        </div>
        <div className="rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400">예상 참석 인원</p>
          <p className="text-lg font-medium text-gray-900">{totalParty}명</p>
        </div>
      </div>

      <RsvpTable
        rows={responses.map((r) => ({
          id: r.id,
          guestName: r.guestName,
          sideLabel: r.side ? (SIDE_LABEL[r.side] ?? r.side) : '-',
          attending: r.attending,
          partySize: r.partySize,
          meal: r.meal,
          phone: r.phone ?? null,
          message: r.message ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft, Eye, Users, BookOpen, ListChecks } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function StatsPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/?auth=required')

  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, title: true, viewCount: true },
  })
  if (!invitation) notFound()

  const since = new Date(Date.now() - 30 * 24 * 3600_000)
  const [visits30d, rsvpAttending, rsvpDeclined, guestbookCount, dailyVisits] = await Promise.all([
    prisma.visitLog.count({ where: { invitationId: id, visitedAt: { gte: since } } }),
    prisma.rsvpResponse.count({ where: { invitationId: id, attending: true } }),
    prisma.rsvpResponse.count({ where: { invitationId: id, attending: false } }),
    prisma.guestbookEntry.count({ where: { invitationId: id } }),
    prisma.visitLog.findMany({
      where: { invitationId: id, visitedAt: { gte: since } },
      select: { visitedAt: true },
      orderBy: { visitedAt: 'asc' },
    }),
  ])

  const buckets = new Map<string, number>()
  for (const v of dailyVisits) {
    const d = v.visitedAt
    const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  const series = Array.from(buckets.entries())
  const max = Math.max(1, ...series.map(([, n]) => n))

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/my" className="inline-flex items-center gap-1 text-xs text-gray-400 mb-6">
        <ChevronLeft size={14} />
        내 초대장
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">통계 조회</h1>
      <p className="text-sm text-gray-400 mb-8">{invitation.title}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="누적 조회수" value={invitation.viewCount} icon={Eye} />
        <StatCard label="30일 방문" value={visits30d} icon={Users} />
        <StatCard label="참석 응답" value={rsvpAttending} icon={ListChecks} />
        <StatCard label="방명록" value={guestbookCount} icon={BookOpen} />
      </div>

      <section className="border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">최근 30일 방문 추이</h2>
        {series.length === 0 ? (
          <p className="text-xs text-gray-400 py-8 text-center">아직 방문 기록이 없어요.</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {series.map(([date, n]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full bg-primary/80 rounded-sm"
                  style={{ height: `${(n / max) * 100}%` }}
                  title={`${date}: ${n}`}
                />
                <span className="text-[10px] text-gray-400 truncate">{date}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-3">RSVP 요약</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-400">참석</p>
            <p className="text-lg font-medium text-gray-900">{rsvpAttending}명</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-400">불참</p>
            <p className="text-lg font-medium text-gray-900">{rsvpDeclined}명</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-medium text-gray-900">{value.toLocaleString()}</p>
    </div>
  )
}

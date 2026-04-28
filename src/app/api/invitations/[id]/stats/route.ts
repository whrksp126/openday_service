import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const invitation = await prisma.invitation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, viewCount: true },
  })
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const since = new Date(Date.now() - 30 * 24 * 3600_000)
  const visits = await prisma.visitLog.findMany({
    where: { invitationId: id, visitedAt: { gte: since } },
    select: { visitedAt: true },
    orderBy: { visitedAt: 'asc' },
  })

  const buckets = new Map<string, number>()
  for (const v of visits) {
    const d = v.visitedAt
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  const daily = Array.from(buckets.entries()).map(([date, count]) => ({ date, count }))

  const [rsvpAttending, rsvpDeclined, guestbookCount] = await Promise.all([
    prisma.rsvpResponse.count({ where: { invitationId: id, attending: true } }),
    prisma.rsvpResponse.count({ where: { invitationId: id, attending: false } }),
    prisma.guestbookEntry.count({ where: { invitationId: id } }),
  ])

  return NextResponse.json({
    viewCount: invitation.viewCount,
    visits30d: visits.length,
    daily,
    rsvpAttending,
    rsvpDeclined,
    guestbookCount,
  })
}

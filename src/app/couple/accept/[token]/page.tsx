import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AcceptInviteClient from './AcceptInviteClient'

interface Props { params: Promise<{ token: string }> }

export default async function CoupleAcceptPage({ params }: Props) {
  const { token } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/?auth=required&next=/couple/accept/${encodeURIComponent(token)}`)
  }

  const invite = await prisma.coupleInvite.findUnique({
    where: { token },
    include: {
      invitation: { select: { id: true, title: true, slug: true, userId: true } },
    },
  })

  if (!invite) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-lg font-medium text-gray-900 mb-2">초대 링크를 찾을 수 없어요</h1>
        <p className="text-sm text-gray-400">링크가 만료되었거나 잘못된 주소일 수 있습니다.</p>
      </main>
    )
  }

  const expired = invite.expiresAt && invite.expiresAt < new Date()
  const isOwner = invite.invitation.userId === session.user.id
  const alreadyAcceptedByOther = invite.acceptedById && invite.acceptedById !== session.user.id

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-lg font-medium text-gray-900 mb-2">짝꿍 초대</h1>
      <p className="text-sm text-gray-500 mb-6 leading-6">
        <span className="text-gray-900 font-medium">{invite.invitation.title}</span> 초대장을 함께 편집하시겠어요?
      </p>
      {expired ? (
        <p className="text-sm text-red-500">이 링크는 만료되었습니다. 초대한 분께 새 링크를 요청해 주세요.</p>
      ) : isOwner ? (
        <p className="text-sm text-gray-400">본인이 만든 초대장이라 수락이 필요하지 않습니다.</p>
      ) : alreadyAcceptedByOther ? (
        <p className="text-sm text-red-500">이미 다른 분이 수락한 초대 링크입니다.</p>
      ) : (
        <AcceptInviteClient token={token} />
      )}
    </main>
  )
}

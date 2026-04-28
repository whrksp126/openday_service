import { prisma } from '@/lib/prisma'

export async function findEditableInvitation(invitationId: string, userId: string) {
  return prisma.invitation.findFirst({
    where: {
      id: invitationId,
      OR: [
        { userId },
        { coupleInvites: { some: { acceptedById: userId } } },
      ],
    },
  })
}

export async function isInvitationOwner(invitationId: string, userId: string): Promise<boolean> {
  const row = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { userId: true },
  })
  return !!row && row.userId === userId
}

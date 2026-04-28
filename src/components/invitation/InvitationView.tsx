'use client'

import type { InvitationContent, InvitationModule, InvitationStyles } from '@/types/invitation'
import PreviewPane from '@/components/editor/PreviewPane'

interface Invitation {
  id: string
  slug: string
  title: string
  contentJson: unknown
  modulesJson: unknown
  styles?: unknown
}

interface Props {
  invitation: Invitation
}

export default function InvitationView({ invitation }: Props) {
  const content = (invitation.contentJson ?? {}) as InvitationContent
  const modules = (invitation.modulesJson ?? []) as InvitationModule[]
  const styles = (invitation.styles ?? {}) as InvitationStyles

  return (
    <div className="min-h-screen bg-[#edeae6]">
      <div className="flex justify-center">
        <PreviewPane
          contentOverride={content}
          modulesOverride={modules}
          stylesOverride={styles}
          readOnly
        />
      </div>
    </div>
  )
}

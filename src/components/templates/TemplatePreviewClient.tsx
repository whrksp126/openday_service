'use client'

import PreviewPane from '@/components/editor/PreviewPane'
import type { InvitationContent, InvitationModule, InvitationStyles } from '@/types/invitation'

interface Props {
  content: InvitationContent
  modules: InvitationModule[]
  styles: InvitationStyles
}

export default function TemplatePreviewClient({ content, modules, styles }: Props) {
  return (
    <div className="flex justify-center">
      <PreviewPane
        readOnly
        contentOverride={content}
        modulesOverride={modules}
        stylesOverride={styles}
      />
    </div>
  )
}

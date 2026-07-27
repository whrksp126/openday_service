'use client'

import PreviewPane from '@/components/editor/PreviewPane'
import BgmFloatingPlayer from '@/components/editor/BgmFloatingPlayer'
import type { InvitationContent, InvitationModule, InvitationStyles } from '@/types/invitation'

interface Props {
  content: InvitationContent
  modules: InvitationModule[]
  styles: InvitationStyles
  categorySlug?: string | null
}

export default function TemplatePreviewClient({ content, modules, styles, categorySlug }: Props) {
  return (
    <div className="flex justify-center">
      <div className="relative w-[375px]">
        {styles.bgm?.url && (
          <BgmFloatingPlayer cfg={styles.bgm} mode="standalone" />
        )}
        <PreviewPane
          readOnly
          contentOverride={content}
          modulesOverride={modules}
          stylesOverride={styles}
          categorySlug={categorySlug}
        />
      </div>
    </div>
  )
}

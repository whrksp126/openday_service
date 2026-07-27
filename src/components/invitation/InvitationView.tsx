'use client'

import { useEffect, useState } from 'react'
import type { InvitationContent, InvitationModule, InvitationStyles } from '@/types/invitation'
import PreviewPane from '@/components/editor/PreviewPane'
import BgmFloatingPlayer from '@/components/editor/BgmFloatingPlayer'

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
  categorySlug?: string | null
}

const DESIGN_WIDTH = 375

export default function InvitationView({ invitation, categorySlug }: Props) {
  const content = (invitation.contentJson ?? {}) as InvitationContent
  const modules = (invitation.modulesJson ?? []) as InvitationModule[]
  const styles = (invitation.styles ?? {}) as InvitationStyles

  // 화면이 디자인 폭(375)보다 좁을 때만 축소. 넓을 때는 1 고정 — 절대 확대하지 않음
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      setScale(Math.min(1, window.innerWidth / DESIGN_WIDTH))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const zoomDisabled = styles.zoomDisabled ?? true
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'viewport'
      document.head.appendChild(meta)
    }
    const prev = meta.content
    meta.content = zoomDisabled
      ? 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      : 'width=device-width, initial-scale=1'
    return () => {
      if (created) meta?.remove()
      else if (meta) meta.content = prev
    }
  }, [zoomDisabled])

  return (
    <div className="min-h-screen bg-[#edeae6] overflow-x-hidden">
      <div className="flex justify-center relative">
        <div
          className="relative"
          style={{
            width: DESIGN_WIDTH,
            // zoom 은 transform 과 달리 layout 까지 같이 축소해서 빈 공간이 남지 않는다
            zoom: scale,
          }}
        >
          {styles.bgm?.url && (
            <BgmFloatingPlayer cfg={styles.bgm} mode="standalone" />
          )}
          <PreviewPane
            contentOverride={content}
            modulesOverride={modules}
            stylesOverride={styles}
            readOnly
            live
            invitationId={invitation.id}
            categorySlug={categorySlug}
          />
        </div>
      </div>
    </div>
  )
}

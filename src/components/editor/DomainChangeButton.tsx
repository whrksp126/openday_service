'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { useEditorStore } from '@/store/editor'
import SlugChangeModal from '@/components/my/SlugChangeModal'

export default function DomainChangeButton() {
  const mode = useEditorStore((s) => s.mode)
  const invitationId = useEditorStore((s) => s.invitationId)
  const slug = useEditorStore((s) => s.slug)
  const setSlug = useEditorStore((s) => s.setSlug)
  const [open, setOpen] = useState(false)

  if (mode === 'template') return null
  if (!invitationId || !slug) return null

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-gray-400" strokeWidth={1.5} />
        <p className="text-sm font-medium text-gray-900">초대장 도메인</p>
      </div>
      <p className="text-xs text-gray-500 truncate">/i/{slug}</p>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition-colors"
      >
        도메인 변경
      </button>
      {open && (
        <SlugChangeModal
          invitationId={invitationId}
          currentSlug={slug}
          onClose={() => setOpen(false)}
          onChanged={(next) => setSlug(next)}
          refreshOnSuccess={false}
        />
      )}
    </div>
  )
}

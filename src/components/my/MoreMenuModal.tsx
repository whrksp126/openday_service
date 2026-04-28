'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, BookOpen, ListChecks, Globe, UserPlus, Copy as CopyIcon, Trash2, Info } from 'lucide-react'
import SlugChangeModal from './SlugChangeModal'
import CoupleInviteModal from './CoupleInviteModal'

interface Props {
  invitationId: string
  slug: string
  title: string
  onClose: () => void
}

export default function MoreMenuModal({ invitationId, slug, title, onClose }: Props) {
  const router = useRouter()
  const [showSlug, setShowSlug] = useState(false)
  const [showCouple, setShowCouple] = useState(false)
  const [busy, setBusy] = useState<'duplicate' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function duplicate() {
    if (busy) return
    setBusy('duplicate')
    setError(null)
    try {
      const r = await fetch(`/api/invitations/${invitationId}/duplicate`, { method: 'POST' })
      if (!r.ok) throw new Error()
      router.refresh()
      onClose()
    } catch {
      setError('복제에 실패했습니다.')
      setBusy(null)
    }
  }

  async function remove() {
    if (busy) return
    if (!confirm(`"${title}" 초대장을 삭제할까요?\n삭제된 초대장은 복구할 수 없어요.`)) return
    setBusy('delete')
    setError(null)
    try {
      const r = await fetch(`/api/invitations/${invitationId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      router.refresh()
      onClose()
    } catch {
      setError('삭제에 실패했습니다.')
      setBusy(null)
    }
  }

  if (showSlug) {
    return (
      <SlugChangeModal
        invitationId={invitationId}
        currentSlug={slug}
        onClose={() => { setShowSlug(false); onClose() }}
      />
    )
  }
  if (showCouple) {
    return (
      <CoupleInviteModal
        invitationId={invitationId}
        onClose={() => { setShowCouple(false); onClose() }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-100 max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xs font-medium text-gray-700 mb-3">통계 및 관리</h3>
        <div className="space-y-1 mb-4">
          <Link href={`/my/${invitationId}/stats`} className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 bg-white">
                <BarChart3 size={14} className="text-gray-700" />
              </span>
              <span className="text-sm text-gray-900">통계 조회</span>
            </div>
          </Link>
          <Link href={`/my/${invitationId}/guestbook`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 bg-white">
              <BookOpen size={14} className="text-gray-700" />
            </span>
            <span className="text-sm text-gray-900">방명록 조회</span>
          </Link>
          <Link href={`/my/${invitationId}/rsvp`} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 bg-white">
              <ListChecks size={14} className="text-gray-700" />
            </span>
            <span className="text-sm text-gray-900">참석 정보 조회</span>
          </Link>
          <button onClick={() => setShowSlug(true)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 bg-white">
              <Globe size={14} className="text-gray-700" />
            </span>
            <span className="text-sm text-gray-900">도메인 변경</span>
          </button>
        </div>

        <div className="border-t border-gray-100 pt-3 mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2 inline-flex items-center gap-1">
            짝꿍 <Info size={12} className="text-gray-300" />
          </p>
          <button onClick={() => setShowCouple(true)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-100 bg-white">
              <UserPlus size={14} className="text-gray-700" />
            </span>
            <span className="text-sm text-gray-900">초대 링크 만들기</span>
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={duplicate}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-700 disabled:opacity-50"
          >
            <CopyIcon size={12} />
            {busy === 'duplicate' ? '복제 중...' : '복제'}
          </button>
          <button
            onClick={remove}
            disabled={busy !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-red-100 text-red-500 disabled:opacity-50"
          >
            <Trash2 size={12} />
            {busy === 'delete' ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}

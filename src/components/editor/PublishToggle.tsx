'use client'

import { useCallback, useState } from 'react'
import { useEditorStore } from '@/store/editor'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
      style={{ width: 28, height: 16, backgroundColor: checked ? '#21AFBF' : '#e5e7eb' }}
    >
      <span
        className="absolute rounded-full transition-all duration-200"
        style={{
          width: 12, height: 12,
          top: 2,
          left: checked ? 14 : 2,
          backgroundColor: 'white',
        }}
      />
    </button>
  )
}

export default function PublishToggle() {
  const { mode, invitationId, isPublished, setIsPublished } = useEditorStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = useCallback(async () => {
    if (!invitationId || busy) return
    const next = !isPublished
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: next }),
      })
      if (!r.ok) throw new Error()
      setIsPublished(next)
    } catch {
      setError(next ? '발행에 실패했습니다.' : '발행 취소에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }, [invitationId, isPublished, busy, setIsPublished])

  if (mode === 'template') return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{isPublished ? '발행됨' : '미발행'}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isPublished ? '링크로 누구나 볼 수 있어요.' : '발행해야 링크 공유가 가능해요.'}
        </p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <Toggle checked={isPublished} onChange={() => { if (!busy) toggle() }} />
    </div>
  )
}

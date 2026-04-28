'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/invitations/couple/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!r.ok) throw new Error()
      router.push('/my')
    } catch {
      setError('수락에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={accept}
        disabled={busy}
        className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-white disabled:opacity-50"
      >
        {busy ? '수락 중...' : '초대 수락하기'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  invitationId: string
  currentSlug: string
  onClose: () => void
  onChanged?: (slug: string) => void
}

const SLUG_RE = /^[a-zA-Z0-9-]{3,50}$/

export default function SlugChangeModal({ invitationId, currentSlug, onClose, onChanged }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(currentSlug)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (busy) return
    if (!SLUG_RE.test(value)) {
      setError('영문, 숫자, 하이픈만 사용해 3~50자로 입력해주세요.')
      return
    }
    if (value === currentSlug) {
      onClose()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/invitations/${invitationId}/slug`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: value }),
      })
      if (r.status === 409) {
        setError('이미 사용 중인 도메인이에요. 다른 이름을 시도해주세요.')
        setBusy(false)
        return
      }
      if (!r.ok) throw new Error()
      onChanged?.(value)
      router.refresh()
      onClose()
    } catch {
      setError('도메인 변경에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-100 max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">도메인 변경</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3 leading-5">
          초대장 주소 끝부분에 들어갈 도메인을 입력하세요.<br />
          공유된 기존 링크는 더 이상 동작하지 않으니 신중히 선택하세요.
        </p>
        <label className="block text-xs text-gray-500 mb-1.5">새 도메인</label>
        <div className="flex items-stretch gap-2 mb-2">
          <span className="flex items-center px-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-400">/i/</span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="my-wedding"
            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-primary"
          />
        </div>
        <p className="text-xs text-gray-400 mb-4">영문, 숫자, 하이픈(-)만 사용해 3~50자.</p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs border border-gray-200 text-gray-700">
            취소
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium bg-primary text-white disabled:opacity-50"
          >
            {busy ? '변경 중...' : '변경하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check } from 'lucide-react'

interface Props {
  invitationId: string
  onClose: () => void
}

interface InviteRow {
  id: string
  token: string
  acceptedById: string | null
  acceptedBy: { name: string | null; email: string | null } | null
  createdAt: string
}

export default function CoupleInviteModal({ invitationId, onClose }: Props) {
  const [list, setList] = useState<InviteRow[]>([])
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    let cancelled = false
    fetch(`/api/invitations/${invitationId}/couple`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { invites: InviteRow[] }) => { if (!cancelled) setList(data.invites) })
      .catch(() => { if (!cancelled) setError('초대 목록을 불러올 수 없습니다.') })
    return () => { cancelled = true }
  }, [invitationId])

  async function create() {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const r = await fetch(`/api/invitations/${invitationId}/couple`, { method: 'POST' })
      if (!r.ok) throw new Error()
      const data = (await r.json()) as { invite: InviteRow }
      setList((prev) => [data.invite, ...prev])
    } catch {
      setError('초대 링크를 만들 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setCreating(false)
    }
  }

  async function copy(id: string, token: string) {
    const link = `${origin}/couple/accept/${token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-gray-900">짝꿍 초대 링크</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-5">
          짝꿍에게 보낼 링크를 만들어 보세요. 짝꿍이 링크를 열어 수락하면 같은 초대장을 함께 편집할 수 있습니다.
        </p>

        <button
          onClick={create}
          disabled={creating}
          className="w-full py-2.5 rounded-xl text-xs font-medium bg-primary text-white mb-4 disabled:opacity-50"
        >
          {creating ? '만드는 중...' : '+ 새 초대 링크 만들기'}
        </button>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">아직 만든 초대 링크가 없습니다.</p>
          ) : (
            list.map((inv) => {
              const link = `${origin}/couple/accept/${inv.token}`
              const accepted = !!inv.acceptedById
              return (
                <div key={inv.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs ${accepted ? 'text-primary' : 'text-gray-400'}`}>
                      {accepted
                        ? `${inv.acceptedBy?.name ?? inv.acceptedBy?.email ?? '짝꿍'} 수락 완료`
                        : '대기 중'}
                    </span>
                    <span className="text-xs text-gray-300">
                      {new Date(inv.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex items-stretch gap-2">
                    <input
                      type="text"
                      readOnly
                      value={link}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-gray-50"
                    />
                    <button
                      onClick={() => copy(inv.id, inv.token)}
                      className={`flex items-center gap-1 px-2.5 rounded-lg text-xs border ${
                        copiedId === inv.id ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {copiedId === inv.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === inv.id ? '복사됨' : '복사'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

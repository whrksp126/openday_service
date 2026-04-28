'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface Entry {
  id: string
  authorName: string
  message: string
  createdAt: string
}

export default function GuestbookList({ invitationId, initialEntries }: { invitationId: string; initialEntries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function remove(id: string) {
    if (busyId) return
    if (!confirm('이 방명록을 삭제할까요?')) return
    setBusyId(id)
    try {
      const r = await fetch(`/api/invitations/${invitationId}/guestbook/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">아직 작성된 방명록이 없어요.</p>
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium text-gray-900">{e.authorName}</p>
            <button
              onClick={() => remove(e.id)}
              disabled={busyId === e.id}
              className="text-gray-300 hover:text-red-500 disabled:opacity-50"
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">{e.message}</p>
          <p className="text-xs text-gray-400 mt-2">{new Date(e.createdAt).toLocaleString('ko-KR')}</p>
        </div>
      ))}
    </div>
  )
}

'use client'

import { useCallback, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useEditorStore } from '@/store/editor'
import { captureAndUploadThumbnail } from '@/lib/capture-thumbnail'

export default function ThumbnailUpdater() {
  const mode = useEditorStore((s) => s.mode)
  const invitationId = useEditorStore((s) => s.invitationId)
  const templateId = useEditorStore((s) => s.templateId)
  const share = useEditorStore((s) => s.share)
  const setShare = useEditorStore((s) => s.setShare)
  const setBgmCaptureMuted = useEditorStore((s) => s.setBgmCaptureMuted)
  const spacingColor = useEditorStore((s) => s.styles.spacingColor)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const thumbnailUrl = share.thumbnailUrl

  const handleClick = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    setBgmCaptureMuted(true)
    try {
      const isTpl = mode === 'template'
      const url = await captureAndUploadThumbnail(spacingColor, {
        invitationId: isTpl ? null : invitationId,
        templateId: isTpl ? templateId : null,
      })
      setShare({ thumbnailUrl: url })
      const isTemplate = mode === 'template'
      const targetId = isTemplate ? templateId : invitationId
      if (targetId) {
        try {
          await fetch(
            isTemplate ? `/api/templates/${targetId}` : `/api/invitations/${targetId}`,
            {
              method: isTemplate ? 'PATCH' : 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                isTemplate ? { thumbnail: url } : { thumbnailUrl: url },
              ),
            },
          )
        } catch {
          // invitation 모드는 다음 자동저장 때 재시도. template 모드는 명시적 저장 시 함께 반영.
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '캡처에 실패했습니다.')
    } finally {
      setBusy(false)
      setBgmCaptureMuted(false)
    }
  }, [busy, mode, invitationId, templateId, setBgmCaptureMuted, setShare, spacingColor])

  return (
    <div className="space-y-2">
      {thumbnailUrl ? (
        <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt="공유 썸네일"
            className="w-full aspect-square object-cover"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 aspect-square flex items-center justify-center">
          <p className="text-xs text-gray-400">아직 썸네일이 없어요</p>
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={busy}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        <RefreshCw size={12} className={busy ? 'animate-spin' : ''} />
        {busy ? '캡처 중...' : (thumbnailUrl ? '썸네일 다시 캡처하기' : '메인 영역으로 썸네일 만들기')}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

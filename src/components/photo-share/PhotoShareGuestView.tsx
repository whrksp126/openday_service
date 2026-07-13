'use client'

import { useCallback, useEffect, useState } from 'react'
import { Camera, Trash2, Plus } from 'lucide-react'
import { useImageLightbox } from '@/components/shared/ImageLightboxProvider'
import PhotoUploadModal from './PhotoUploadModal'

interface SubmissionItem {
  id: string
  authorName: string
  relation: string
  driveFileId?: string
  driveThumbnailUrl: string | null
  driveDirectUrl: string | null
  mimeType: string
  width: number | null
  height: number | null
  createdAt: string
}

interface ListResponse {
  items: SubmissionItem[]
  nextCursor: string | null
}

interface Props {
  invitationId: string
  moduleId: string
  accent: string
  showEnglish: boolean
  /** 에디터에서는 그리드만 보여주고 업로드 버튼은 비활성. 발행 후에만 업로드 가능. */
  editorMode?: boolean
  config: {
    koreanTitle?: string
    koreanLabelVisible?: boolean
    englishTitle?: string
    labelVisible?: boolean
    titleBig?: string
    titleBigVisible?: boolean
    titleSmall?: string
    titleSmallVisible?: boolean
    previewPublic?: boolean
    variant?: 'grid' | 'masonry' | 'feed'
  }
}

/**
 * Drive 파일을 큰 이미지로 보여주는 URL.
 * thumbnailLink (=s220) 는 작아서 라이트박스에 부적합하고,
 * webContentLink 는 다운로드용이라 브라우저 inline 표시 안 됨.
 * lh3.googleusercontent.com/d/{id}=w2000 은 공개 파일을 큰 사이즈로 inline 표시.
 */
function buildLightboxSrc(item: SubmissionItem): string {
  if (item.driveFileId) {
    return `https://lh3.googleusercontent.com/d/${item.driveFileId}=w2000`
  }
  return item.driveDirectUrl ?? item.driveThumbnailUrl ?? ''
}

export default function PhotoShareGuestView({ invitationId, moduleId, accent, showEnglish, config, editorMode = false }: Props) {
  const lightbox = useImageLightbox()
  const [items, setItems] = useState<SubmissionItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [openUpload, setOpenUpload] = useState(false)
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({})

  const previewPublic = config.previewPublic !== false

  const fetchItems = useCallback(async (cursor?: string) => {
    if (!previewPublic) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '20')
      params.set('moduleId', moduleId)
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/invitations/${invitationId}/photo-share/submission?${params.toString()}`)
      if (!res.ok) return
      const j: ListResponse = await res.json()
      setItems((prev) => (cursor ? [...prev, ...j.items] : j.items))
      setNextCursor(j.nextCursor)
    } finally {
      setLoading(false)
    }
  }, [invitationId, moduleId, previewPublic])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // localStorage에서 본인 토큰 매핑 복원
  useEffect(() => {
    if (typeof window === 'undefined') return
    const map: Record<string, string> = {}
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith('ps_token_')) {
        const id = key.slice('ps_token_'.length)
        map[id] = window.localStorage.getItem(key) ?? ''
      }
    }
    setTokenMap(map)
  }, [items.length])

  const handleUploaded = useCallback((res: { id: string; driveFileId?: string; thumbnailUrl: string | null; driveDirectUrl: string | null; authorName: string; relation: string; createdAt: string; deleteToken: string }) => {
    const newItem: SubmissionItem = {
      id: res.id,
      authorName: res.authorName,
      relation: res.relation,
      driveFileId: res.driveFileId,
      driveThumbnailUrl: res.thumbnailUrl,
      driveDirectUrl: res.driveDirectUrl,
      mimeType: 'image/jpeg',
      width: null,
      height: null,
      createdAt: res.createdAt,
    }
    setItems((prev) => [newItem, ...prev])
    setTokenMap((m) => ({ ...m, [res.id]: res.deleteToken }))
  }, [])

  const handleDelete = useCallback(async (item: SubmissionItem) => {
    const token = tokenMap[item.id]
    if (!token) return
    if (!window.confirm('이 사진을 삭제할까요?')) return
    const res = await fetch(`/api/invitations/${invitationId}/photo-share/submission/${item.id}`, {
      method: 'DELETE',
      headers: { 'x-delete-token': token },
    })
    if (!res.ok) return
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    try { window.localStorage.removeItem(`ps_token_${item.id}`) } catch { /* noop */ }
    setTokenMap((m) => {
      const next = { ...m }
      delete next[item.id]
      return next
    })
  }, [invitationId, tokenMap])

  const koreanTitle = config.koreanTitle ?? '사진 공유'
  const englishTitle = config.englishTitle ?? 'Photo Share'

  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {config.koreanLabelVisible !== false && (
        <p className="text-sm mb-1" style={{ color: accent }}>{koreanTitle}</p>
      )}
      {showEnglish && config.labelVisible !== false && (
        <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif' }}>{englishTitle}</p>
      )}
      {config.titleBigVisible !== false && config.titleBig && (
        <div className="text-sm text-gray-800 mb-1">{config.titleBig}</div>
      )}
      {config.titleSmallVisible !== false && config.titleSmall && (
        <div className="text-xs text-gray-400 mb-3">{config.titleSmall}</div>
      )}

      {!editorMode && (
        <button
          type="button"
          onClick={() => setOpenUpload(true)}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-white"
          style={{ backgroundColor: accent }}
        >
          <Plus size={14} /> 사진 보내기
        </button>
      )}

      {previewPublic ? (
        <div className="mt-5">
          {items.length === 0 && !loading ? (
            <div className="w-full py-6 text-xs text-gray-400 flex flex-col items-center gap-2">
              <Camera size={20} className="text-gray-300" strokeWidth={1} />
              아직 사진이 없어요. 첫 번째 사진을 남겨주세요.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {items.map((item) => {
                const isMine = !!tokenMap[item.id]
                // 그리드 썸네일은 작은 사이즈로 충분 — Drive thumbnailLink (s220) 또는 lh3 작은 사이즈 fallback.
                const thumbSrc = item.driveThumbnailUrl
                  ?? (item.driveFileId ? `https://lh3.googleusercontent.com/d/${item.driveFileId}=w400` : item.driveDirectUrl ?? '')
                const lightboxSrc = buildLightboxSrc(item)
                return (
                  <div key={item.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 group">
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbSrc}
                        alt={`${item.authorName} ${item.relation}`}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => lightboxSrc && lightbox?.open(lightboxSrc)}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">로드 실패</div>
                    )}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/40 text-white text-[10px] text-left">
                      <span className="block truncate">{item.authorName}</span>
                      <span className="block truncate text-white/70 text-[9px]">{item.relation}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {nextCursor && (
            <button
              type="button"
              onClick={() => fetchItems(nextCursor)}
              className="mt-4 text-xs text-gray-400 hover:text-gray-700"
            >
              더보기
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-gray-400 leading-5">
          이 앨범은 비공개로 설정되어 있어요.<br />
          올린 사진은 행사 주최자만 확인할 수 있어요.
        </p>
      )}

      <PhotoUploadModal
        invitationId={invitationId}
        moduleId={moduleId}
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onUploaded={handleUploaded}
        accent={accent}
      />
    </section>
  )
}

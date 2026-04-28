'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Image as ImageIcon, Link as LinkIcon, MessageCircleMore, QrCode, MoreHorizontal, Edit3 } from 'lucide-react'
import QrModal from './QrModal'
import MoreMenuModal from './MoreMenuModal'
import { getKakaoTemplateId, shareKakaoCustom, shareKakaoFeed } from '@/lib/kakao'
import { toAbsoluteUrl } from '@/lib/share-fallback'

export interface InvitationCardData {
  id: string
  slug: string
  title: string
  isPublished: boolean
  thumbnailUrl: string | null
  categoryName: string | null
  linkShareTitle: string | null
  linkShareText: string | null
  kakaoShareTitle: string | null
  kakaoShareText: string | null
  kakaoShareExtra: string | null
  fallbackTitle: string
  fallbackText: string | null
  fallbackExtra: string | null
  eventDateText: string | null
}

export default function InvitationCard({ data }: { data: InvitationCardData }) {
  const [toast, setToast] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/i/${data.slug}`

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }, [])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('링크가 복사되었습니다')
    } catch {
      showToast('복사에 실패했습니다')
    }
  }, [shareUrl, showToast])

  const handleKakao = useCallback(() => {
    if (!data.isPublished) {
      showToast('초대장을 먼저 발행해 주세요')
      return
    }
    const title = data.kakaoShareTitle ?? data.linkShareTitle ?? data.fallbackTitle
    const description = [
      data.kakaoShareText ?? data.fallbackText ?? '',
      data.kakaoShareExtra ?? data.fallbackExtra ?? '',
    ].filter(Boolean).join('\n')
    const imageUrl = toAbsoluteUrl(data.thumbnailUrl, origin) ?? ''

    const templateId = getKakaoTemplateId()
    try {
      // 콘솔에 등록된 사용자 정의 메시지 템플릿이 있으면 sendCustom (큰 풀폭 버튼 카드).
      // 없으면 sendDefault feed 로 폴백 (PC 카톡에서 버튼 안 보일 수 있음).
      if (templateId) {
        shareKakaoCustom({
          templateId,
          templateArgs: {
            title,
            description,
            slug: data.slug,
            THU: imageUrl,
          },
        })
      } else {
        shareKakaoFeed({
          objectType: 'feed',
          content: {
            title,
            description,
            imageUrl,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          buttons: [{ title: '초대장 보기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
        })
      }
    } catch {
      showToast('카카오톡 공유 설정이 필요합니다')
    }
  }, [data, shareUrl, showToast, origin])

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="aspect-[3/4] bg-gray-100 relative">
          {data.thumbnailUrl ? (
            <img src={data.thumbnailUrl} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-2">
              <ImageIcon size={36} strokeWidth={1.5} />
              <p className="text-xs">에디터에서 썸네일을 만들어 주세요</p>
            </div>
          )}
          <Link
            href={`/editor/${data.id}`}
            className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900/70 text-white"
          >
            <Edit3 size={12} />
            에디터
          </Link>
        </div>

        <div className="p-4">
          <p className="text-sm font-medium text-gray-900 truncate">{data.title}</p>
          <p className="text-xs text-gray-400 mt-1 truncate">
            도메인: <span className="text-gray-700">{data.slug}</span>
            {!data.isPublished && <span className="ml-2 text-gray-300">· 비공개</span>}
            {data.categoryName && <span className="ml-2 text-gray-300">· {data.categoryName}</span>}
          </p>

          <div className="grid grid-cols-4 gap-1 mt-3 -mx-1">
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs text-gray-700 hover:bg-gray-50"
            >
              <LinkIcon size={16} className="text-gray-700" />
              링크
            </button>
            <button
              onClick={handleKakao}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs text-gray-700 hover:bg-gray-50"
            >
              <MessageCircleMore size={16} className="text-gray-700" />
              카카오톡
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs text-gray-700 hover:bg-gray-50"
            >
              <QrCode size={16} className="text-gray-700" />
              QR
            </button>
            <button
              onClick={() => setShowMore(true)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs text-gray-700 hover:bg-gray-50"
            >
              <MoreHorizontal size={16} className="text-gray-700" />
              더보기
            </button>
          </div>
        </div>
      </div>

      {showQr && (
        <QrModal
          url={shareUrl}
          filename={`${data.slug}-qr.png`}
          onClose={() => setShowQr(false)}
        />
      )}

      {showMore && (
        <MoreMenuModal
          invitationId={data.id}
          slug={data.slug}
          title={data.title}
          onClose={() => setShowMore(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-full">
          {toast}
        </div>
      )}
    </>
  )
}

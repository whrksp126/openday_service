// 링크/카카오톡 공유 액션 헬퍼.
// 에디터의 ShareGroupPanel 과 /my 페이지 InvitationCard 가 공용으로 사용한다.

import { getKakaoTemplateId, shareKakaoCustom, shareKakaoFeed } from './kakao'
import { toAbsoluteUrl } from './share-fallback'

export interface KakaoShareData {
  slug: string
  isPublished: boolean
  thumbnailUrl: string | null
  linkShareTitle: string | null
  kakaoShareTitle: string | null
  kakaoShareText: string | null
  kakaoShareExtra: string | null
  fallbackTitle: string
  fallbackText: string | null
  fallbackExtra: string | null
}

export async function copyShareLink(url: string): Promise<boolean> {
  if (!url) return false
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

// 카카오톡 공유 실행. 발행되지 않은 경우엔 호출 측에서 안내 메시지를 띄우게끔 false 반환.
export function shareToKakao(data: KakaoShareData, shareUrl: string, origin: string): { ok: true } | { ok: false; reason: 'unpublished' | 'sdk' } {
  if (!data.isPublished) return { ok: false, reason: 'unpublished' }

  const title = data.kakaoShareTitle ?? data.linkShareTitle ?? data.fallbackTitle
  const description = [
    data.kakaoShareText ?? data.fallbackText ?? '',
    data.kakaoShareExtra ?? data.fallbackExtra ?? '',
  ].filter(Boolean).join('\n')
  const imageUrl = toAbsoluteUrl(data.thumbnailUrl, origin) ?? ''

  const templateId = getKakaoTemplateId()
  try {
    if (templateId) {
      shareKakaoCustom({
        templateId,
        templateArgs: {
          title,
          description,
          slug: data.slug,
          THU: imageUrl,
          // 빌더의 비율을 '사용자 인자(${SC})' 로 두었을 때 원본 비율 유지(1) 강제.
          // 캡처 단계에서 이미 1:1 정사각으로 합성하므로 letterbox 없음.
          SC: '1',
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
    return { ok: true }
  } catch {
    return { ok: false, reason: 'sdk' }
  }
}

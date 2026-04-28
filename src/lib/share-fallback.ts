// 공유 메타데이터 fallback 계산 — 에디터 패널과 /my 카드가 공통으로 사용

interface ShareSourceContent {
  baby?: { name?: string }
  groom?: { first?: string }
  bride?: { first?: string }
  invitationTitle?: string
  title?: string
  eventDate?: string
  eventTime?: string
  venue?: { name?: string; hall?: string }
}

export function buildFallbackTitle(opts: {
  content: ShareSourceContent
  categorySlug?: string | null
  invitationTitle: string
}): string {
  const { content, categorySlug, invitationTitle } = opts
  if (categorySlug === 'baby' && content.baby?.name) {
    return `${content.baby.name}의 첫 생일에 초대합니다`
  }
  const groom = content.groom?.first
  const bride = content.bride?.first
  if (groom && bride) return `${groom} & ${bride} 결혼합니다`
  if (content.baby?.name) return `${content.baby.name}의 첫 생일에 초대합니다`
  return content.invitationTitle ?? content.title ?? invitationTitle
}

export function formatEventDateText(dateStr?: string | null, timeStr?: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const dow = days[d.getDay()]
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  let timeText = ''
  if (timeStr) {
    const m2 = /^(\d{1,2}):(\d{2})/.exec(timeStr)
    if (m2) {
      const h = Number(m2[1])
      const mm = m2[2]
      const ampm = h < 12 ? '오전' : '오후'
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      timeText = ` ${ampm} ${h12}시 ${mm}분`
    }
  }
  return `${y}. ${m}. ${day}. ${dow}${timeText}`
}

export function buildFallbackVenueText(content: ShareSourceContent): string | null {
  const parts = [content.venue?.name, content.venue?.hall].filter(Boolean) as string[]
  return parts.length ? parts.join(' ') : null
}

export function toAbsoluteUrl(url: string | null | undefined, origin: string): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${origin}${url}`
  return `${origin}/${url}`
}

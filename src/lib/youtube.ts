// YouTube URL/ID 파서 + 임베드 URL 빌더 + 타임코드 헬퍼
//
// 임베드 도메인은 youtube-nocookie.com 으로 통일 (트래킹 최소화).

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/

/**
 * 다양한 YouTube URL/ID 입력에서 11자 videoId만 추출.
 * 지원: youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>,
 *       youtube.com/shorts/<id>, youtube-nocookie.com/embed/<id>, raw <id>.
 * 추출 실패 시 null.
 */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null
  const raw = String(input).trim()
  if (!raw) return null

  // raw id (영상이 임베드 차단되어도 ID 자체는 유효할 수 있어 우선 매칭)
  if (YOUTUBE_ID_RE.test(raw)) return raw

  // URL 파싱
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '')
  const pathSegs = url.pathname.split('/').filter(Boolean)

  // youtu.be/<id>
  if (host === 'youtu.be') {
    const id = pathSegs[0]
    return id && YOUTUBE_ID_RE.test(id) ? id : null
  }

  // youtube.com / youtube-nocookie.com
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
    // /watch?v=<id>
    const v = url.searchParams.get('v')
    if (v && YOUTUBE_ID_RE.test(v)) return v
    // /embed/<id>, /shorts/<id>, /v/<id>, /live/<id>
    if (pathSegs.length >= 2 && ['embed', 'shorts', 'v', 'live'].includes(pathSegs[0])) {
      const id = pathSegs[1]
      if (id && YOUTUBE_ID_RE.test(id)) return id
    }
  }

  return null
}

interface BuildEmbedOptions {
  startSec?: number
  endSec?: number
  autoplay?: boolean
}

/**
 * youtube-nocookie embed URL 생성. IFrame Player API 와 함께 사용한다.
 * playsinline=1, rel=0, modestbranding=1 기본 적용.
 */
export function buildEmbedUrl(videoId: string, opts: BuildEmbedOptions = {}): string {
  const params = new URLSearchParams()
  // IFrame Player API 통신용 (필수)
  params.set('enablejsapi', '1')
  params.set('playsinline', '1')
  params.set('rel', '0')
  params.set('modestbranding', '1')
  if (opts.autoplay) params.set('autoplay', '1')
  if (typeof opts.startSec === 'number' && opts.startSec > 0) params.set('start', String(Math.floor(opts.startSec)))
  if (typeof opts.endSec === 'number' && opts.endSec > 0) params.set('end', String(Math.floor(opts.endSec)))
  // 일부 브라우저에서 origin 파라미터가 필요한 경우 사용처에서 추가 가능
  if (typeof window !== 'undefined') params.set('origin', window.location.origin)
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

/**
 * "1:30" → 90, "0:05" → 5, "70" → 70, "" → null.
 * 시:분:초 (h:m:s) 도 허용. 음수/NaN 은 null.
 */
export function parseTimecode(input: string | null | undefined): number | null {
  if (input === null || input === undefined) return null
  const s = String(input).trim()
  if (!s) return null
  const parts = s.split(':').map((p) => p.trim())
  if (parts.some((p) => p === '' || !/^\d+$/.test(p))) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => Number.isNaN(n) || n < 0)) return null
  let total = 0
  if (nums.length === 1) total = nums[0]
  else if (nums.length === 2) total = nums[0] * 60 + nums[1]
  else if (nums.length === 3) total = nums[0] * 3600 + nums[1] * 60 + nums[2]
  else return null
  return total
}

/**
 * 90 → "1:30", 5 → "0:05". 1시간 이상은 "h:mm:ss".
 */
export function formatTimecode(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || Number.isNaN(sec) || sec < 0) return ''
  const total = Math.floor(sec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * YouTube 기본 썸네일(hqdefault) URL. 사용자가 posterUrl 미지정 시 폴백.
 * mqdefault/hqdefault/sddefault/maxresdefault 중 hqdefault 가 가장 안정적.
 */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

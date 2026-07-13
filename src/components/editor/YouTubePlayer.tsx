'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { buildEmbedUrl, youtubeThumbnailUrl } from '@/lib/youtube'
import { useEditorStore } from '@/store/editor'


// ── IFrame API 글로벌 로더 ────────────────────────────────────────────────
//
// 같은 페이지에서 동영상 모듈이 여러 개 있어도 https://www.youtube.com/iframe_api 는
// 정확히 한 번만 로드한다. 또한 활성 플레이어를 추적해 새 영상 재생 시 다른 영상을
// 일시정지한다.

interface YT_PlayerVars {
  playsinline?: number
  rel?: number
  modestbranding?: number
  autoplay?: number
  enablejsapi?: number
  origin?: string
}

interface YT_PlayerOptions {
  videoId: string
  playerVars?: YT_PlayerVars
  events?: {
    onReady?: (event: { target: YT_Player }) => void
    onStateChange?: (event: { target: YT_Player; data: number }) => void
    onError?: (event: { data: number }) => void
  }
}

interface YT_Player {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  getCurrentTime: () => number
  getPlayerState: () => number
  destroy: () => void
}

interface YTNamespace {
  Player: new (el: HTMLElement | string, opts: YT_PlayerOptions) => YT_Player
  PlayerState: { UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
    __ydApiPromise?: Promise<YTNamespace>
    __ydActivePlayers?: Map<symbol, YT_Player>
  }
}

function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window unavailable'))
  }
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (window.__ydApiPromise) return window.__ydApiPromise

  window.__ydApiPromise = new Promise<YTNamespace>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      try { prev?.() } catch { /* noop */ }
      if (window.YT) resolve(window.YT)
    }
    if (!document.querySelector('script[data-yt-api]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      tag.dataset.ytApi = '1'
      document.head.appendChild(tag)
    }
  })
  return window.__ydApiPromise
}

function getActiveMap(): Map<symbol, YT_Player> {
  if (typeof window === 'undefined') return new Map()
  if (!window.__ydActivePlayers) window.__ydActivePlayers = new Map()
  return window.__ydActivePlayers
}

interface Props {
  videoId: string
  posterUrl?: string
  className?: string
  /** Tailwind aspect-* 키. 미지정 시 16/9 컨테이너에 맞춤 */
  aspect?: 'video' | 'square' | 'portrait'
  /** 재생 종료 시 호출 — 필요 시 캡션 변경 등 부수효과용 */
  onEnded?: () => void
}

export default function YouTubePlayer({
  videoId,
  posterUrl,
  className,
  aspect = 'video',
  onEnded,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YT_Player | null>(null)
  const tokenRef = useRef<symbol>(Symbol('yt-player'))
  const [activated, setActivated] = useState(false)
  const [embedError, setEmbedError] = useState(false)

  // editor store. mode 미사용 — store 가 항상 존재하므로 hook 호출은 안전.
  const setBgmIntent = useEditorStore((s) => s.setBgmIntent)

  // 외부에 발행할 BGM pause/resume 이벤트.
  // 1) editor 모드에서는 store.setBgmIntent 가 BgmFloatingPlayer 를 즉시 제어
  // 2) standalone(발행 뷰)에서는 store 가 비어 있을 수 있으므로 window 이벤트도 함께 발행
  const emitBgmPause = useCallback(() => {
    try { setBgmIntent('paused') } catch { /* noop */ }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openday:bgm-pause'))
    }
  }, [setBgmIntent])

  const emitBgmResume = useCallback(() => {
    try { setBgmIntent('playing') } catch { /* noop */ }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openday:bgm-resume'))
    }
  }, [setBgmIntent])

  // 컴포넌트 unmount 시 player destroy + active map 에서 제거
  useEffect(() => {
    const token = tokenRef.current
    return () => {
      const map = getActiveMap()
      map.delete(token)
      try { playerRef.current?.destroy() } catch { /* noop */ }
      playerRef.current = null
    }
  }, [])

  // 클릭 → IFrame Player API 초기화
  const activate = useCallback(() => {
    if (activated) return
    setActivated(true)

    // 다른 active player 모두 일시정지
    const map = getActiveMap()
    map.forEach((p, key) => {
      if (key === tokenRef.current) return
      try { p.pauseVideo() } catch { /* noop */ }
    })

    // BGM 정지 신호 (editor + standalone 모두 idempotent)
    emitBgmPause()

    loadYouTubeApi().then((YT) => {
      const el = containerRef.current
      if (!el) return
      try {
        const player = new YT.Player(el, {
          videoId,
          playerVars: {
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            autoplay: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (e) => {
              playerRef.current = e.target
              getActiveMap().set(tokenRef.current, e.target)
              try { e.target.playVideo() } catch { /* noop */ }
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.ENDED) {
                emitBgmResume()
                onEnded?.()
              }
            },
            onError: () => {
              setEmbedError(true)
            },
          },
        })
        playerRef.current = player
      } catch {
        setEmbedError(true)
      }
    }).catch(() => setEmbedError(true))
  }, [activated, videoId, emitBgmPause, emitBgmResume, onEnded])

  const aspectClass = aspect === 'square' ? 'aspect-square' : aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-video'
  const poster = posterUrl || youtubeThumbnailUrl(videoId)

  // 임베드 차단된 영상: 원본 링크만 노출
  if (embedError) {
    return (
      <div className={`${aspectClass} w-full bg-gray-100 border border-gray-100 rounded-2xl flex items-center justify-center px-6 ${className ?? ''}`}>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">이 영상은 임베드가 차단되어 있어요.</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xs text-[#5B4FCF] underline"
          >YouTube 에서 보기</a>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${aspectClass} bg-black overflow-hidden ${className ?? ''}`}>
      {!activated ? (
        <button
          type="button"
          onClick={activate}
          className="group absolute inset-0 w-full h-full"
          aria-label="동영상 재생"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => { /* 썸네일 실패는 무시 — 검은 배경 위 재생 버튼 */ }}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <span className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center">
              <Play size={22} className="ml-1 text-gray-900 fill-current" />
            </span>
          </span>
        </button>
      ) : (
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      )}
      {/* 임베드용 폴백 — JS API 로드 전 사용자에게 보여줄 것이 없도록 빈 iframe 미리 렌더하지 않는다 */}
      {!activated && !embedError && (
        // 검색 엔진 / SSR 안전을 위한 hidden meta link (실제 재생은 activate 시점)
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
      )}
      {/* lint: buildEmbedUrl 미사용 경고 회피용 — 향후 noscript 폴백에 사용 */}
      <noscript>
        <iframe
          src={buildEmbedUrl(videoId)}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </noscript>
    </div>
  )
}

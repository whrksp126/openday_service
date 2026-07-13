'use client'

import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import type { BgmConfig } from '@/types/invitation'
import { useEditorStore } from '@/store/editor'

function BgmEqIcon({ playing }: { playing: boolean }) {
  return (
    <span className="flex items-end gap-[2px] h-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={
            playing
              ? 'bgm-eq-bar block w-[2px] h-full bg-white rounded-sm'
              : 'block w-[2px] h-1 bg-white rounded-sm'
          }
        />
      ))}
    </span>
  )
}

interface Props {
  cfg: BgmConfig
  // 'editor' = useEditorStore 의 bgmIntent / bgmCaptureMuted 와 연동
  // 'standalone' = 외부 컨텍스트(미리보기, 발행 페이지) — store 무관, 자체 자동재생
  mode?: 'editor' | 'standalone'
  className?: string
}

// 미리보기/에디터/발행 뷰에서 공통으로 사용하는 부유 BGM 플레이어.
// PreviewPane 외부에서 렌더되므로 그룹 탭 전환으로 인한 PreviewPane 재마운트에
// 영향받지 않는다. 라우트 이탈 시 cleanup 에서 audio.src 까지 비워서 다음
// 페이지의 새 audio 와 겹치지 않게 한다.
export default function BgmFloatingPlayer({ cfg, mode = 'editor', className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  // editor 모드에서만 store를 구독. standalone 모드는 hook을 호출하지 않으면
  // SSR 경로에서도 안전.
  const storeIntent = useEditorStore((s) => s.bgmIntent)
  const storeMuted = useEditorStore((s) => s.bgmCaptureMuted)
  const setBgmIntent = useEditorStore((s) => s.setBgmIntent)
  const intent = mode === 'editor' ? storeIntent : 'auto'
  const captureMuted = mode === 'editor' ? storeMuted : false

  // 브라우저 자동재생 정책 회피용 음소거. mount 시 muted=true 로 시작해 autoplay 를
  // 통과시키고, 첫 user gesture 가 감지되면 해제한다. paused intent 일 때는
  // 의미가 없으므로 비활성.
  const [autoMuted, setAutoMuted] = useState(() => !(mode === 'editor' && intent === 'paused'))

  useEffect(() => {
    if (mode === 'editor' && intent === 'paused') setAutoMuted(false)
  }, [mode, intent])

  // muted 속성을 React JSX 와 DOM 양쪽에서 합성으로 일관되게 적용.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = autoMuted || captureMuted
  }, [autoMuted, captureMuted])

  // 첫 사용자 인터랙션 한 번에 unmute. Chrome/Safari/iOS autoplay 정책 우회.
  useEffect(() => {
    if (!autoMuted) return
    const unmute = () => {
      setAutoMuted(false)
      const audio = audioRef.current
      if (audio && audio.paused && intent !== 'paused') {
        audio.play().catch(() => { /* 정책상 거부되면 다음 토글로 처리 */ })
      }
    }
    const events: Array<keyof DocumentEventMap> = ['pointerdown', 'touchend', 'keydown', 'scroll']
    events.forEach((ev) =>
      document.addEventListener(ev, unmute, { capture: true, passive: true, once: true }),
    )
    return () => {
      events.forEach((ev) =>
        document.removeEventListener(ev, unmute, true),
      )
    }
  }, [autoMuted, intent])

  // 자동 재생 시도. 브라우저 정책상 실패하면 사용자 인터랙션마다 재시도.
  // 사용자가 명시적으로 'paused' 상태로 두면 재시도하지 않는다.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !cfg.url) return
    if (intent === 'paused') {
      try { audio.pause() } catch { /* noop */ }
      return
    }

    let attached = false
    const detach = () => {
      if (!attached) return
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('click', tryPlay)
      window.removeEventListener('touchend', tryPlay)
      window.removeEventListener('keydown', tryPlay)
      attached = false
    }
    const attach = () => {
      if (attached) return
      attached = true
      window.addEventListener('pointerdown', tryPlay)
      window.addEventListener('click', tryPlay)
      window.addEventListener('touchend', tryPlay)
      window.addEventListener('keydown', tryPlay)
    }
    const tryPlay = () => {
      audio.play().then(() => {
        setPlaying(true)
        detach()
      }).catch(() => { /* 다음 인터랙션에서 재시도 */ })
    }

    audio.play().then(() => setPlaying(true)).catch(() => attach())

    const onCanPlay = () => {
      if (audio.paused) {
        audio.play().then(() => {
          setPlaying(true)
          detach()
        }).catch(() => attach())
      }
    }
    audio.addEventListener('canplay', onCanPlay)

    return () => {
      detach()
      audio.removeEventListener('canplay', onCanPlay)
      try { audio.pause() } catch { /* noop */ }
    }
  }, [cfg.url, intent])

  // 라우트 이탈 시 다음 페이지 audio 와 겹치지 않도록 src 까지 비운다.
  // dependency [] 로 두어 진짜 unmount 시점에만 호출 — strict mode 의 simulated
  // unmount/remount 에서는 즉시 새 audio 가 마운트되므로 무해하다.
  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (!audio) return
      try {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      } catch { /* noop */ }
    }
  }, [])

  // 캡처 중 임시 일시정지. muted 처리는 위 합성 useEffect 에서 함께 적용.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (captureMuted) {
      try { audio.pause() } catch { /* noop */ }
    }
  }, [captureMuted])

  // 동영상 모듈에서 발행하는 BGM pause/resume 이벤트 처리.
  // pause 직전 재생 중이었는지를 기억해 resume 시점에 자동 복원 여부를 결정한다.
  // 이로써 동영상 모듈은 항상 pause/resume 를 발행하면 되고, BGM 측에서 의도를 보존.
  useEffect(() => {
    if (typeof window === 'undefined') return
    let wasPlayingBeforePause = false
    const onPause = () => {
      const audio = audioRef.current
      if (!audio) return
      wasPlayingBeforePause = !audio.paused
      try { audio.pause() } catch { /* noop */ }
      if (mode === 'editor') {
        try { setBgmIntent('paused') } catch { /* noop */ }
      }
    }
    const onResume = () => {
      if (!wasPlayingBeforePause) return
      wasPlayingBeforePause = false
      const audio = audioRef.current
      if (!audio) return
      try {
        audio.muted = false
        setAutoMuted(false)
        audio.play().catch(() => { /* 정책상 거부되면 다음 토글로 처리 */ })
      } catch { /* noop */ }
      if (mode === 'editor') {
        try { setBgmIntent('playing') } catch { /* noop */ }
      }
    }
    window.addEventListener('openday:bgm-pause', onPause)
    window.addEventListener('openday:bgm-resume', onResume)
    return () => {
      window.removeEventListener('openday:bgm-pause', onPause)
      window.removeEventListener('openday:bgm-resume', onResume)
    }
  }, [mode, setBgmIntent])

  // 반복 구간 처리 (업로드 음원에서 loopEnabled일 때만 의미)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      if (cfg.loopEnabled && cfg.loopEnd != null && cfg.loopEnd > (cfg.loopStart ?? 0) && audio.currentTime >= cfg.loopEnd) {
        audio.currentTime = cfg.loopStart ?? 0
      }
    }
    const onLoadedMetadata = () => {
      if (cfg.loopEnabled && cfg.loopStart != null && cfg.loopStart > 0) {
        audio.currentTime = cfg.loopStart
      }
    }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [cfg.loopEnabled, cfg.loopStart, cfg.loopEnd])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      if (mode === 'editor') setBgmIntent('paused')
    } else {
      // 사용자 명시적 액션 → autoMuted 해제. setState 는 비동기라 React commit
      // 전에 audio.play() 가 실행되므로, DOM 도 동기로 즉시 unmute.
      setAutoMuted(false)
      audio.muted = false
      audio.play().then(() => {
        setPlaying(true)
        if (mode === 'editor') setBgmIntent('playing')
      }).catch(() => setPlaying(false))
    }
  }

  if (!cfg.url) return null

  // 발행 뷰(standalone): viewport 기준 fixed — 스크롤해도 항상 좌상단에 따라온다.
  //   (zoom 컨테이너 안에서 sticky 가 정상 동작하지 않는 문제 대응)
  // 에디터: PreviewPane 컨테이너에 한정된 sticky — 사이드바 등과 겹치지 않게.
  const defaultClassName = mode === 'editor'
    ? 'sticky top-0 left-0 z-30 h-0'
    : 'fixed top-0 left-0 z-30 h-0'
  return (
    <div className={className ?? defaultClassName}>
      <audio
        ref={audioRef}
        src={cfg.url}
        loop={!cfg.loopEnabled}
        preload="auto"
        autoPlay={intent !== 'paused'}
        muted={autoMuted || captureMuted}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute top-4 left-4 w-7 h-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors"
        aria-label={playing ? '배경음악 정지' : '배경음악 재생'}
      >
        {playing ? <BgmEqIcon playing /> : <Play size={12} className="ml-0.5 fill-white" />}
      </button>
    </div>
  )
}

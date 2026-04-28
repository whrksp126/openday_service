'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

type Props = {
  url: string
  loopStart?: number
  loopEnd?: number
  onChange: (start: number, end: number) => void
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// wavesurfer.js + Regions 플러그인으로 파형 위 드래그 가능한 구간 선택 UI.
// 플레이어는 region 안에서만 자동 루프 재생. SSR 회피를 위해 동적 import.
export default function LoopRegionEditor({ url, loopStart, loopEnd, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<{ destroy: () => void; play: () => Promise<void>; pause: () => void; getCurrentTime: () => number; setTime: (t: number) => void } | null>(null)
  const regionRef = useRef<{ start: number; end: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    let ws: unknown = null
    Promise.all([
      import('wavesurfer.js'),
      import('wavesurfer.js/dist/plugins/regions.esm.js'),
    ])
      .then(([wsMod, regMod]) => {
        if (cancelled || !containerRef.current) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const WaveSurfer: any = wsMod.default
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const RegionsPlugin: any = regMod.default
        const regions = RegionsPlugin.create()
        const instance = WaveSurfer.create({
          container: containerRef.current,
          url,
          waveColor: '#d1d5db',
          progressColor: '#21AFBF',
          cursorColor: 'transparent',
          height: 56,
          barWidth: 2,
          barGap: 1,
          normalize: true,
          plugins: [regions],
        })
        ws = instance
        wsRef.current = instance

        instance.on('ready', () => {
          const dur = instance.getDuration()
          setDuration(dur)
          const start = Math.max(0, Math.min(loopStart ?? 0, dur))
          const end = Math.min(dur, loopEnd ?? dur)
          const r = regions.addRegion({
            start,
            end: end > start ? end : dur,
            color: 'rgba(33, 175, 191, 0.18)',
            drag: true,
            resize: true,
          })
          regionRef.current = r
          setRegion({ start: r.start, end: r.end })
          setReady(true)
          r.on('update', () => {
            regionRef.current = r
            setRegion({ start: r.start, end: r.end })
          })
          r.on('update-end', () => {
            onChange(r.start, r.end)
          })
        })

        instance.on('play', () => setPlaying(true))
        instance.on('pause', () => setPlaying(false))
        instance.on('finish', () => setPlaying(false))

        instance.on('timeupdate', (currentTime: number) => {
          const r = regionRef.current
          if (!r) return
          if (currentTime >= r.end) {
            instance.setTime(r.start)
          }
        })
      })
      .catch(() => {
        // 로드 실패 시 조용히 무시 — 부모에서 fallback UI 없으므로 빈 영역만 남음
      })

    return () => {
      cancelled = true
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(ws as any)?.destroy?.()
      } catch {
        // ignore destroy errors
      }
      wsRef.current = null
      regionRef.current = null
    }
    // url 변경 시 wavesurfer 재초기화. loopStart/loopEnd는 초기값으로만 쓰고 이후엔 region이 source of truth.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  function toggle() {
    const ws = wsRef.current
    const r = regionRef.current
    if (!ws) return
    if (playing) {
      ws.pause()
      return
    }
    if (r) {
      const t = ws.getCurrentTime()
      if (t < r.start || t >= r.end) ws.setTime(r.start)
    }
    ws.play().catch(() => setPlaying(false))
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div ref={containerRef} className="w-full bg-gray-50 rounded-lg px-2 py-2 min-h-[72px]" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-[11px] text-gray-400">
            파형 불러오는 중…
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:bg-gray-300"
          aria-label={playing ? '미리듣기 정지' : '미리듣기'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
        <div className="flex-1 text-[11px] text-gray-500 leading-5">
          {region ? (
            <>
              <span className="text-gray-700 font-medium">{formatTime(region.start)}</span>
              <span className="text-gray-400 mx-1">~</span>
              <span className="text-gray-700 font-medium">{formatTime(region.end)}</span>
              <span className="text-gray-400 ml-2">/ {formatTime(duration)}</span>
            </>
          ) : (
            <span className="text-gray-400">파형 위에서 양 끝을 드래그해 구간을 지정하세요.</span>
          )}
        </div>
      </div>
    </div>
  )
}

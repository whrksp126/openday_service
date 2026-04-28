'use client'

import React from 'react'

// ── 프레임 스타일 ───────────────────────────────────────────
export type FrameStyleId = 'none' | 'white' | 'wave'

export const FRAME_STYLES: { id: FrameStyleId; label: string }[] = [
  { id: 'none',   label: '없음' },
  { id: 'white',  label: '흰 테두리' },
  { id: 'wave',   label: '물결' },
]

interface FrameWrapperProps {
  style?: FrameStyleId
  children: React.ReactNode
  className?: string
}

export function FrameWrapper({ style = 'white', children, className }: FrameWrapperProps) {
  if (style === 'none') {
    return <div className={className}>{children}</div>
  }
  if (style === 'white') {
    return (
      <div className={`p-2 bg-white shadow-sm ${className ?? ''}`}>
        {children}
      </div>
    )
  }
  if (style === 'wave') {
    // 사진 위·아래에 회색 파도 라인 (흰 배경 위에서 가시)
    const wave =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 8" preserveAspectRatio="none">' +
        '<path d="M0 4 Q 5 0 10 4 T 20 4 T 30 4 T 40 4 T 50 4 T 60 4 T 70 4 T 80 4 T 90 4 T 100 4" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2" />' +
        '</svg>'
      )
    return (
      <div
        className={className}
        style={{
          padding: '10px',
          background: '#fff',
          backgroundImage: `url("${wave}"), url("${wave}")`,
          backgroundPosition: 'top, bottom',
          backgroundRepeat: 'repeat-x',
          backgroundSize: '40px 8px',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.05) inset',
        }}
      >
        {children}
      </div>
    )
  }
  return <div className={className}>{children}</div>
}

// ── 데코레이션 ──────────────────────────────────────────────
export type DecorationId = 'confetti' | 'petal' | 'star' | 'heart'

export const DECORATIONS: { id: DecorationId; label: string }[] = [
  { id: 'confetti', label: '컨페티' },
  { id: 'petal',    label: '꽃잎' },
  { id: 'star',     label: '별' },
  { id: 'heart',    label: '하트' },
]

const CONFETTI_COLORS = ['#f9a8d4', '#fcd34d', '#86efac', '#93c5fd', '#fda4af', '#c4b5fd']

function ConfettiLayer() {
  // 24개 색종이를 비결정적 위치에 분포 (시드 고정)
  const items = [
    { x: 4,  y: 6,  c: 0, r: 12, w: 6, h: 2 },
    { x: 12, y: 18, c: 1, r: -20, w: 5, h: 5 },
    { x: 22, y: 4,  c: 2, r: 30, w: 4, h: 4 },
    { x: 30, y: 22, c: 3, r: 0,  w: 6, h: 2 },
    { x: 42, y: 10, c: 4, r: -15, w: 5, h: 2 },
    { x: 56, y: 5,  c: 5, r: 35, w: 5, h: 5 },
    { x: 68, y: 18, c: 0, r: 10, w: 4, h: 2 },
    { x: 80, y: 8,  c: 1, r: -25, w: 6, h: 2 },
    { x: 92, y: 22, c: 2, r: 18, w: 5, h: 5 },
    { x: 6,  y: 38, c: 3, r: -30, w: 5, h: 2 },
    { x: 88, y: 40, c: 4, r: 22, w: 5, h: 2 },
    { x: 3,  y: 60, c: 5, r: 14, w: 6, h: 2 },
    { x: 95, y: 65, c: 0, r: -10, w: 4, h: 4 },
    { x: 8,  y: 82, c: 1, r: 28, w: 5, h: 2 },
    { x: 18, y: 90, c: 2, r: -40, w: 6, h: 2 },
    { x: 35, y: 92, c: 3, r: 8,  w: 5, h: 2 },
    { x: 55, y: 94, c: 4, r: -20, w: 5, h: 5 },
    { x: 72, y: 86, c: 5, r: 30, w: 4, h: 4 },
    { x: 88, y: 92, c: 0, r: -12, w: 6, h: 2 },
    { x: 14, y: 50, c: 2, r: 0,  w: 4, h: 4 },
    { x: 86, y: 52, c: 5, r: 0,  w: 4, h: 4 },
    { x: 50, y: 30, c: 1, r: 12, w: 4, h: 2 },
    { x: 50, y: 70, c: 4, r: -8, w: 4, h: 2 },
    { x: 75, y: 60, c: 3, r: 18, w: 5, h: 2 },
  ]
  return (
    <>
      {items.map((it, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${it.x}%`,
            top: `${it.y}%`,
            width: `${it.w}px`,
            height: `${it.h}px`,
            background: CONFETTI_COLORS[it.c],
            borderRadius: it.h === it.w ? '50%' : '1px',
            transform: `rotate(${it.r}deg)`,
            opacity: 0.8,
          }}
        />
      ))}
    </>
  )
}

function StarLayer({ accent }: { accent: string }) {
  const items = [
    { x: 6,  y: 8,  size: 10, op: 0.7 },
    { x: 90, y: 6,  size: 8,  op: 0.6 },
    { x: 12, y: 70, size: 7,  op: 0.5 },
    { x: 88, y: 76, size: 11, op: 0.7 },
    { x: 50, y: 4,  size: 6,  op: 0.5 },
    { x: 4,  y: 40, size: 8,  op: 0.5 },
    { x: 96, y: 44, size: 7,  op: 0.5 },
    { x: 30, y: 92, size: 6,  op: 0.4 },
    { x: 70, y: 90, size: 9,  op: 0.6 },
  ]
  return (
    <>
      {items.map((it, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={it.size}
          height={it.size}
          style={{ position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, opacity: it.op }}
        >
          <path
            d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z"
            fill={accent}
          />
        </svg>
      ))}
    </>
  )
}

function HeartLayer({ accent }: { accent: string }) {
  const items = [
    { x: 5,  y: 12, size: 10, op: 0.7 },
    { x: 92, y: 14, size: 8,  op: 0.6 },
    { x: 8,  y: 75, size: 9,  op: 0.5 },
    { x: 90, y: 80, size: 11, op: 0.7 },
    { x: 48, y: 92, size: 8,  op: 0.5 },
    { x: 25, y: 4,  size: 6,  op: 0.4 },
    { x: 70, y: 6,  size: 7,  op: 0.5 },
  ]
  return (
    <>
      {items.map((it, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={it.size}
          height={it.size}
          style={{ position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, opacity: it.op }}
        >
          <path
            d="M12 21 C 5 16 2 12 2 8 A 5 5 0 0 1 12 6 A 5 5 0 0 1 22 8 C 22 12 19 16 12 21 Z"
            fill={accent}
          />
        </svg>
      ))}
    </>
  )
}

function PetalLayer({ accent }: { accent: string }) {
  const items = [
    { x: 4,  y: 14, size: 14, r: 0,   op: 0.5 },
    { x: 88, y: 8,  size: 12, r: 30,  op: 0.6 },
    { x: 12, y: 70, size: 16, r: -20, op: 0.5 },
    { x: 84, y: 78, size: 13, r: 45,  op: 0.5 },
    { x: 50, y: 4,  size: 10, r: 60,  op: 0.4 },
    { x: 30, y: 90, size: 14, r: -30, op: 0.4 },
    { x: 70, y: 92, size: 12, r: 15,  op: 0.5 },
  ]
  return (
    <>
      {items.map((it, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={it.size}
          height={it.size}
          style={{
            position: 'absolute',
            left: `${it.x}%`,
            top: `${it.y}%`,
            transform: `rotate(${it.r}deg)`,
            opacity: it.op,
          }}
        >
          {/* 5장 꽃잎 */}
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="12"
              cy="6"
              rx="3"
              ry="6"
              fill={accent}
              transform={`rotate(${a} 12 12)`}
              opacity="0.7"
            />
          ))}
          <circle cx="12" cy="12" r="2" fill="#fff" />
        </svg>
      ))}
    </>
  )
}

interface DecorationOverlayProps {
  ids?: string[]
  accent: string
  className?: string
}

export function DecorationOverlay({ ids, accent, className }: DecorationOverlayProps) {
  if (!ids || ids.length === 0) return null
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`} aria-hidden="true">
      {ids.includes('confetti') && <ConfettiLayer />}
      {ids.includes('star')     && <StarLayer accent={accent} />}
      {ids.includes('heart')    && <HeartLayer accent={accent} />}
      {ids.includes('petal')    && <PetalLayer accent={accent} />}
    </div>
  )
}

// ── 배경 패턴 ───────────────────────────────────────────────
export type BackgroundPatternId = 'none' | 'gradient-soft' | 'dots' | 'floral' | 'watercolor'

export const BACKGROUND_PATTERNS: { id: BackgroundPatternId; label: string }[] = [
  { id: 'none',          label: '없음' },
  { id: 'gradient-soft', label: '그라데이션' },
  { id: 'dots',          label: '도트' },
  { id: 'floral',        label: '꽃무늬' },
  { id: 'watercolor',    label: '수채화' },
]

interface BackgroundLayerProps {
  pattern?: BackgroundPatternId
  accent: string
  className?: string
}

export function BackgroundLayer({ pattern = 'none', accent, className }: BackgroundLayerProps) {
  if (pattern === 'none') return null

  if (pattern === 'gradient-soft') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
        style={{
          background: `linear-gradient(180deg, ${accent}22 0%, transparent 50%, ${accent}11 100%)`,
        }}
        aria-hidden="true"
      />
    )
  }

  if (pattern === 'dots') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
        style={{
          backgroundImage: `radial-gradient(${accent}33 1.5px, transparent 1.5px)`,
          backgroundSize: '14px 14px',
          opacity: 0.6,
        }}
        aria-hidden="true"
      />
    )
  }

  if (pattern === 'floral') {
    const flower =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <g fill="${accent}" opacity="0.18">
            <ellipse cx="20" cy="14" rx="2.5" ry="5"/>
            <ellipse cx="20" cy="26" rx="2.5" ry="5"/>
            <ellipse cx="14" cy="20" rx="5" ry="2.5"/>
            <ellipse cx="26" cy="20" rx="5" ry="2.5"/>
            <circle cx="20" cy="20" r="2" fill="#fff"/>
          </g>
        </svg>`
      )
    return (
      <div
        className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
        style={{
          backgroundImage: `url("${flower}")`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />
    )
  }

  if (pattern === 'watercolor') {
    const blob =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
          <radialGradient id="g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
          </radialGradient>
          <ellipse cx="100" cy="100" rx="80" ry="60" fill="url(%23g)"/>
        </svg>`.replace('#', '%23')
      )
    return (
      <div
        className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
        style={{
          backgroundImage: `url("${blob}"), url("${blob}")`,
          backgroundPosition: '10% 15%, 80% 75%',
          backgroundSize: '50% 40%, 60% 50%',
          backgroundRepeat: 'no-repeat',
          opacity: 0.7,
        }}
        aria-hidden="true"
      />
    )
  }

  return null
}

// 미니 미리보기 아이콘 (패널의 옵션 버튼에서 사용)
export function FrameIcon({ id, color = '#9ca3af' }: { id: FrameStyleId; color?: string }) {
  if (id === 'none')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="4" y="4" width="16" height="16" fill={color} opacity="0.3" />
      </svg>
    )
  if (id === 'white')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="2" y="2" width="20" height="20" fill="#fff" stroke={color} />
        <rect x="5" y="5" width="14" height="14" fill={color} opacity="0.3" />
      </svg>
    )
  if (id === 'wave')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M2 4 Q 5 1 8 4 T 14 4 T 22 4" fill="none" stroke={color} strokeWidth="1.2" />
        <path d="M2 20 Q 5 17 8 20 T 14 20 T 22 20" fill="none" stroke={color} strokeWidth="1.2" />
        <rect x="4" y="6" width="16" height="12" fill={color} opacity="0.2" />
      </svg>
    )
  return null
}

export function DecorationIcon({ id, color = '#9ca3af' }: { id: DecorationId; color?: string }) {
  if (id === 'confetti')
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <rect x="3" y="6" width="4" height="2" fill="#f9a8d4" transform="rotate(20 5 7)" />
        <circle cx="14" cy="5" r="2" fill="#fcd34d" />
        <rect x="18" y="10" width="4" height="2" fill="#86efac" transform="rotate(-30 20 11)" />
        <circle cx="6" cy="16" r="2" fill="#93c5fd" />
        <rect x="14" y="18" width="4" height="2" fill="#c4b5fd" transform="rotate(45 16 19)" />
      </svg>
    )
  if (id === 'star')
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path
          d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z"
          fill={color}
        />
      </svg>
    )
  if (id === 'heart')
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path
          d="M12 21 C 5 16 2 12 2 8 A 5 5 0 0 1 12 6 A 5 5 0 0 1 22 8 C 22 12 19 16 12 21 Z"
          fill={color}
        />
      </svg>
    )
  if (id === 'petal')
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx="12"
            cy="6"
            rx="3"
            ry="6"
            fill={color}
            transform={`rotate(${a} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="2" fill="#fff" />
      </svg>
    )
  return null
}

export function BackgroundPatternIcon({ id, color = '#9ca3af' }: { id: BackgroundPatternId; color?: string }) {
  if (id === 'none')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="2" y="2" width="20" height="20" fill="#f3f4f6" />
      </svg>
    )
  if (id === 'gradient-soft')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" fill="url(#bgGrad)" />
      </svg>
    )
  if (id === 'dots')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="2" y="2" width="20" height="20" fill="#fff" />
        {[6, 12, 18].flatMap((y) => [6, 12, 18].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill={color} />))}
      </svg>
    )
  if (id === 'floral')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="2" y="2" width="20" height="20" fill="#fff" />
        <g fill={color} opacity="0.6">
          <ellipse cx="8" cy="8" rx="1" ry="2" />
          <ellipse cx="8" cy="12" rx="1" ry="2" />
          <ellipse cx="6" cy="10" rx="2" ry="1" />
          <ellipse cx="10" cy="10" rx="2" ry="1" />
          <ellipse cx="16" cy="16" rx="1" ry="2" />
          <ellipse cx="16" cy="20" rx="1" ry="2" />
          <ellipse cx="14" cy="18" rx="2" ry="1" />
          <ellipse cx="18" cy="18" rx="2" ry="1" />
        </g>
      </svg>
    )
  if (id === 'watercolor')
    return (
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="2" y="2" width="20" height="20" fill="#fff" />
        <ellipse cx="9" cy="9" rx="6" ry="4" fill={color} opacity="0.3" />
        <ellipse cx="16" cy="16" rx="5" ry="4" fill={color} opacity="0.25" />
      </svg>
    )
  return null
}

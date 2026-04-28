'use client'

import React, { useId } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import ClickableImage from './ClickableImage'
import type { ImageCropData } from '@/types/invitation'

export type PhotoShapeId =
  | 'square'
  | 'rounded'
  | 'circle'
  | 'oval'
  | 'arch'
  | 'arch-full'
  | 'cloud'
  | 'balloon'
  | 'heart'
  | 'star'
  | 'polaroid'
  | 'blob'

// SVG path는 objectBoundingBox 좌표계(0~1)로 작성 — 어떤 사이즈에도 자동 스케일.
// 단순 도형은 CSS clip-path shape 함수로 표현하고 path는 비워둔다.
interface ShapeMeta {
  label: string
  defaultAspect: string
  css?: string         // CSS clip-path 값 (단순 도형 우선)
  svgPath?: string     // SVG <clipPath clipPathUnits="objectBoundingBox"> 의 d
}

const SHAPES: Record<PhotoShapeId, ShapeMeta> = {
  'square':     { label: '사각',       defaultAspect: '4/5', css: 'inset(0)' },
  'rounded':    { label: '라운드',     defaultAspect: '4/5', css: 'inset(0 round 8%)' },
  'circle':     { label: '원형',       defaultAspect: '1/1', css: 'circle(50% at 50% 50%)' },
  'oval':       { label: '타원',       defaultAspect: '5/6', css: 'ellipse(50% 50% at 50% 50%)' },
  // 위쪽이 둥근 아치
  'arch': {
    label: '아치', defaultAspect: '3/4',
    svgPath: 'M 0 1 L 0 0.5 A 0.5 0.5 0 0 1 1 0.5 L 1 1 Z',
  },
  // 양 끝이 둥근 스타디움
  'arch-full': {
    label: '풀아치', defaultAspect: '3/4',
    svgPath: 'M 0 0.5 A 0.5 0.5 0 0 1 1 0.5 L 1 1 A 0.5 0.5 0 0 1 0 1 Z',
  },
  // 4-lobed 진짜 구름 (베지에 곡선)
  'cloud': {
    label: '구름', defaultAspect: '5/4',
    svgPath:
      'M 0.18 0.78 ' +
      'C 0.05 0.78 0.02 0.55 0.18 0.50 ' +
      'C 0.10 0.30 0.30 0.20 0.40 0.32 ' +
      'C 0.45 0.10 0.70 0.10 0.72 0.30 ' +
      'C 0.88 0.25 0.98 0.45 0.90 0.55 ' +
      'C 0.99 0.65 0.92 0.82 0.80 0.78 ' +
      'L 0.18 0.78 Z',
  },
  // 위가 살짝 좁은 풍선 + 아래 매듭 삼각형
  'balloon': {
    label: '풍선', defaultAspect: '3/4',
    svgPath:
      'M 0.50 0.05 ' +
      'C 0.85 0.05 0.95 0.45 0.85 0.65 ' +
      'C 0.78 0.78 0.62 0.85 0.55 0.85 ' +
      'L 0.58 0.92 L 0.42 0.92 L 0.45 0.85 ' +
      'C 0.38 0.85 0.22 0.78 0.15 0.65 ' +
      'C 0.05 0.45 0.15 0.05 0.50 0.05 Z',
  },
  // 하트
  'heart': {
    label: '하트', defaultAspect: '1/1',
    svgPath:
      'M 0.50 0.95 ' +
      'C 0.20 0.75 0.02 0.55 0.02 0.32 ' +
      'C 0.02 0.15 0.18 0.05 0.32 0.10 ' +
      'C 0.42 0.13 0.48 0.22 0.50 0.30 ' +
      'C 0.52 0.22 0.58 0.13 0.68 0.10 ' +
      'C 0.82 0.05 0.98 0.15 0.98 0.32 ' +
      'C 0.98 0.55 0.80 0.75 0.50 0.95 Z',
  },
  // 5각 별 (오목)
  'star': {
    label: '별', defaultAspect: '1/1',
    svgPath:
      'M 0.50 0.02 L 0.61 0.36 L 0.97 0.36 ' +
      'L 0.68 0.58 L 0.79 0.93 L 0.50 0.71 ' +
      'L 0.21 0.93 L 0.32 0.58 L 0.03 0.36 ' +
      'L 0.39 0.36 Z',
  },
  // 폴라로이드는 모양이 아니라 합성 (별도 처리)
  'polaroid': { label: '폴라로이드', defaultAspect: '4/5', css: 'inset(0)' },
  // 비정형 워터컬러 얼룩
  'blob': {
    label: '얼룩', defaultAspect: '4/5',
    svgPath:
      'M 0.50 0.04 ' +
      'C 0.78 0.06 0.95 0.22 0.94 0.45 ' +
      'C 0.96 0.62 0.88 0.80 0.70 0.92 ' +
      'C 0.50 1.00 0.28 0.94 0.16 0.78 ' +
      'C 0.04 0.62 0.02 0.40 0.12 0.22 ' +
      'C 0.22 0.06 0.36 0.02 0.50 0.04 Z',
  },
}

export const PHOTO_SHAPES: { id: PhotoShapeId; label: string }[] = (Object.keys(SHAPES) as PhotoShapeId[])
  .map((id) => ({ id, label: SHAPES[id].label }))

interface PhotoShapeProps {
  shape: PhotoShapeId
  src?: string
  crop?: ImageCropData
  fallbackAspect?: string
  alt?: string
  className?: string
  width?: string             // 컨테이너 너비 (e.g. '70%') — 외부 정렬은 부모에서 처리
  tilt?: number              // -8 ~ 8 deg
  borderColor?: string       // 'white' 등
  borderWidth?: number       // px
  shadow?: boolean
  caption?: React.ReactNode  // polaroid의 하단 캡션
  glow?: string              // 외곽 글로우 색상 (rgba)
}

// SVG clipPath를 사용하는 공통 래퍼 (objectBoundingBox 좌표계)
function ClippedImage({
  shape, src, crop, fallbackAspect, alt, borderColor, borderWidth, shadow,
}: Pick<PhotoShapeProps, 'shape' | 'src' | 'crop' | 'fallbackAspect' | 'alt' | 'borderColor' | 'borderWidth' | 'shadow'>) {
  const reactId = useId().replace(/:/g, '')
  const meta = SHAPES[shape]
  const aspect = fallbackAspect ?? meta.defaultAspect
  const clipId = `psclip-${shape}-${reactId}`

  const wrapperStyle: React.CSSProperties = { width: '100%' }
  if (borderColor && borderWidth) {
    wrapperStyle.padding = `${borderWidth}px`
    wrapperStyle.background = borderColor
  }
  if (shadow) wrapperStyle.filter = 'drop-shadow(0 6px 14px rgba(0,0,0,0.15))'

  // CSS clip-path가 정의된 단순 도형은 SVG <defs> 없이 처리
  if (meta.css) {
    wrapperStyle.clipPath = meta.css
    ;(wrapperStyle as Record<string, string>).WebkitClipPath = meta.css
    return (
      <div style={wrapperStyle}>
        <ClickableImage
          src={src}
          crop={crop}
          fallbackAspect={aspect}
          alt={alt ?? '커버'}
          placeholder={<ImageIcon size={36} className="text-gray-300" strokeWidth={1} />}
        />
      </div>
    )
  }

  // SVG path 기반 — 인라인 svg defs를 같이 렌더해 clipPath 참조
  const innerStyle: React.CSSProperties = {
    clipPath: `url(#${clipId})`,
    WebkitClipPath: `url(#${clipId})`,
  } as React.CSSProperties

  return (
    <div style={wrapperStyle}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={meta.svgPath!} />
          </clipPath>
        </defs>
      </svg>
      <div style={innerStyle}>
        <ClickableImage
          src={src}
          crop={crop}
          fallbackAspect={aspect}
          alt={alt ?? '커버'}
          placeholder={<ImageIcon size={36} className="text-gray-300" strokeWidth={1} />}
        />
      </div>
    </div>
  )
}

// 외부에서 사용하는 메인 컴포넌트
export function PhotoShape(props: PhotoShapeProps) {
  const { shape, width = '100%', tilt = 0, glow, caption, ...rest } = props
  const meta = SHAPES[shape]

  // 폴라로이드는 합성 — 흰 카드 + 사진 + 캡션 영역
  if (shape === 'polaroid') {
    return (
      <div
        className="bg-white shadow-lg mx-auto"
        style={{
          width,
          padding: '8px 8px 36px',
          transform: tilt ? `rotate(${tilt}deg)` : undefined,
        }}
      >
        <ClickableImage
          src={rest.src}
          crop={rest.crop}
          fallbackAspect={rest.fallbackAspect ?? meta.defaultAspect}
          alt={rest.alt ?? '커버'}
          placeholder={<ImageIcon size={36} className="text-gray-300" strokeWidth={1} />}
        />
        {caption && (
          <div className="text-center text-xs text-gray-700 mt-2" style={{ fontFamily: 'Caveat, cursive' }}>
            {caption}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`mx-auto ${rest.className ?? ''}`}
      style={{
        width,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        filter: glow ? `drop-shadow(0 0 12px ${glow})` : undefined,
      }}
    >
      <ClippedImage shape={shape} {...rest} />
    </div>
  )
}

// 패널의 모양 선택기에서 쓰는 작은 미니 아이콘
export function PhotoShapeIcon({ shape, color = '#9ca3af' }: { shape: PhotoShapeId; color?: string }) {
  const meta = SHAPES[shape]
  if (shape === 'polaroid') {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <rect x="3" y="3" width="18" height="18" rx="1" fill="none" stroke={color} strokeWidth="1.4" />
        <rect x="5" y="5" width="14" height="11" fill={color} opacity="0.3" />
      </svg>
    )
  }
  if (meta.css) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        {shape === 'square' && <rect x="4" y="4" width="16" height="16" fill={color} />}
        {shape === 'rounded' && <rect x="4" y="4" width="16" height="16" rx="3" fill={color} />}
        {shape === 'circle' && <circle cx="12" cy="12" r="9" fill={color} />}
        {shape === 'oval' && <ellipse cx="12" cy="12" rx="7" ry="9" fill={color} />}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 1 1" width="20" height="20">
      <path d={meta.svgPath} fill={color} />
    </svg>
  )
}

export function getShapeAspect(shape: PhotoShapeId): string {
  return SHAPES[shape].defaultAspect
}

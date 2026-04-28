'use client'

import type { CSSProperties } from 'react'
import type { ImageCropData } from '@/types/invitation'

interface Props {
  src?: string
  crop?: ImageCropData
  fallbackAspect: string            // 예: '4/3', '1/1'
  className?: string                // 컨테이너 추가 클래스
  alt?: string
  placeholder?: React.ReactNode     // src 없을 때 보여줄 노드
  rounded?: string                  // 예: 'rounded-xl', 기본 ''
}

// croppedAreaPercentage(원본 대비 0~100 비율)를 이용해 CSS-only로 크롭 영역을 렌더.
// 이미지는 컨테이너보다 (100/cw)배, (100/ch)배 확대되고 (-cx/cw*100)% 만큼 좌/상으로 이동 → 크롭 박스가 컨테이너에 딱 맞음.
export default function CroppedImage({ src, crop, fallbackAspect, className, alt = '', placeholder, rounded = '' }: Props) {
  const aspect = crop?.aspectRatio ?? fallbackAspect
  const containerStyle: CSSProperties = { aspectRatio: aspect.replace('/', ' / ') }

  if (!src) {
    return (
      <div
        className={`relative overflow-hidden bg-gray-200 flex items-center justify-center ${rounded} ${className ?? ''}`}
        style={containerStyle}
      >
        {placeholder}
      </div>
    )
  }

  if (!crop) {
    return (
      <div className={`relative overflow-hidden ${rounded} ${className ?? ''}`} style={containerStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    )
  }

  const { x: cx, y: cy, width: cw, height: ch } = crop.croppedAreaPercentage
  const imgStyle: CSSProperties = {
    position: 'absolute',
    width: `${10000 / cw}%`,
    height: `${10000 / ch}%`,
    left: `${(-cx * 100) / cw}%`,
    top: `${(-cy * 100) / ch}%`,
    maxWidth: 'none',
    maxHeight: 'none',
    objectFit: 'cover',
  }

  return (
    <div className={`relative overflow-hidden ${rounded} ${className ?? ''}`} style={containerStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={imgStyle} />
    </div>
  )
}

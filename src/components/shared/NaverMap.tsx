'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver: any
  }
}

interface Props {
  lat?: number
  lng?: number
  address?: string
  markerTitle?: string
  height?: string
  /** 다크 템플릿에서 라이트 지도 타일이 배경을 뚫지 않도록 반전 필터를 건다 */
  theme?: 'light' | 'dark'
  /** 마커 색 — 템플릿 accent 를 넘기면 지도가 초대장 톤 안에 들어온다 */
  markerColor?: string
}

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''

// 네이버 지도 v3 는 무료 등급에서 커스텀 다크 스타일을 제공하지 않는다.
// 타일에 반전 + 색상 회전 필터를 걸어 다크 톤으로 맞춘다.
const DARK_FILTER = 'invert(0.92) hue-rotate(180deg) saturate(0.7) brightness(0.95) contrast(1.05)'

export default function NaverMap({ lat, lng, address, markerTitle, height = '240px', theme = 'light', markerColor }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function renderMap(coords: { lat: number; lng: number }) {
      if (!mapRef.current || !window.naver?.maps) return
      const center = new window.naver.maps.LatLng(coords.lat, coords.lng)
      const map = new window.naver.maps.Map(mapRef.current, {
        center,
        zoom: 16,
        scaleControl: false,
        mapDataControl: false,
        logoControl: false,
      })
      // markerColor 를 쓰는 경우 마커는 필터 바깥 오버레이(아래 JSX)로 그린다.
      // 지도 중심 = 장소 좌표이므로 컨테이너 중앙에 고정 배치하면 정확히 일치한다.
      // 반전 필터 안에 두면 어떤 색을 넣어도 채도가 죽어 accent 색이 재현되지 않는다.
      if (!markerColor) {
        new window.naver.maps.Marker({ position: center, map, title: markerTitle })
      }
    }

    function initMap() {
      if (!window.naver?.maps) return
      if (typeof lat === 'number' && typeof lng === 'number') {
        renderMap({ lat, lng })
        return
      }
      if (address && window.naver.maps.Service?.geocode) {
        window.naver.maps.Service.geocode(
          { query: address },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (status: number, response: any) => {
            if (status !== window.naver.maps.Service.Status.OK) return
            const first = response?.v2?.addresses?.[0]
            if (!first) return
            renderMap({ lat: parseFloat(first.y), lng: parseFloat(first.x) })
          },
        )
      }
    }

    if (window.naver?.maps) {
      initMap()
      return
    }

    const scriptId = 'naver-maps-sdk'
    if (document.getElementById(scriptId)) {
      const interval = setInterval(() => {
        if (window.naver?.maps) {
          clearInterval(interval)
          initMap()
        }
      }, 100)
      return () => clearInterval(interval)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${CLIENT_ID}&submodules=geocoder`
    script.onload = initMap
    document.head.appendChild(script)
  }, [lat, lng, address, markerTitle, theme, markerColor])

  return (
    <div style={{ position: 'relative', width: '100%', height, overflow: 'hidden' }}>
      <div
        ref={mapRef}
        className="naver-map-container"
        style={{
          width: '100%',
          height: '100%',
          filter: theme === 'dark' ? DARK_FILTER : undefined,
        }}
      />
      {markerColor && (
        <svg
          width="28" height="38" viewBox="0 0 30 40" aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
          }}
        >
          <path
            d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.2 23.6 13.8 24.2a1.7 1.7 0 0 0 2.4 0C16.8 38.6 30 25.5 30 15 30 6.7 23.3 0 15 0z"
            fill={markerColor}
          />
          <circle cx="15" cy="15" r="5.2" fill="rgba(0,0,0,0.45)" />
        </svg>
      )}
    </div>
  )
}

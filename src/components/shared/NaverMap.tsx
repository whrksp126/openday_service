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
}

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''

export default function NaverMap({ lat, lng, address, markerTitle, height = '240px' }: Props) {
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
      new window.naver.maps.Marker({ position: center, map, title: markerTitle })
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
  }, [lat, lng, address, markerTitle])

  return <div ref={mapRef} className="naver-map-container" style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }} />
}

'use client'

import { useEffect } from 'react'
import { initKakao } from '@/lib/kakao'

export default function KakaoBootstrap() {
  useEffect(() => {
    let cancelled = false
    const start = Date.now()
    const tick = () => {
      if (cancelled) return
      if (initKakao()) return
      if (Date.now() - start > 5000) return
      requestAnimationFrame(tick)
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}

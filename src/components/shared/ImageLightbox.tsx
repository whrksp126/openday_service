'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  src: string | null
  zoomEnabled: boolean
  onClose: () => void
}

const MIN_SCALE = 1
const MAX_SCALE = 4

export default function ImageLightbox({ src, zoomEnabled, onClose }: Props) {
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)
  const lastTap = useRef(0)

  useEffect(() => {
    if (!src) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [src, onClose])

  useEffect(() => {
    if (!src) {
      setScale(1); setTx(0); setTy(0)
      pointers.current.clear()
      pinchStart.current = null
    }
  }, [src])

  function clampScale(v: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, v))
  }

  function resetTransform() {
    setScale(1); setTx(0); setTy(0)
  }

  function onWheel(e: ReactWheelEvent<HTMLDivElement>) {
    if (!zoomEnabled) return
    e.preventDefault()
    const next = clampScale(scale * (1 - e.deltaY / 500))
    if (next === 1) { resetTransform(); return }
    setScale(next)
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!zoomEnabled) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      pinchStart.current = { dist, scale }
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!zoomEnabled) return
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const cur = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, cur)

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const next = clampScale(pinchStart.current.scale * (dist / pinchStart.current.dist))
      setScale(next)
      if (next === 1) { setTx(0); setTy(0) }
      return
    }
    if (pointers.current.size === 1 && scale > 1) {
      setTx((v) => v + (cur.x - prev.x))
      setTy((v) => v + (cur.y - prev.y))
    }
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
  }

  function onDoubleClick() {
    if (!zoomEnabled) return
    if (scale === 1) setScale(2)
    else resetTransform()
  }

  function onTouchEnd() {
    if (!zoomEnabled) return
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (scale === 1) setScale(2)
      else resetTransform()
    }
    lastTap.current = now
  }

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center select-none"
          onClick={onClose}
        >
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              zIndex: 0,
              touchAction: zoomEnabled ? 'none' : 'auto',
              cursor: zoomEnabled && scale > 1 ? 'grab' : 'default',
            }}
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={onDoubleClick}
            onTouchEnd={onTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                maxWidth: '95vw',
                maxHeight: '90vh',
                transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
                transformOrigin: 'center center',
                transition: pointers.current.size > 0 ? 'none' : 'transform 0.15s ease-out',
              }}
              className="object-contain pointer-events-none"
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            aria-label="닫기"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            style={{ zIndex: 10 }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

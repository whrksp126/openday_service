'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import ImageLightbox from './ImageLightbox'

interface Ctx {
  open: (src: string) => void
}

const ImageLightboxContext = createContext<Ctx | null>(null)

interface Props {
  zoomEnabled: boolean
  children: ReactNode
}

export function ImageLightboxProvider({ zoomEnabled, children }: Props) {
  const [openSrc, setOpenSrc] = useState<string | null>(null)
  const open = useCallback((src: string) => setOpenSrc(src), [])
  const value = useMemo<Ctx>(() => ({ open }), [open])
  return (
    <ImageLightboxContext.Provider value={value}>
      {children}
      <ImageLightbox src={openSrc} zoomEnabled={zoomEnabled} onClose={() => setOpenSrc(null)} />
    </ImageLightboxContext.Provider>
  )
}

export function useImageLightbox() {
  return useContext(ImageLightboxContext)
}

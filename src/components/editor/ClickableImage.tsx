'use client'

import type { ComponentProps } from 'react'
import CroppedImage from './CroppedImage'
import { useImageLightbox } from '@/components/shared/ImageLightboxProvider'

type Props = ComponentProps<typeof CroppedImage>

export default function ClickableImage(props: Props) {
  const ctx = useImageLightbox()
  const clickable = Boolean(props.src && ctx)
  if (!clickable) return <CroppedImage {...props} />
  return (
    <div
      onClick={() => ctx?.open(props.src!)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          ctx?.open(props.src!)
        }
      }}
      style={{ cursor: 'zoom-in' }}
    >
      <CroppedImage {...props} />
    </div>
  )
}

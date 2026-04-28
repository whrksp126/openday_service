'use client'

import html2canvas from 'html2canvas'

const CAPTURE_SELECTOR = '[data-capture-target="main"]'

export async function captureMainSectionDataUrl(): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('브라우저 환경에서만 캡처할 수 있습니다.')
  }
  const el = document.querySelector(CAPTURE_SELECTOR) as HTMLElement | null
  if (!el) {
    throw new Error('메인 화면 영역을 찾을 수 없습니다. 미리보기에서 메인 화면을 표시한 뒤 다시 시도해주세요.')
  }
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 8000,
  })
  return canvas.toDataURL('image/jpeg', 0.85)
}

export async function uploadDataUrl(dataUrl: string): Promise<string> {
  const r = await fetch('/api/upload?kind=base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  })
  if (!r.ok) {
    const msg = await r.text().catch(() => '')
    throw new Error(`업로드에 실패했습니다. ${msg}`.trim())
  }
  const json = (await r.json()) as { url: string }
  return json.url
}

export async function captureAndUploadThumbnail(): Promise<string> {
  const dataUrl = await captureMainSectionDataUrl()
  return uploadDataUrl(dataUrl)
}

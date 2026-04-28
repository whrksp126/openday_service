'use client'

import html2canvas from 'html2canvas'

const CAPTURE_SELECTOR = '[data-capture-target="main"]'

// 카카오톡 'feed' 카드 이미지 영역에 풀폭으로 표시되도록 1:1 정사각으로 합성한다.
// 메인 영역(세로형)을 contain 으로 가운데 배치하고, 좌우 빈 공간은 메인의
// 배경색으로 채워 letterbox 가 자연스럽게 디자인의 일부로 보이도록 한다.
const TARGET_SIZE = 1600 // 800px @ scale 2 (카카오 권장 범위 안)

function resolveBackgroundColor(el: HTMLElement): string {
  // 캡처 대상의 inline bgColor 우선, 없으면 computed style. 둘 다 비어있으면 흰색.
  const inline = el.style.backgroundColor
  if (inline) return inline
  const computed = window.getComputedStyle(el).backgroundColor
  if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent') {
    return computed
  }
  return '#ffffff'
}

export async function captureMainSectionDataUrl(): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('브라우저 환경에서만 캡처할 수 있습니다.')
  }
  const el = document.querySelector(CAPTURE_SELECTOR) as HTMLElement | null
  if (!el) {
    throw new Error('메인 화면 영역을 찾을 수 없습니다. 미리보기에서 메인 화면을 표시한 뒤 다시 시도해주세요.')
  }
  // 1단계: 메인 영역 그대로 캡처 (배경 투명)
  const captured = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 8000,
  })

  // 2단계: 정사각 캔버스에 합성
  const out = document.createElement('canvas')
  out.width = TARGET_SIZE
  out.height = TARGET_SIZE
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('캔버스 컨텍스트를 만들 수 없습니다.')

  ctx.fillStyle = resolveBackgroundColor(el)
  ctx.fillRect(0, 0, out.width, out.height)

  // 3단계: 캡처를 contain 방식으로 가운데 배치
  const srcRatio = captured.width / captured.height
  let drawW: number, drawH: number, drawX: number, drawY: number
  if (srcRatio >= 1) {
    drawW = out.width
    drawH = drawW / srcRatio
    drawX = 0
    drawY = (out.height - drawH) / 2
  } else {
    drawH = out.height
    drawW = drawH * srcRatio
    drawX = (out.width - drawW) / 2
    drawY = 0
  }
  ctx.drawImage(captured, drawX, drawY, drawW, drawH)

  return out.toDataURL('image/jpeg', 0.85)
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

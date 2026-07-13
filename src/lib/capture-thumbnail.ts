'use client'

import html2canvas from 'html2canvas'

const CAPTURE_SELECTOR = '[data-capture-target="main"]'

// 카카오톡 'feed' 카드 이미지 영역에 풀폭으로 표시되도록 1:1 정사각으로 합성한다.
// 메인 영역(세로형)을 contain 으로 가운데 배치하고, 좌우 빈 공간은 사용자가 지정한
// 여백 색상(styles.spacingColor)으로 채워 letterbox 가 디자인 일부로 보이도록 한다.
const TARGET_SIZE = 1600 // 800px @ scale 2 (카카오 권장 범위 안)

function resolveLetterboxColor(el: HTMLElement, override?: string): string {
  if (override) return override
  // 호출 측이 색을 안 줬을 때의 안전망: 미리보기 래퍼의 --spacing-color → computed bg → 흰색.
  const fromVar = window.getComputedStyle(el).getPropertyValue('--spacing-color').trim()
  if (fromVar) return fromVar
  const computed = window.getComputedStyle(el).backgroundColor
  if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent') {
    return computed
  }
  return '#ffffff'
}

export async function captureMainSectionDataUrl(backgroundColor?: string): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('브라우저 환경에서만 캡처할 수 있습니다.')
  }
  const el = document.querySelector(CAPTURE_SELECTOR) as HTMLElement | null
  if (!el) {
    throw new Error('메인 화면 영역을 찾을 수 없습니다. 미리보기에서 메인 화면을 표시한 뒤 다시 시도해주세요.')
  }
  // 1단계: 메인 영역 그대로 캡처 (배경 투명)
  // onclone: html2canvas 가 DOM 을 복제하는 과정에서 <audio autoPlay> 가 잠깐 살아나
  // 미세하게 소리가 새는 케이스가 있다. 클론 트리에서 모든 audio 태그를 제거해 차단.
  const captured = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 8000,
    onclone: (doc) => {
      doc.querySelectorAll('audio').forEach((a) => a.remove())
    },
  })

  // 2단계: 정사각 캔버스에 합성
  const out = document.createElement('canvas')
  out.width = TARGET_SIZE
  out.height = TARGET_SIZE
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('캔버스 컨텍스트를 만들 수 없습니다.')

  ctx.fillStyle = resolveLetterboxColor(el, backgroundColor)
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

interface UploadContext {
  invitationId?: string | null
  templateId?: string | null
}

function uploadEndpoint(base: string, ctx?: UploadContext): string {
  const params = new URLSearchParams(base.includes('?') ? base.slice(base.indexOf('?') + 1) : '')
  if (ctx?.invitationId) params.set('invitationId', ctx.invitationId)
  else if (ctx?.templateId) params.set('templateId', ctx.templateId)
  const path = base.includes('?') ? base.slice(0, base.indexOf('?')) : base
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export async function uploadDataUrl(dataUrl: string, ctx?: UploadContext): Promise<string> {
  const r = await fetch(uploadEndpoint('/api/upload?kind=base64', ctx), {
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

export async function captureAndUploadThumbnail(backgroundColor?: string, ctx?: UploadContext): Promise<string> {
  const dataUrl = await captureMainSectionDataUrl(backgroundColor)
  return uploadDataUrl(dataUrl, ctx)
}

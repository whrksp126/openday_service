import type { KakaoShareDefaultParams } from '@/types/kakao'

export function getKakaoJsKey(): string | undefined {
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY
}

export function isKakaoReady(): boolean {
  if (typeof window === 'undefined') return false
  if (!window.Kakao) return false
  return window.Kakao.isInitialized()
}

export function initKakao(): boolean {
  if (typeof window === 'undefined') return false
  if (!window.Kakao) return false
  if (window.Kakao.isInitialized()) return true
  const key = getKakaoJsKey()
  if (!key) return false
  window.Kakao.init(key)
  return window.Kakao.isInitialized()
}

export function shareKakaoFeed(params: KakaoShareDefaultParams): void {
  if (!initKakao()) {
    throw new Error('카카오 SDK가 준비되지 않았습니다. NEXT_PUBLIC_KAKAO_JS_KEY를 확인하세요.')
  }
  window.Kakao!.Share.sendDefault(params)
}

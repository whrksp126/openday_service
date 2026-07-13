import type { ScrollAnimationPreset } from '@/types/invitation'

export const SCROLL_ANIMATION_PRESETS: ReadonlyArray<{
  id: ScrollAnimationPreset
  label: string
  description: string
}> = [
  { id: 'off',    label: '끄기',         description: '등장 효과 없음' },
  { id: 'fade',   label: '페이드',       description: '요소가 부드럽게 나타남' },
  { id: 'soft',   label: '부드럽게',     description: 'fade + 살짝 위로 + 살짝 확대' },
  { id: 'reveal', label: '시네마틱',     description: 'blur 가 풀리며 위로 슬라이드' },
  { id: 'blur',   label: '흐림 풀림',    description: '흐릿했다가 또렷해짐' },
  { id: 'rise',   label: '떠오름',       description: '아래에서 위로 크게 이동' },
  { id: 'zoom',   label: '줌 인',        description: '작게 시작해 본래 크기까지' },
  { id: 'pop',    label: '경쾌',         description: '탄력 있는 scale' },
  { id: 'flip',   label: '플립',         description: '살짝 기울었다가 똑바로' },
  { id: 'slide',  label: '슬라이드',     description: '왼쪽에서 미끄러져 들어옴' },
]

const PRESET_IDS = new Set<ScrollAnimationPreset>([
  'off', 'fade', 'soft', 'reveal', 'blur', 'rise', 'zoom', 'pop', 'flip', 'slide',
])

export function normalizeScrollAnimation(value: unknown): ScrollAnimationPreset {
  if (value === true) return 'soft'
  if (value === false) return 'off'
  if (typeof value === 'string' && PRESET_IDS.has(value as ScrollAnimationPreset)) {
    return value as ScrollAnimationPreset
  }
  return 'soft'
}

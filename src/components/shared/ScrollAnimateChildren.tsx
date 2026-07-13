'use client'

import { useLayoutEffect, useRef } from 'react'
import type { ScrollAnimationPreset } from '@/types/invitation'

interface Props {
  preset: ScrollAnimationPreset
  children: React.ReactNode
}

// 등장 애니메이션 대상으로 잡을 "의미 있는" 태그
//   - 텍스트 / 미디어 / 인터랙션 / 구조 컨테이너 모두 포함
//   - 지도 박스, 방명록 entry, 연락처 카드 등 컨테이너 div 도 자기 자신 단위로 애니메이트
//   - <span>/<li>/<tr>/<td>/<thead>/<tbody> 등 인라인·테이블 내부는 부모(p/ul/table)가 처리
//   - <svg> 내부(path, g, circle, …) 는 아이콘 자체가 통째로 등장하면 충분
const MEANINGFUL_TAGS = new Set([
  'div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'blockquote', 'pre',
  'ul', 'ol',
  'table',
  'img', 'figure', 'video', 'iframe', 'canvas',
  'button', 'a',
  'input', 'textarea', 'select', 'label',
  'hr',
])

const STAGGER_MS = 50
const MAX_TOTAL_DELAY = 1000

function hasContent(el: Element): boolean {
  if ((el.textContent?.trim().length ?? 0) > 0) return true
  // 텍스트가 없어도 미디어/인터랙션 후손이 있으면 시각적 콘텐츠가 있는 것으로 간주
  if (el.querySelector('img, video, iframe, canvas, button, input, [data-stagger]')) return true
  return false
}

function collectCandidates(root: Element): HTMLElement[] {
  const result: HTMLElement[] = []
  const all = root.querySelectorAll<HTMLElement>('*')
  for (const el of all) {
    const tag = el.tagName.toLowerCase()
    if (!MEANINGFUL_TAGS.has(tag)) continue
    if (el.hasAttribute('data-no-stagger')) continue
    // SVG 내부 요소는 제외 (svg 자체는 애초에 MEANINGFUL_TAGS 에 없음)
    if (el.closest('svg')) continue
    if (!hasContent(el)) continue
    result.push(el)
  }
  return result
}

// 단일 자식만 가진 투명 wrapper div 는 stagger 대상에서 빼기
//   <div className="wrap"><h2>제목</h2></div>  →  div 는 의미 없는 래퍼이므로 h2 만 애니메이트
//   <div className="card"><h3/><p/><button/></div>  →  div(여러 자식) + 자식 모두 애니메이트
function dedupeSingleChildWrappers(candidates: HTMLElement[]): HTMLElement[] {
  const set = new Set(candidates)
  return candidates.filter((el) => {
    if (el.tagName !== 'DIV') return true
    if (el.children.length !== 1) return true
    const onlyChild = el.children[0]
    // 유일한 자식이 다른 candidate 라면 그쪽이 stagger 처리하므로 본인은 제외
    return !set.has(onlyChild as HTMLElement)
  })
}

export default function ScrollAnimateChildren({ preset, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (preset === 'off') return
    const root = rootRef.current
    if (!root) return

    const prepClass = `anim-${preset}-prep`
    const candidates = collectCandidates(root)
    const targets = dedupeSingleChildWrappers(candidates)
    if (targets.length === 0) return

    const cleanups: Array<() => void> = []

    targets.forEach((el, i) => {
      el.classList.add(prepClass)
      const delay = Math.min(i * STAGGER_MS, MAX_TOTAL_DELAY)
      el.style.transitionDelay = `${delay}ms`
      cleanups.push(() => {
        el.classList.remove(prepClass, 'anim-in')
        el.style.transitionDelay = ''
      })
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('anim-in')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    )

    targets.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      cleanups.forEach((fn) => fn())
    }
  }, [preset])

  return <div ref={rootRef}>{children}</div>
}

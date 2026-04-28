'use client'

import React from 'react'
import { Image as ImageIcon } from 'lucide-react'
import type { InvitationContent, InvitationModule, MainModuleConfig } from '@/types/invitation'
import ClickableImage from './ClickableImage'
import { PhotoShape, type PhotoShapeId } from './photo-shapes'
import {
  DecorationOverlay,
  BackgroundLayer,
  type BackgroundPatternId,
} from './main-decorations'

// ── 입력 키 ─────────────────────────────────────────────────
// MainScreenPanel이 어떤 입력 필드를 노출할지 결정
// 텍스트/폰트 관련 옵션은 모두 textSlots 단일 섹션으로 통합되어 inputs[]에서 제거됨.
export type MainScreenInputKey =
  | 'coverImage'
  | 'secondImage'       // 두 번째 사진
  | 'photoShape'        // 사진 모양 선택
  | 'frameStyle'        // 프레임 스타일
  | 'decorations'       // 데코 multi
  | 'backgroundPattern' // 배경 패턴

export type MainCategory = 'wedding' | 'baby' | 'all'

export interface RendererProps {
  content: InvitationContent
  module: InvitationModule
  accent: string
  fontFamily: string
  showEnglish: boolean
}

export interface MainScreenTextSlot {
  key: string
  label: string
  getDefault: (content: InvitationContent) => string
  multiline?: boolean
}

export interface MainScreenVariant {
  id: string
  label: string
  categories: MainCategory[]
  Thumbnail: React.FC
  Renderer: React.FC<RendererProps>
  inputs: MainScreenInputKey[]
  defaultConfig?: Partial<MainModuleConfig>
  textSlots?: MainScreenTextSlot[]
}

// ── 공통 헬퍼 ───────────────────────────────────────────────
function RichText({ html, className, style }: { html: string; className?: string; style?: React.CSSProperties }) {
  if (!html) return null
  if (html.trimStart().startsWith('<')) {
    return <div className={`rich-text ${className ?? ''}`} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <div className={className} style={{ ...style, whiteSpace: 'pre-wrap' }}>{html}</div>
}

function pad2(n: number) { return n < 10 ? `0${n}` : String(n) }

function formatDateParts(content: InvitationContent) {
  const dateObj = content.eventDate ? new Date(content.eventDate) : new Date('2026-10-18')
  const yy = String(dateObj.getFullYear()).slice(2)
  const yyyy = String(dateObj.getFullYear())
  const mm = pad2(dateObj.getMonth() + 1)
  const dd = pad2(dateObj.getDate())
  return { yy, yyyy, mm, dd, dateObj }
}

function defaultBottomText(content: InvitationContent) {
  const { dateObj } = formatDateParts(content)
  const dateStr = `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}.`
  const timeStr = content.eventTime ?? '낮 12시 00분'
  return `${dateStr} ${timeStr}`
}

function defaultSubText(content: InvitationContent) {
  if (!content.venue?.name && !content.venue?.hall) return ''
  return `${content.venue?.name ?? ''}${content.venue?.hall ? ` ${content.venue.hall}` : ''}`
}

function defaultTopText(content: InvitationContent) {
  if (content.baby?.name) return getBabyName(content)
  const { first, second } = getCoupleNames(content)
  return `${first}\n그리고\n${second}`
}

function getCoupleNames(content: InvitationContent) {
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  const groomName = `${groom.last ?? '신'}${groom.first ?? '랑'}`
  const brideName = `${bride.last ?? '신'}${bride.first ?? '부'}`
  const [first, second] = (content.groomFirst ?? true) ? [groomName, brideName] : [brideName, groomName]
  return { first, second }
}

function getBabyName(content: InvitationContent) {
  return content.baby?.name ?? '주인공'
}

function CaptionBlock({ content, cfg }: { content: InvitationContent; cfg: MainModuleConfig }) {
  const showTitle = cfg.showTitle !== false
  const showSubText = cfg.showSubText !== false
  if (!showTitle && !showSubText) return null
  return (
    <div className="py-6 bg-white text-center">
      {showTitle && <RichText html={slotText(cfg, 'bottomText', defaultBottomText(content))} className="text-xs text-gray-600" />}
      {showSubText && (
        <RichText
          html={slotText(cfg, 'subText', defaultSubText(content))}
          className={`text-xs text-gray-400 ${showTitle ? 'mt-1' : ''}`}
        />
      )}
    </div>
  )
}

// 타이틀 폰트군 → font-family 매핑
function titleFontFamily(font: MainModuleConfig['titleFont'] | undefined, fallback: string) {
  if (!font || font === 'sans') return fallback
  if (font === 'serif') return 'Georgia, "Times New Roman", serif'
  if (font === 'script') return '"Caveat", "Brush Script MT", cursive'
  if (font === 'calligraphy') return '"Tangerine", "Great Vibes", "Brush Script MT", cursive'
  return fallback
}

// 메인 모듈 공통 래퍼: 배경 패턴 + 데코 오버레이 + 컨텐츠
// fullBleed: 좌우/상단 여백 없이 사진을 가장자리까지 채우는 variant용 (overlay-title)
function MainContainer({
  cfg, accent, children, fullBleed = false, className,
}: {
  cfg: MainModuleConfig
  accent: string
  children: React.ReactNode
  fullBleed?: boolean
  className?: string
}) {
  return (
    <section className={`relative overflow-hidden ${fullBleed ? '' : 'pt-8 pb-10'} ${className ?? ''}`}>
      <BackgroundLayer pattern={cfg.backgroundPattern as BackgroundPatternId | undefined} accent={accent} />
      <DecorationOverlay ids={cfg.decorations} accent={accent} />
      <div className="relative">{children}</div>
    </section>
  )
}

// 자유 텍스트 슬롯 헬퍼 — textSlots 우선, 비어있으면 legacy cfg 필드(구버전 데이터 호환).
// 기본값 fallback 은 시드/Panel 마운트시 hydration 으로 채워지므로 여기서는 처리하지 않는다.
const LEGACY_SLOT_FALLBACK: Record<string, keyof MainModuleConfig> = {
  bottomText: 'bottomText',
  subText: 'subText',
  calligraphy: 'calligraphyEnglish',
  cornerText: 'cornerText',
  verticalText: 'verticalText',
  verticalTextRight: 'verticalTextRight',
}
function slotText(cfg: MainModuleConfig, key: string, _unused?: string): string {
  void _unused
  const v = cfg.textSlots?.[key]
  if (v && v.length > 0) return v
  const legacyKey = LEGACY_SLOT_FALLBACK[key]
  if (legacyKey) {
    const lv = cfg[legacyKey] as string | undefined
    if (lv && lv.length > 0) return lv
  }
  return ''
}

// variant 의 모든 textSlots 를 현재 content 기반 실제 값으로 채워 Record 를 반환.
// Panel 의 variant 전환 / 마운트 hydration 에서 사용.
export function hydrateTextSlots(
  variant: MainScreenVariant,
  content: InvitationContent,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const slot of variant.textSlots ?? []) {
    out[slot.key] = slot.getDefault(content)
  }
  return out
}

// ── 1. classic — 베이비/공통: 사진 + 캡션 ─────────────────────
const ClassicRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const showNames = cfg.showNames !== false
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'square'
  const topText = slotText(cfg, 'topText') || defaultTopText(content)
  return (
    <MainContainer cfg={cfg} accent={accent}>
      {showNames && topText && (
        <header
          className="pt-10 pb-8 tracking-widest text-center"
          style={{ color: accent, fontFamily, fontSize: '1.125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
        >
          <RichText html={topText} />
        </header>
      )}
      <div className="mx-3.5">
        <PhotoShape
          shape={shape}
          src={content.coverImage}
          crop={content.coverImageCrop}
          fallbackAspect="4/5"
        />
        <CaptionBlock content={content} cfg={cfg} />
      </div>
    </MainContainer>
  )
}
const ClassicThumbnail: React.FC = () => (
  <div className="relative">
    <span className="absolute -top-0.5 left-1 w-1 h-1 bg-pink-300 rounded-full" />
    <span className="absolute top-1 right-1 w-1 h-1 bg-yellow-300 rounded-full" />
    <span className="absolute bottom-1 left-2 w-1 h-1 bg-green-300 rounded-full" />
    <div className="bg-white p-1 shadow-sm">
      <div className="bg-gray-200" style={{ aspectRatio: '4/5' }} />
      <div className="h-1 w-3/5 bg-gray-200 rounded-full mx-auto mt-1" />
    </div>
  </div>
)

// ── 2. bottom-text — 사진 + 손글씨 라인 + 이름 ─────────────────
const BottomTextRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const isBaby = !!content.baby?.name
  const subjectDefault = isBaby ? getBabyName(content) : (() => {
    const { first, second } = getCoupleNames(content)
    return `${first}   |   ${second}`
  })()
  const subjectLine = slotText(cfg, 'subject', subjectDefault)
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'square'
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-3.5">
        <PhotoShape shape={shape} src={content.coverImage} crop={content.coverImageCrop} fallbackAspect="3/4" />
      </div>
      <div className="mt-6 mx-6" style={{ fontFamily }}>
        {/* 손글씨 느낌의 점선 디바이더 + 양쪽 닷 */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-1 h-1 rounded-full" style={{ background: accent, opacity: 0.6 }} />
          <span className="flex-1 max-w-[120px] border-t border-dotted" style={{ borderColor: accent, opacity: 0.5 }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          <span className="flex-1 max-w-[120px] border-t border-dotted" style={{ borderColor: accent, opacity: 0.5 }} />
          <span className="w-1 h-1 rounded-full" style={{ background: accent, opacity: 0.6 }} />
        </div>
        <div className="text-center text-base mb-2 tracking-wider" style={{ color: '#333' }}>{subjectLine}</div>
        <div className="text-xs text-gray-500 text-center">
          <RichText html={slotText(cfg, 'bottomText', defaultBottomText(content))} className="text-xs text-gray-500" />
          <RichText html={slotText(cfg, 'subText', defaultSubText(content))} className="text-xs text-gray-400 mt-1" />
        </div>
      </div>
    </MainContainer>
  )
}
const BottomTextThumbnail: React.FC = () => (
  <div className="flex flex-col gap-1">
    <div className="bg-gray-200 rounded-sm" style={{ aspectRatio: '3/4' }} />
    <div className="flex items-center justify-center gap-0.5 my-0.5">
      <span className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
      <span className="w-3 border-t border-dotted border-gray-400" />
      <span className="w-1 h-1 bg-gray-500 rounded-full" />
      <span className="w-3 border-t border-dotted border-gray-400" />
      <span className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
    </div>
    <div className="h-1.5 w-2/3 bg-gray-200 rounded-full mx-auto" />
  </div>
)

// ── 3. date-big — 사진 좌, 큰 숫자 날짜 우 + ornament ────────
const DateBigRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const { yy, mm, dd } = formatDateParts(content)
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'square'
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-3.5 flex items-stretch gap-3">
        <div className="flex-1">
          <PhotoShape shape={shape} src={content.coverImage} crop={content.coverImageCrop} fallbackAspect="3/5" />
        </div>
        <div
          className="flex flex-col items-center justify-center w-20 leading-none"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: accent }}
        >
          <div className="text-5xl font-light tracking-wider">{slotText(cfg, 'dateLine1', yy)}</div>
          <div className="my-2 text-[10px] tracking-[0.3em] text-gray-400">✦</div>
          <div className="text-5xl font-light tracking-wider">{slotText(cfg, 'dateLine2', mm)}</div>
          <div className="my-2 text-[10px] tracking-[0.3em] text-gray-400">✦</div>
          <div className="text-5xl font-light tracking-wider">{slotText(cfg, 'dateLine3', dd)}</div>
        </div>
      </div>
      <div className="mt-6 mx-6 text-center text-xs text-gray-500" style={{ fontFamily }}>
        <RichText html={slotText(cfg, 'bottomText', defaultBottomText(content))} className="text-xs text-gray-600" />
        <RichText html={slotText(cfg, 'subText', defaultSubText(content))} className="text-xs text-gray-400 mt-1" />
      </div>
    </MainContainer>
  )
}
const DateBigThumbnail: React.FC = () => (
  <div className="flex gap-1.5 items-stretch">
    <div className="flex-1 bg-gray-200 rounded-sm" style={{ aspectRatio: '3/5' }} />
    <div className="flex flex-col items-center gap-0.5 w-5 pt-1" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="text-[9px] leading-none text-gray-600 font-light">26</div>
      <div className="text-[5px] text-gray-300">✦</div>
      <div className="text-[9px] leading-none text-gray-600 font-light">02</div>
      <div className="text-[5px] text-gray-300">✦</div>
      <div className="text-[9px] leading-none text-gray-600 font-light">21</div>
    </div>
  </div>
)

// ── save-the-date (웨딩) ────────────────────────────────
const SaveTheDateRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const { dateObj, dd, yyyy } = formatDateParts(content)
  const monthShort = dateObj.toLocaleString('en', { month: 'short' })
  const { first, second } = getCoupleNames(content)
  const calli = slotText(cfg, 'calligraphy', `${first} & ${second}`)
  const eventLabel = slotText(cfg, 'bottomText', `${dateObj.toLocaleString('en', { weekday: 'long' }).toUpperCase()}, ${dateObj.toLocaleString('en', { month: 'long' }).toUpperCase()} ${dd} | ${yyyy} At ${content.eventTime ?? '11:30 A.M.'}`)
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-6 my-4 py-12 px-6 border border-gray-300 text-center bg-white" style={{ fontFamily: 'Georgia, serif' }}>
        <div className="text-xs text-gray-400 italic mb-4">~ ~ ~</div>
        <div className="text-3xl tracking-[0.35em] text-gray-800 leading-tight">
          <div>SAVE</div>
          <div className="my-2">THE</div>
          <div>DATE</div>
        </div>
        <div className="my-6 flex items-center justify-center gap-3 text-sm" style={{ color: accent }}>
          <span>{monthShort} | {dd}th | {yyyy}</span>
        </div>
        <div className="text-2xl italic text-gray-700 mb-4" style={{ fontFamily: 'Brush Script MT, cursive' }}>
          {calli}
        </div>
        <div className="text-[10px] tracking-widest text-gray-500">{eventLabel}</div>
      </div>
      <div className="hidden" style={{ fontFamily }} />
    </MainContainer>
  )
}
const SaveTheDateThumbnail: React.FC = () => (
  <div className="border border-gray-300 bg-white p-1.5 text-center" style={{ aspectRatio: '4/5', fontFamily: 'Georgia, serif' }}>
    <div className="text-[6px] text-gray-400 italic mt-2">~~~</div>
    <div className="text-[8px] tracking-widest text-gray-700 mt-2 leading-tight">
      <div>SAVE</div>
      <div>THE</div>
      <div>DATE</div>
    </div>
    <div className="text-[5px] text-gray-400 mt-2">Feb 17 | 2026</div>
    <div className="text-[6px] italic text-gray-600">A & B</div>
  </div>
)

// ── 8. two-photo (웨딩) ────────────────────────────────────
const TwoPhotoRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const { first, second } = getCoupleNames(content)
  const leftText = slotText(cfg, 'verticalText', `${first} 그리고 ${second}`)
  const rightText = slotText(cfg, 'verticalTextRight', `${defaultBottomText(content)} | ${defaultSubText(content)}`)
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-3.5 flex items-stretch gap-3 py-4">
        <div className="text-[10px] tracking-widest text-gray-600 leading-relaxed flex-shrink-0" style={{ writingMode: 'vertical-rl', fontFamily }}>
          {leftText}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <ClickableImage
            src={content.coverImage}
            crop={content.coverImageCrop}
            fallbackAspect="4/3"
            alt="커버 1"
            placeholder={<ImageIcon size={32} className="text-gray-300" strokeWidth={1} />}
          />
          <ClickableImage
            src={cfg.secondImage}
            crop={cfg.secondImageCrop}
            fallbackAspect="4/3"
            alt="커버 2"
            placeholder={<ImageIcon size={32} className="text-gray-300" strokeWidth={1} />}
          />
        </div>
        <div className="text-[10px] tracking-widest text-gray-600 leading-relaxed flex-shrink-0 text-right" style={{ writingMode: 'vertical-rl', fontFamily }}>
          {rightText}
        </div>
      </div>
    </MainContainer>
  )
}
const TwoPhotoThumbnail: React.FC = () => (
  <div className="flex gap-1 items-stretch py-1">
    <div className="w-1.5 bg-gray-200 rounded-sm" />
    <div className="flex-1 flex flex-col gap-1">
      <div className="bg-gray-200 rounded-sm" style={{ aspectRatio: '4/3' }} />
      <div className="bg-gray-200 rounded-sm" style={{ aspectRatio: '4/3' }} />
    </div>
    <div className="w-1.5 bg-gray-200 rounded-sm" />
  </div>
)

// ── 10. arch — 사진 + 더블 타이포 + 별 데코 ──────────────────
const ArchRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const baby = getBabyName(content)
  const { yyyy, mm, dd } = formatDateParts(content)
  const titleFF = titleFontFamily('serif', fontFamily)
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'arch'
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-6 mt-4 text-center" style={{ fontFamily }}>
        <div className="text-xs text-gray-500 mb-1">{slotText(cfg, 'yearText', yyyy)}</div>
        <div className="text-[11px] tracking-[0.4em] text-gray-400 mb-1">{slotText(cfg, 'topAccent', 'HAPPY')}</div>
        <div
          className="text-2xl mb-1 leading-tight"
          style={{ color: accent, fontFamily: titleFF, fontStyle: 'italic' }}
        >
          {slotText(cfg, 'mainTitle', '1st BIRTHDAY')}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
          <span className="w-6 border-t border-gray-300" />
          <span>{slotText(cfg, 'dateText', `${mm}.${dd}`)}</span>
          <span className="w-6 border-t border-gray-300" />
        </div>
        <div className="relative mx-auto" style={{ width: '78%' }}>
          {/* 양옆 별 SVG */}
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', left: -22, top: '20%' }}>
            <path d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z" fill={accent} opacity="0.6" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', right: -22, top: '60%' }}>
            <path d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z" fill={accent} opacity="0.6" />
          </svg>
          <PhotoShape shape={shape} src={content.coverImage} crop={content.coverImageCrop} fallbackAspect="3/4" />
        </div>
        <div className="mt-5 text-base font-medium tracking-wider" style={{ color: accent }}>{slotText(cfg, 'subjectFormatted', `+ ${baby} +`)}</div>
        <RichText html={slotText(cfg, 'bottomText', defaultBottomText(content))} className="text-xs text-gray-500 mt-2" />
        <RichText html={slotText(cfg, 'subText', defaultSubText(content))} className="text-xs text-gray-400 mt-1" />
      </div>
    </MainContainer>
  )
}
const ArchThumbnail: React.FC = () => (
  <div className="text-center pt-1 relative">
    <div className="text-[5px] text-gray-400">2026</div>
    <div className="text-[5px] tracking-wider text-gray-300">HAPPY</div>
    <div className="text-[7px] italic" style={{ color: '#d4b9a8', fontFamily: 'Georgia, serif' }}>1st BIRTHDAY</div>
    <div className="relative mx-auto w-3/4 mt-1">
      <span className="absolute -left-1 top-1/2 w-1 h-1" style={{ background: '#d4b9a8' }} />
      <span className="absolute -right-1 top-1/2 w-1 h-1" style={{ background: '#d4b9a8' }} />
      <div className="bg-gray-200" style={{ borderTopLeftRadius: '999px', borderTopRightRadius: '999px', aspectRatio: '3/4' }} />
    </div>
  </div>
)

// ── 11. circle — 사진 + 인사 + 이름 + 스파클 ─────────────────
const CircleRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const baby = getBabyName(content)
  const greeting = slotText(cfg, 'greeting', '첫 생일의 주인공')
  const subject = slotText(cfg, 'subject', baby)
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'circle'
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-6 mt-6 text-center relative" style={{ fontFamily }}>
        <RichText html={greeting} className="text-xs text-gray-500 mb-1" />
        <div className="text-2xl font-medium mb-4 tracking-wide" style={{ color: accent, fontFamily: titleFontFamily('sans', fontFamily) }}>{subject}</div>
        <div className="relative mx-auto" style={{ width: '70%' }}>
          {/* 사방 스파클 */}
          {[
            { left: '-8%', top: '8%', size: 8 },
            { right: '-6%', top: '12%', size: 6 },
            { left: '-4%', bottom: '12%', size: 7 },
            { right: '-8%', bottom: '8%', size: 9 },
          ].map((p, i) => (
            <svg key={i} viewBox="0 0 24 24" width={p.size} height={p.size}
                 style={{ position: 'absolute', ...p, opacity: 0.7 }}>
              <path
                d="M12 2 L13 11 L22 12 L13 13 L12 22 L11 13 L2 12 L11 11 Z"
                fill={accent}
              />
            </svg>
          ))}
          <div
            style={{
              filter: `drop-shadow(0 0 16px ${accent}55)`,
            }}
          >
            <PhotoShape shape={shape} src={content.coverImage} crop={content.coverImageCrop} fallbackAspect="1/1" />
          </div>
        </div>
        <RichText html={slotText(cfg, 'bottomText', defaultBottomText(content))} className="text-xs text-gray-500 mt-4" />
        <RichText html={slotText(cfg, 'subText', defaultSubText(content))} className="text-xs text-gray-400 mt-1" />
      </div>
    </MainContainer>
  )
}
const CircleThumbnail: React.FC = () => (
  <div className="text-center pt-1 relative">
    <div className="h-1 w-1/2 bg-gray-200 rounded-full mx-auto" />
    <div className="h-2 w-2/5 bg-gray-300 rounded-full mx-auto my-1" />
    <div className="relative mx-auto" style={{ width: '60%' }}>
      <span className="absolute -left-1 -top-1 text-[6px]" style={{ color: '#d4b9a8' }}>✦</span>
      <span className="absolute -right-1 -bottom-1 text-[6px]" style={{ color: '#d4b9a8' }}>✦</span>
      <div className="rounded-full bg-gray-200" style={{ aspectRatio: '1/1' }} />
    </div>
  </div>
)

// ── 14. overlay-title — 풀스크린 + 그라데이션 + 폰트 옵션 ────
const OverlayTitleRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const baby = getBabyName(content)
  const title = slotText(cfg, 'title', `${baby}이의\n첫번째 생일`)
  const titleFF = titleFontFamily('serif', fontFamily)
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'square'
  return (
    <MainContainer cfg={cfg} accent={accent} fullBleed>
      <div className="relative" style={{ fontFamily }}>
        <PhotoShape
          shape={shape}
          src={content.coverImage}
          crop={content.coverImageCrop}
          fallbackAspect="4/5"
        />
        {/* 어두운 하단 그라데이션 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.55) 100%)' }}
        />
        {/* 상단 sparkle */}
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', top: 12, left: 18, opacity: 0.8 }}>
          <path d="M12 2 L13 11 L22 12 L13 13 L12 22 L11 13 L2 12 L11 11 Z" fill="#fff" />
        </svg>
        <svg width="10" height="10" viewBox="0 0 24 24" style={{ position: 'absolute', top: 28, right: 24, opacity: 0.8 }}>
          <path d="M12 2 L13 11 L22 12 L13 13 L12 22 L11 13 L2 12 L11 11 Z" fill="#fff" />
        </svg>
        <div
          className="absolute top-8 left-0 right-0 text-center font-semibold leading-tight text-white whitespace-pre-line px-4"
          style={{
            textShadow: '0 1px 12px rgba(0,0,0,0.55)',
            fontSize: '1.85rem',
            fontFamily: titleFF,
          }}
        >
          {title}
        </div>
        <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-white px-4" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          <RichText html={slotText(cfg, 'subText', defaultBottomText(content))} />
        </div>
      </div>
    </MainContainer>
  )
}
const OverlayTitleThumbnail: React.FC = () => (
  <div className="relative bg-gray-300 rounded-sm" style={{ aspectRatio: '4/5' }}>
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.2), transparent 60%, rgba(0,0,0,0.5))' }} />
    <div className="absolute top-1 left-0 right-0 text-center text-[7px] text-white font-semibold leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
      <div>이의</div>
      <div>첫번째 생일</div>
    </div>
    <span className="absolute top-0.5 right-0.5 text-[5px] text-white">✦</span>
  </div>
)

// ── 16. watercolor-frame (신규, 베이비) ────────────────────
const WatercolorFrameRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const baby = getBabyName(content)
  const calli = slotText(cfg, 'calligraphy', 'Happy 1st Birthday')
  const titleFF = titleFontFamily('calligraphy', '"Tangerine", "Brush Script MT", cursive')
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'blob'
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-6 mt-2 text-center relative" style={{ fontFamily }}>
        <div className="text-3xl mb-3" style={{ color: accent, fontFamily: titleFF, lineHeight: 1.1 }}>{calli}</div>
        <div className="relative mx-auto" style={{ width: '80%' }}>
          {/* 워터컬러 얼룩 3장 (사진 뒤) */}
          <svg viewBox="0 0 200 200" preserveAspectRatio="none"
               style={{ position: 'absolute', top: '-8%', left: '-12%', width: '50%', height: '50%', opacity: 0.5, zIndex: 0 }}>
            <ellipse cx="100" cy="100" rx="80" ry="60" fill={accent} fillOpacity="0.35" />
          </svg>
          <svg viewBox="0 0 200 200" preserveAspectRatio="none"
               style={{ position: 'absolute', bottom: '-10%', right: '-14%', width: '60%', height: '50%', opacity: 0.5, zIndex: 0 }}>
            <ellipse cx="100" cy="100" rx="80" ry="60" fill={accent} fillOpacity="0.25" />
          </svg>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <PhotoShape shape={shape} src={content.coverImage} crop={content.coverImageCrop} fallbackAspect="4/5" />
          </div>
        </div>
        <div className="mt-5 text-base font-medium tracking-wider" style={{ color: accent }}>{slotText(cfg, 'subjectFormatted', `· ${baby} ·`)}</div>
        <RichText html={slotText(cfg, 'bottomText', defaultBottomText(content))} className="text-xs text-gray-500 mt-2" />
        <RichText html={slotText(cfg, 'subText', defaultSubText(content))} className="text-xs text-gray-400 mt-1" />
      </div>
    </MainContainer>
  )
}
const WatercolorFrameThumbnail: React.FC = () => (
  <div className="text-center pt-1 relative">
    <div className="text-[7px]" style={{ color: '#d4b9a8', fontFamily: 'cursive' }}>Happy</div>
    <div className="relative mx-auto" style={{ width: '70%' }}>
      <div className="absolute inset-0 -m-1 rounded-full" style={{ background: 'radial-gradient(ellipse, #fda4af33, transparent 70%)' }} />
      <svg viewBox="0 0 1 1" width="100%" preserveAspectRatio="none" style={{ aspectRatio: '4/5', position: 'relative' }}>
        <path
          d="M 0.50 0.04 C 0.78 0.06 0.95 0.22 0.94 0.45 C 0.96 0.62 0.88 0.80 0.70 0.92 C 0.50 1.00 0.28 0.94 0.16 0.78 C 0.04 0.62 0.02 0.40 0.12 0.22 C 0.22 0.06 0.36 0.02 0.50 0.04 Z"
          fill="#e5e7eb"
        />
      </svg>
    </div>
  </div>
)

// ── 17. sticker-pop (신규, 베이비) ─────────────────────────
const StickerPopRenderer: React.FC<RendererProps> = ({ content, module, accent, fontFamily }) => {
  const cfg = (module?.config ?? {}) as MainModuleConfig
  const baby = getBabyName(content)
  const tilt = cfg.photoTilt ?? -2
  const titleFF = titleFontFamily('sans', fontFamily)
  const shape = (cfg.photoShape as PhotoShapeId | undefined) ?? 'square'
  const mainTitle = slotText(cfg, 'mainTitle', `${baby}'s\n1st BIRTHDAY!`)
  return (
    <MainContainer cfg={cfg} accent={accent}>
      <div className="mx-4 mt-2 text-center relative" style={{ fontFamily }}>
        <div
          className="text-2xl font-extrabold leading-tight mb-3 whitespace-pre-line"
          style={{ color: accent, fontFamily: titleFF, letterSpacing: '0.02em' }}
        >
          {mainTitle}
        </div>
        <div className="relative mx-auto" style={{ width: '70%' }}>
          {/* 풍선·별·하트·구름 스티커 */}
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ position: 'absolute', top: '-8%', left: '-12%', transform: 'rotate(-20deg)' }}>
            <path d="M12 4 L14 11 L21 11 L15.5 15 L17.5 22 L12 17.5 L6.5 22 L8.5 15 L3 11 L10 11 Z" fill="#fcd34d" stroke="#fff" strokeWidth="1" />
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ position: 'absolute', top: '-4%', right: '-8%' }}>
            <path d="M12 21 C 5 16 2 12 2 8 A 5 5 0 0 1 12 6 A 5 5 0 0 1 22 8 C 22 12 19 16 12 21 Z" fill="#f9a8d4" stroke="#fff" strokeWidth="1" />
          </svg>
          <svg width="22" height="22" viewBox="0 0 1 1" style={{ position: 'absolute', bottom: '4%', left: '-14%' }}>
            <path
              d="M 0.18 0.78 C 0.05 0.78 0.02 0.55 0.18 0.50 C 0.10 0.30 0.30 0.20 0.40 0.32 C 0.45 0.10 0.70 0.10 0.72 0.30 C 0.88 0.25 0.98 0.45 0.90 0.55 C 0.99 0.65 0.92 0.82 0.80 0.78 L 0.18 0.78 Z"
              fill="#93c5fd" stroke="#fff" strokeWidth="0.04"
            />
          </svg>
          <svg width="18" height="22" viewBox="0 0 1 1" style={{ position: 'absolute', bottom: '-4%', right: '-10%' }}>
            <path
              d="M 0.50 0.05 C 0.85 0.05 0.95 0.45 0.85 0.65 C 0.78 0.78 0.62 0.85 0.55 0.85 L 0.58 0.92 L 0.42 0.92 L 0.45 0.85 C 0.38 0.85 0.22 0.78 0.15 0.65 C 0.05 0.45 0.15 0.05 0.50 0.05 Z"
              fill="#86efac" stroke="#fff" strokeWidth="0.03"
            />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', top: '40%', right: '-14%', transform: 'rotate(15deg)' }}>
            <path d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z" fill="#c4b5fd" stroke="#fff" strokeWidth="1" />
          </svg>
          <div
            style={{
              transform: `rotate(${tilt}deg)`,
              padding: '6px 6px 12px',
              background: '#fff',
              boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            }}
          >
            <PhotoShape shape={shape} src={content.coverImage} crop={content.coverImageCrop} fallbackAspect="4/5" />
          </div>
        </div>
        <RichText html={slotText(cfg, 'bottomText', defaultBottomText(content))} className="text-xs text-gray-700 mt-4 font-medium" />
        <RichText html={slotText(cfg, 'subText', defaultSubText(content))} className="text-xs text-gray-400 mt-1" />
      </div>
    </MainContainer>
  )
}
const StickerPopThumbnail: React.FC = () => (
  <div className="text-center pt-1 relative">
    <div className="text-[6px] font-extrabold" style={{ color: '#d4b9a8' }}>BIRTHDAY!</div>
    <div className="relative mx-auto mt-1" style={{ width: '60%' }}>
      <span className="absolute -top-1 -left-1 text-[7px]" style={{ color: '#fcd34d' }}>★</span>
      <span className="absolute -top-1 -right-1 text-[6px]" style={{ color: '#f9a8d4' }}>♥</span>
      <span className="absolute -bottom-0 -left-1 text-[6px]" style={{ color: '#93c5fd' }}>☁</span>
      <div className="bg-white p-0.5 shadow" style={{ transform: 'rotate(-2deg)' }}>
        <div className="bg-gray-200" style={{ aspectRatio: '4/5' }} />
      </div>
    </div>
  </div>
)

// ── 카탈로그 ────────────────────────────────────────────────
// inputs[]는 시각 옵션 (coverImage/secondImage/photoShape/decorations/backgroundPattern).
// 텍스트는 textSlots로, 폰트는 디자이너가 Renderer 내부에 고정 지정.
export const MAIN_SCREEN_VARIANTS: MainScreenVariant[] = [
  // 공통
  {
    id: 'classic', label: '기본 액자', categories: ['all'],
    Thumbnail: ClassicThumbnail, Renderer: ClassicRenderer,
    inputs: ['coverImage', 'photoShape'],
    defaultConfig: { photoShape: 'square' },
    textSlots: [
      { key: 'topText', label: '상단 텍스트', multiline: true, getDefault: defaultTopText },
      { key: 'bottomText', label: '날짜·시간', getDefault: (c) => defaultBottomText(c) },
      { key: 'subText', label: '장소', getDefault: (c) => defaultSubText(c) },
    ],
  },
  {
    id: 'bottom-text', label: '하단 캡션', categories: ['wedding', 'baby'],
    Thumbnail: BottomTextThumbnail, Renderer: BottomTextRenderer,
    inputs: ['coverImage', 'photoShape', 'decorations', 'backgroundPattern'],
    defaultConfig: { photoShape: 'rounded', decorations: [], backgroundPattern: 'none' },
    textSlots: [
      { key: 'subject', label: '주인공 이름', getDefault: (c) => {
        if (c.baby?.name) return getBabyName(c)
        const { first, second } = getCoupleNames(c)
        return `${first}   |   ${second}`
      } },
      { key: 'bottomText', label: '날짜·시간', getDefault: (c) => defaultBottomText(c) },
      { key: 'subText', label: '장소', getDefault: (c) => defaultSubText(c) },
    ],
  },
  {
    id: 'date-big', label: '큰 숫자 날짜', categories: ['wedding', 'baby'],
    Thumbnail: DateBigThumbnail, Renderer: DateBigRenderer,
    inputs: ['coverImage', 'photoShape', 'decorations', 'backgroundPattern'],
    defaultConfig: { photoShape: 'square', decorations: [], backgroundPattern: 'none' },
    textSlots: [
      { key: 'dateLine1', label: '큰 숫자 1행', getDefault: (c) => formatDateParts(c).yy },
      { key: 'dateLine2', label: '큰 숫자 2행', getDefault: (c) => formatDateParts(c).mm },
      { key: 'dateLine3', label: '큰 숫자 3행', getDefault: (c) => formatDateParts(c).dd },
      { key: 'bottomText', label: '날짜·시간', getDefault: (c) => defaultBottomText(c) },
      { key: 'subText', label: '장소', getDefault: (c) => defaultSubText(c) },
    ],
  },
  // 웨딩 전용
  {
    id: 'save-the-date', label: 'SAVE THE DATE', categories: ['wedding'],
    Thumbnail: SaveTheDateThumbnail, Renderer: SaveTheDateRenderer,
    inputs: [],
    textSlots: [
      { key: 'calligraphy', label: '신랑 신부', getDefault: (c) => {
        const { first, second } = getCoupleNames(c)
        return `${first} & ${second}`
      } },
      { key: 'bottomText', label: '이벤트 라벨', getDefault: (c) => {
        const { dateObj, dd, yyyy } = formatDateParts(c)
        return `${dateObj.toLocaleString('en', { weekday: 'long' }).toUpperCase()}, ${dateObj.toLocaleString('en', { month: 'long' }).toUpperCase()} ${dd} | ${yyyy} At ${c.eventTime ?? '11:30 A.M.'}`
      } },
    ],
  },
  {
    id: 'two-photo', label: '두 장 사진', categories: ['wedding'],
    Thumbnail: TwoPhotoThumbnail, Renderer: TwoPhotoRenderer,
    inputs: ['coverImage', 'secondImage'],
    textSlots: [
      { key: 'verticalText', label: '좌측 세로 텍스트', getDefault: (c) => {
        const { first, second } = getCoupleNames(c)
        return `${first} 그리고 ${second}`
      } },
      { key: 'verticalTextRight', label: '우측 세로 텍스트', getDefault: (c) => `${defaultBottomText(c)} | ${defaultSubText(c)}` },
    ],
  },
  // 베이비 전용
  {
    id: 'arch', label: '타이틀 카드', categories: ['baby'],
    Thumbnail: ArchThumbnail, Renderer: ArchRenderer,
    inputs: ['coverImage', 'photoShape', 'decorations', 'backgroundPattern'],
    defaultConfig: { photoShape: 'arch', decorations: ['star'], backgroundPattern: 'gradient-soft' },
    textSlots: [
      { key: 'yearText', label: '상단 연도', getDefault: (c) => formatDateParts(c).yyyy },
      { key: 'topAccent', label: '상단 강조', getDefault: () => 'HAPPY' },
      { key: 'mainTitle', label: '메인 타이틀', getDefault: () => '1st BIRTHDAY' },
      { key: 'dateText', label: '날짜 표기', getDefault: (c) => `${formatDateParts(c).mm}.${formatDateParts(c).dd}` },
      { key: 'subjectFormatted', label: '주인공 표시', getDefault: (c) => `+ ${getBabyName(c)} +` },
      { key: 'bottomText', label: '날짜·시간', getDefault: (c) => defaultBottomText(c) },
      { key: 'subText', label: '장소', getDefault: (c) => defaultSubText(c) },
    ],
  },
  {
    id: 'circle', label: '이름 카드', categories: ['baby'],
    Thumbnail: CircleThumbnail, Renderer: CircleRenderer,
    inputs: ['coverImage', 'photoShape', 'decorations', 'backgroundPattern'],
    defaultConfig: { photoShape: 'circle', decorations: ['star'], backgroundPattern: 'gradient-soft' },
    textSlots: [
      { key: 'greeting', label: '인사 문구', getDefault: () => '첫 생일의 주인공' },
      { key: 'subject', label: '주인공 이름', getDefault: (c) => getBabyName(c) },
      { key: 'bottomText', label: '날짜·시간', getDefault: (c) => defaultBottomText(c) },
      { key: 'subText', label: '장소', getDefault: (c) => defaultSubText(c) },
    ],
  },
  {
    id: 'overlay-title', label: '제목 오버레이', categories: ['baby'],
    Thumbnail: OverlayTitleThumbnail, Renderer: OverlayTitleRenderer,
    inputs: ['coverImage', 'photoShape'],
    defaultConfig: { photoShape: 'square' },
    textSlots: [
      { key: 'title', label: '메인 제목 (Enter로 줄바꿈)', getDefault: (c) => `${getBabyName(c)}이의\n첫번째 생일`, multiline: true },
      { key: 'subText', label: '하단 텍스트', getDefault: (c) => defaultBottomText(c) },
    ],
  },
  {
    id: 'watercolor-frame', label: '수채화 배경', categories: ['baby'],
    Thumbnail: WatercolorFrameThumbnail, Renderer: WatercolorFrameRenderer,
    inputs: ['coverImage', 'photoShape', 'decorations', 'backgroundPattern'],
    defaultConfig: { photoShape: 'blob', decorations: ['petal'], backgroundPattern: 'watercolor' },
    textSlots: [
      { key: 'calligraphy', label: '캘리그래피', getDefault: () => 'Happy 1st Birthday' },
      { key: 'subjectFormatted', label: '주인공 표시', getDefault: (c) => `· ${getBabyName(c)} ·` },
      { key: 'bottomText', label: '날짜·시간', getDefault: (c) => defaultBottomText(c) },
      { key: 'subText', label: '장소', getDefault: (c) => defaultSubText(c) },
    ],
  },
  {
    id: 'sticker-pop', label: '스티커 팝', categories: ['baby'],
    Thumbnail: StickerPopThumbnail, Renderer: StickerPopRenderer,
    inputs: ['coverImage', 'photoShape', 'decorations', 'backgroundPattern'],
    defaultConfig: { photoShape: 'square', decorations: ['confetti'], backgroundPattern: 'dots', photoTilt: -2 },
    textSlots: [
      { key: 'mainTitle', label: '메인 타이틀 (Enter로 줄바꿈)', getDefault: (c) => `${getBabyName(c)}'s\n1st BIRTHDAY!`, multiline: true },
      { key: 'bottomText', label: '날짜·시간', getDefault: (c) => defaultBottomText(c) },
      { key: 'subText', label: '장소', getDefault: (c) => defaultSubText(c) },
    ],
  },
]

// 카테고리 매핑 (slug → MainCategory)
function categoryOf(slug: string | null): MainCategory {
  if (!slug) return 'all'
  if (slug === 'wedding') return 'wedding'
  if (slug === 'baby') return 'baby'
  return 'all'
}

export function getVariantsForCategory(slug: string | null): MainScreenVariant[] {
  const cat = categoryOf(slug)
  if (cat === 'all') return MAIN_SCREEN_VARIANTS
  return MAIN_SCREEN_VARIANTS.filter(v => v.categories.includes('all') || v.categories.includes(cat))
}

export function findVariant(id: string | undefined): MainScreenVariant | null {
  if (!id) return null
  return MAIN_SCREEN_VARIANTS.find(v => v.id === id) ?? null
}

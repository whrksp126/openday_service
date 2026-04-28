'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEditorStore } from '@/store/editor'
import {
  Image as ImageIcon, Film,
  Heart, LayoutGrid, MessageSquare, Tag, Phone, Users, User,
  AlignLeft, MessageCircle, CalendarDays, MapPin, Images,
  BookOpen, CreditCard, CheckSquare, Timer, GalleryHorizontal,
  Camera, AlignCenter, Share2, UserRound, Pencil, Trash2,
  X, ChevronDown, ChevronLeft, ChevronRight, Play,
} from 'lucide-react'
import type { BgmConfig, ContactGroup, GuestbookEntry, GuestbookModuleConfig, ImageCropData, InvitationContent, InvitationModule, InvitationStyles, ModuleType, ProfilePerson, RsvpModuleConfig, SlideModuleConfig, TabModuleConfig, VenueModuleConfig } from '@/types/invitation'
import NaverMap from '@/components/shared/NaverMap'
import ClickableImage from './ClickableImage'
import RsvpModal from './RsvpModal'
import GuestbookModal from './GuestbookModal'
import { ImageLightboxProvider } from '@/components/shared/ImageLightboxProvider'
import { findVariant } from './main-screen-variants'

const DEFAULT_ACCENT = '#bf8362'
const DEFAULT_BG = '#f3f3f3'

const FONT_MAP: Record<string, string> = {
  '고운돋움': "'Gowun Dodum', sans-serif",
  '나눔명조': "'Nanum Myeongjo', serif",
  '나눔바른고딕': "'Nanum Gothic', sans-serif",
  '제주명조': "'Jeju Myeongjo', serif",
  'KoPubWorld돋움': "'KoPub Batang', sans-serif",
  'Noto Sans KR': "'Noto Sans KR', sans-serif",
}

const FONT_URLS: Record<string, string> = {
  '고운돋움': 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap',
  '나눔명조': 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo&display=swap',
  '나눔바른고딕': 'https://fonts.googleapis.com/css2?family=Nanum+Gothic&display=swap',
  '제주명조': 'https://fonts.googleapis.com/css2?family=Jeju+Myeongjo&display=swap',
  'Noto Sans KR': 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap',
}

const SIMPLE_SECTIONS: Partial<Record<ModuleType, { label: string; englishLabel?: string }>> = {
  guestalbum: { label: '하객 앨범', englishLabel: 'Guest Album' },
  opening: { label: '오프닝' },
}

// 각 모듈 타입에 대응하는 아이콘+레이블
const MODULE_META: Partial<Record<ModuleType | string, { icon: React.ElementType; label: string }>> = {
  main: { icon: LayoutGrid, label: '메인 화면' },
  photo_frame: { icon: LayoutGrid, label: '액자' },
  couple_names: { icon: UserRound, label: '주인공' },
  greeting: { icon: MessageSquare, label: '인사말' },
  nickname: { icon: Tag, label: '세례명·닉' },
  contact: { icon: Phone, label: '연락처' },
  profile: { icon: Users, label: '가로형 프로필' },
  solo_profile: { icon: User, label: '세로형 프로필' },
  timeline: { icon: AlignLeft, label: '타임라인' },
  timeline_polaroid: { icon: Camera, label: '타임라인 폴라로이드' },
  interview: { icon: MessageCircle, label: '인터뷰' },
  midphoto: { icon: ImageIcon, label: '단독' },
  datetime: { icon: CalendarDays, label: '달력 표현' },
  venue: { icon: MapPin, label: '지도' },
  tab: { icon: LayoutGrid, label: '탭' },
  slide: { icon: GalleryHorizontal, label: '슬라이드' },
  gallery: { icon: Images, label: '갤러리' },
  guestbook: { icon: BookOpen, label: '방명록' },
  account: { icon: CreditCard, label: '계좌 정보' },
  rsvp: { icon: CheckSquare, label: 'RSVP' },
  dday: { icon: Timer, label: 'D+Day' },
  video: { icon: Film, label: '동영상' },
  guestalbum: { icon: Camera, label: '하객 앨범' },
  ending: { icon: AlignCenter, label: '엔딩 사진' },
  share: { icon: Share2, label: '공유하기' },
  basic: { icon: Heart, label: '기본 정보' },
}

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// ── 신랑·신부 이름 헤더 섹션 ─────────────────────────────────────────────────
function BabyNameSection({ accent, content, fontFamily, module, showEnglish }: { accent: string; content: InvitationContent; fontFamily: string; module: InvitationModule; showEnglish: boolean }) {
  const cfg = module.config
  const baby = content.baby ?? {}
  const father = content.parents?.father
  const mother = content.parents?.mother
  const fatherFirst = content.babyFatherFirst ?? true
  const parentLine = (() => {
    const a = fatherFirst ? father?.name : mother?.name
    const b = fatherFirst ? mother?.name : father?.name
    if (!a && !b) return ''
    if (!a) return `${b}의 보물`
    if (!b) return `${a}의 보물`
    return `${a} · ${b}의 보물`
  })()
  const babyName = (cfg.firstNameText as string | undefined) ?? baby.name ?? '아기'
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (cfg.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: (cfg.labelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.labelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.labelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center" style={{ fontFamily }}>
      {(cfg.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{(cfg.koreanTitle as string | undefined) ?? '주인공'}</p>}
      {showEnglish && (cfg.labelVisible as boolean) !== false && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{(cfg.englishTitle as string | undefined) ?? 'Baby'}</p>}
      {parentLine && <div className="text-xs text-gray-500 mb-2">{parentLine}</div>}
      <div className="tracking-widest" style={{ color: accent, fontSize: '1.25rem' }}>{babyName}</div>
    </section>
  )
}

function CoupleNamesSection({ accent, content, fontFamily, module, showEnglish }: { accent: string; content: InvitationContent; fontFamily: string; module: InvitationModule; showEnglish: boolean }) {
  const cfg = module.config
  if ((cfg.subjectMode as string | undefined) === 'baby') {
    return <BabyNameSection accent={accent} content={content} fontFamily={fontFamily} module={module} showEnglish={showEnglish} />
  }
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  const groomName = `${groom.last ?? '신'}${groom.first ?? '랑'}`
  const brideName = `${bride.last ?? '신'}${bride.first ?? '부'}`
  const [defaultFirst, defaultSecond] = (content.groomFirst ?? true) ? [groomName, brideName] : [brideName, groomName]
  const firstName = (cfg.firstNameText as string | undefined) ?? defaultFirst
  const secondName = (cfg.secondNameText as string | undefined) ?? defaultSecond
  const sepText = (cfg.separatorText as string | undefined) ?? '그리고'
  const firstStyle: React.CSSProperties = { fontWeight: (cfg.firstNameBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.firstNameItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.firstNameAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const sepStyle: React.CSSProperties = { fontWeight: (cfg.separatorBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.separatorItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.separatorAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const secondStyle: React.CSSProperties = { fontWeight: (cfg.secondNameBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.secondNameItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.secondNameAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (cfg.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: (cfg.labelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.labelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.labelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: (cfg.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (cfg.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleBigAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (cfg.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleSmallAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center" style={{ fontFamily }}>
      {(cfg.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{(cfg.koreanTitle as string | undefined) ?? '신랑·신부'}</p>}
      {showEnglish && (cfg.labelVisible as boolean) !== false && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{(cfg.englishTitle as string | undefined) ?? 'Couple'}</p>}
      {(cfg.titleBigVisible as boolean) !== false && (cfg.titleBig as string | undefined) && (
        <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{cfg.titleBig as string}</div>
      )}
      {(cfg.titleSmallVisible as boolean) !== false && (cfg.titleSmall as string | undefined) && (
        <div className="text-xs text-gray-400 mb-5" style={titleSmallStyle}>{cfg.titleSmall as string}</div>
      )}
      <div className="tracking-widest" style={{ color: accent, fontSize: '1.125rem' }}>
        {cfg.firstNameVisible !== false && <div style={firstStyle}>{firstName}</div>}
        {cfg.separatorVisible !== false && <div className="my-1 text-gray-400 text-sm" style={sepStyle}>{sepText}</div>}
        {cfg.secondNameVisible !== false && <div style={secondStyle}>{secondName}</div>}
      </div>
    </section>
  )
}

// ── bgEffect 패턴 계산 ──────────────────────────────────────────────────────
function getBgEffect(effect?: string): { backgroundImage: string; backgroundSize?: string } {
  switch (effect) {
    case 'grid':
      return {
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }
    case 'dot':
      return {
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }
    case 'paper':
      return {
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.025) 24px, rgba(0,0,0,0.025) 25px)',
      }
    case 'hanji':
      return {
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(160,120,60,0.07) 28px, rgba(160,120,60,0.07) 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(160,120,60,0.07) 28px, rgba(160,120,60,0.07) 29px)',
      }
    case 'cloud':
      return {
        backgroundImage: 'radial-gradient(ellipse at 15% 40%, rgba(255,255,255,0.4) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.4) 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.3) 0%, transparent 45%)',
      }
    default:
      return { backgroundImage: 'none' }
  }
}

// ── 리치 텍스트 렌더러 (HTML or 플레인 텍스트 자동 판별) ─────────────────────
function RichText({ html, className, style }: { html: string; className?: string; style?: React.CSSProperties }) {
  if (!html) return null
  if (html.trimStart().startsWith('<')) {
    return <div className={`rich-text ${className ?? ''}`} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <div className={className} style={{ ...style, whiteSpace: 'pre-wrap' }}>{html}</div>
}

// ── 메인 커버 섹션 ───────────────────────────────────────────────────────────
// variant dispatcher — 실제 렌더링은 main-screen-variants.tsx의 각 Renderer가 담당.
// showNames는 classic/two-photo 등 일부 variant에서 module.config.showNames로 옮겨가기 전 호환을 위해 유지.
function MainSection({ content, accent, fontFamily, showNames, showEnglish, module }: {
  content: InvitationContent; accent: string; fontFamily: string; showNames: boolean; showEnglish: boolean; module?: InvitationModule
}) {
  const captureBgColor = useEditorStore((s) => s.styles.bgColor) ?? '#ffffff'
  if (!module) return null
  const variantId = (module.config?.variant as string | undefined) ?? 'classic'
  const variant = findVariant(variantId) ?? findVariant('classic')!
  const Renderer = variant.Renderer
  // module.config.showNames 미지정 시 외부 showNames prop을 fallback으로 적용 (기존 동작 유지)
  const moduleWithFallback: InvitationModule = (module.config?.showNames === undefined && !showNames)
    ? { ...module, config: { ...module.config, showNames: false } }
    : module
  return (
    <div data-capture-target="main" style={{ backgroundColor: captureBgColor }}>
      <Renderer content={content} module={moduleWithFallback} accent={accent} fontFamily={fontFamily} showEnglish={showEnglish} />
    </div>
  )
}

// ── 인사말 ──────────────────────────────────────────────────────────────────
function GreetingSection({ accent, content, showEnglish }: { accent: string; content: InvitationContent; showEnglish: boolean }) {
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  const groomName = `${groom.last ?? '신'}${groom.first ?? '랑'}`
  const brideName = `${bride.last ?? '신'}${bride.first ?? '부'}`
  const [first, second] = (content.groomFirst ?? true) ? [groomName, brideName] : [brideName, groomName]
  const englishLabel = content.greetingEnglishTitle ?? 'Invitation'
  const labelVisible = content.greetingLabelVisible !== false
  const labelStyle: React.CSSProperties = {
    fontWeight: content.greetingLabelBold ? 'bold' : undefined,
    fontStyle: content.greetingLabelItalic ? 'italic' : undefined,
    textAlign: (content.greetingLabelAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const author = content.greetingAuthor ?? `${first} · ${second}`
  const authorVisible = content.greetingAuthorVisible !== false
  const authorStyle: React.CSSProperties = {
    fontWeight: content.greetingAuthorBold ? 'bold' : undefined,
    fontStyle: content.greetingAuthorItalic ? 'italic' : undefined,
    textAlign: (content.greetingAuthorAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const koreanLabel = content.greetingKoreanTitle ?? '인사말'
  const koreanLabelVisible = content.greetingKoreanLabelVisible !== false
  const koreanLabelStyle: React.CSSProperties = {
    fontWeight: content.greetingKoreanLabelBold ? 'bold' : undefined,
    fontStyle: content.greetingKoreanLabelItalic ? 'italic' : undefined,
    textAlign: (content.greetingKoreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const titleBigStyle: React.CSSProperties = {
    fontWeight: content.invitationTitleBold ? 'bold' : undefined,
    fontStyle: content.invitationTitleItalic ? 'italic' : undefined,
    textAlign: (content.invitationTitleAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const titleSmallStyle: React.CSSProperties = {
    fontWeight: content.greetingTitleSmallBold ? 'bold' : undefined,
    fontStyle: content.greetingTitleSmallItalic ? 'italic' : undefined,
    textAlign: (content.greetingTitleSmallAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {koreanLabelVisible && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{koreanLabel}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishLabel}</p>}
      {content.invitationTitleVisible !== false && content.invitationTitle && (
        <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{content.invitationTitle}</div>
      )}
      {content.invitationTitleVisible !== false && !content.invitationTitle && (
        <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>소중한 분들을 초대합니다</div>
      )}
      {content.greetingTitleSmallVisible !== false && content.greetingTitleSmall && (
        <div className="text-xs text-gray-400 mb-5" style={titleSmallStyle}>{content.greetingTitleSmall}</div>
      )}
      {content.greetingMessageVisible !== false && <RichText html={content.greetingMessage ?? '저희 두 사람의 작은 만남이\n진실한 사랑으로 꽃피어\n오늘 이 자리를 빛내는 결혼식으로 이어졌습니다.'} className="text-xs text-gray-600 leading-8 mb-6" />}
      {authorVisible && <div className="text-xs text-gray-500 mt-2" style={authorStyle}>{author}</div>}
    </section>
  )
}

// ── 예식 일시 ────────────────────────────────────────────────────────────────
function DatetimeSection({ accent, content, showEnglish }: { accent: string; content: InvitationContent; showEnglish: boolean }) {
  const dateObj = content.eventDate ? new Date(content.eventDate) : new Date('2026-10-18')
  const year = dateObj.getFullYear()
  const month = dateObj.getMonth() + 1
  const day = dateObj.getDate()
  const calendar = useMemo(() => buildCalendar(year, month), [year, month])
  const dateStr = `${year}. ${month}. ${day}. ${WEEKDAYS[dateObj.getDay()]}요일`
  const timeStr = content.eventTime ?? '낮 12시 00분'
  const datetimeLabelVisible = content.datetimeLabelVisible !== false
  const datetimeLabelStyle: React.CSSProperties = {
    fontWeight: content.datetimeLabelBold ? 'bold' : undefined,
    fontStyle: content.datetimeLabelItalic ? 'italic' : undefined,
    textAlign: (content.datetimeLabelAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const datetimeKoreanLabel = content.datetimeKoreanTitle ?? '예식 일시'
  const datetimeKoreanLabelVisible = content.datetimeKoreanLabelVisible !== false
  const datetimeKoreanLabelStyle: React.CSSProperties = {
    fontWeight: content.datetimeKoreanLabelBold ? 'bold' : undefined,
    fontStyle: content.datetimeKoreanLabelItalic ? 'italic' : undefined,
    textAlign: (content.datetimeKoreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const titleBigVisible = content.datetimeTitleBigVisible !== false
  const titleBigText = content.datetimeTitleBig ?? dateStr
  const titleBigStyle: React.CSSProperties = {
    fontWeight: content.datetimeTitleBigBold ? 'bold' : undefined,
    fontStyle: content.datetimeTitleBigItalic ? 'italic' : undefined,
    textAlign: (content.datetimeTitleBigAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const titleSmallVisible = content.datetimeTitleSmallVisible !== false
  const titleSmallText = content.datetimeTitleSmall ?? timeStr
  const titleSmallStyle: React.CSSProperties = {
    fontWeight: content.datetimeTitleSmallBold ? 'bold' : undefined,
    fontStyle: content.datetimeTitleSmallItalic ? 'italic' : undefined,
    textAlign: (content.datetimeTitleSmallAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {datetimeKoreanLabelVisible && <p className="text-sm mb-1" style={{ color: accent, ...datetimeKoreanLabelStyle }}>{datetimeKoreanLabel}</p>}
      {showEnglish && datetimeLabelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...datetimeLabelStyle }}>{content.datetimeEnglishTitle ?? 'Wedding Day'}</p>}
      {titleBigVisible && titleBigText && <div className="text-sm text-gray-800 mt-2 mb-1" style={titleBigStyle}>{titleBigText}</div>}
      {titleSmallVisible && titleSmallText && <div className="text-xs text-gray-500 mb-6" style={titleSmallStyle}>{titleSmallText}</div>}
      <div className="text-sm font-medium mb-4" style={{ color: '#333' }}>{month}월</div>
      <table className="w-full text-xs mb-4" cellPadding={4}>
        <thead>
          <tr>{WEEKDAYS.map((d, i) => (
            <th key={i} className="text-center font-normal" style={{ color: i === 0 ? '#d97c74' : i === 6 ? '#668eaa' : '#999' }}>{d}</th>
          ))}</tr>
        </thead>
        <tbody>
          {calendar.map((week, wi) => (
            <tr key={wi}>{week.map((d, di) => (
              <td key={di} className="text-center py-1">
                {d && (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs" style={
                    d === day
                      ? { backgroundColor: accent, color: '#fff', fontWeight: 'bold' }
                      : { color: di === 0 ? '#d97c74' : di === 6 ? '#668eaa' : '#555' }
                  }>{d}</span>
                )}
              </td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// ── 지도 앱 딥링크 ──────────────────────────────────────────────────────────
function openExternalApp(scheme: string, fallback: string) {
  if (typeof window === 'undefined') return
  const now = Date.now()
  window.location.href = scheme
  setTimeout(() => {
    // 앱이 열려 포커스를 잃었으면 skip
    if (document.hidden || document.visibilityState === 'hidden') return
    if (Date.now() - now < 1800) window.location.href = fallback
  }, 1500)
}

function NavButton({ label, iconSrc, onClick }: { label: string; iconSrc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-start gap-2 px-2 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors min-w-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="" className="flex-shrink-0 w-5 h-5 rounded-full object-cover" />
      <span className="text-[13px] leading-tight text-gray-700 font-medium whitespace-nowrap">{label}</span>
    </button>
  )
}

// ── 예식 장소 ────────────────────────────────────────────────────────────────
function VenueSection({ accent, content, showEnglish, module }: { accent: string; content: InvitationContent; showEnglish: boolean; module: InvitationModule }) {
  const cfg = (module.config ?? {}) as VenueModuleConfig
  const venue = cfg.mapVenue ?? content.venue
  const venueKoreanLabelVisible = content.venueKoreanLabelVisible !== false
  const venueKoreanLabelStyle: React.CSSProperties = {
    fontWeight: content.venueKoreanLabelBold ? 'bold' : undefined,
    fontStyle: content.venueKoreanLabelItalic ? 'italic' : undefined,
    textAlign: (content.venueKoreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const venueLabelVisible = content.venueLabelVisible !== false
  const venueLabelStyle: React.CSSProperties = {
    fontWeight: content.venueLabelBold ? 'bold' : undefined,
    fontStyle: content.venueLabelItalic ? 'italic' : undefined,
    textAlign: (content.venueLabelAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const venueTitleBigVisible = content.venueTitleBigVisible !== false
  const venueTitleBigStyle: React.CSSProperties = {
    fontWeight: content.venueTitleBigBold ? 'bold' : 'medium',
    fontStyle: content.venueTitleBigItalic ? 'italic' : undefined,
    textAlign: (content.venueTitleBigAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const venueTitleSmallVisible = content.venueTitleSmallVisible !== false
  const venueTitleSmallStyle: React.CSSProperties = {
    fontWeight: content.venueTitleSmallBold ? 'bold' : undefined,
    fontStyle: content.venueTitleSmallItalic ? 'italic' : undefined,
    textAlign: (content.venueTitleSmallAlign as React.CSSProperties['textAlign']) ?? 'center',
    whiteSpace: 'pre-line',
  }
  const titleBig = content.venueTitleBig
  const titleSmall = content.venueTitleSmall
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {venueKoreanLabelVisible && <p className="text-sm mb-1" style={{ color: accent, ...venueKoreanLabelStyle }}>{content.venueKoreanTitle ?? '예식 장소'}</p>}
      {showEnglish && venueLabelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...venueLabelStyle }}>{content.venueEnglishTitle ?? 'Location'}</p>}
      {venueTitleBigVisible && titleBig && (
        <div className="text-sm text-gray-800 mb-1" style={venueTitleBigStyle}>{titleBig}</div>
      )}
      {venueTitleSmallVisible && titleSmall && (
        <div className="text-xs text-gray-400 mb-5" style={venueTitleSmallStyle}>{titleSmall}</div>
      )}
      {(venue?.address || (venue?.lat != null && venue?.lng != null)) ? (
        <div className="rounded-lg overflow-hidden border border-gray-100 mb-3">
          <NaverMap lat={venue?.lat} lng={venue?.lng} address={venue?.address} markerTitle={venue?.name} height="180px" />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-gray-100 mb-3">
          주소 검색으로 지도를 설정하세요
        </div>
      )}
      {venue?.address && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <NavButton
            label="네이버지도"
            iconSrc="/images/v1/icon_image/icon_navermap_200.png"
            onClick={() => openExternalApp(
              `nmap://search?query=${encodeURIComponent(venue.address ?? '')}&appname=openday.ghmate.com`,
              `https://map.naver.com/p/search/${encodeURIComponent(venue.address ?? '')}`,
            )}
          />
          <NavButton
            label="티맵"
            iconSrc="/images/v1/icon_image/icon_tmap_200.png"
            onClick={() => openExternalApp(
              `tmap://search?name=${encodeURIComponent(venue.address ?? '')}`,
              `https://tmap.life/route?goalname=${encodeURIComponent(venue.address ?? '')}`,
            )}
          />
          <NavButton
            label="카카오맵"
            iconSrc="/images/v1/icon_image/icon_kakaomap_200.png"
            onClick={() => {
              const { lat, lng, address } = venue
              const scheme = (lat != null && lng != null)
                ? `kakaomap://look?p=${lat},${lng}`
                : `kakaomap://search?q=${encodeURIComponent(address ?? '')}`
              openExternalApp(scheme, `https://map.kakao.com/?q=${encodeURIComponent(address ?? '')}`)
            }}
          />
        </div>
      )}
    </section>
  )
}

// 공통: legacy(person1*/person2* 또는 단일 image/personName) → ProfilePerson[] 변환
function readProfilePersons(cfg: Record<string, unknown>): ProfilePerson[] {
  if (Array.isArray(cfg.persons)) return cfg.persons as ProfilePerson[]
  if (cfg.person1Image || cfg.person1Label || cfg.person1Story || cfg.person2Image || cfg.person2Label || cfg.person2Story
      || cfg.groomImage || cfg.groomRoleLabel || cfg.groomStory || cfg.brideImage || cfg.brideRoleLabel || cfg.brideStory) {
    return [
      {
        image: (cfg.person1Image ?? cfg.groomImage) as string | undefined,
        imageCrop: (cfg.person1ImageCrop ?? cfg.groomImageCrop) as ImageCropData | undefined,
        name: (cfg.person1Label ?? cfg.groomRoleLabel) as string | undefined,
        description: (cfg.person1Story ?? cfg.groomStory) as string | undefined,
        descriptionVisible: (cfg.person1StoryVisible ?? cfg.groomStoryVisible) as boolean | undefined,
      },
      {
        image: (cfg.person2Image ?? cfg.brideImage) as string | undefined,
        imageCrop: (cfg.person2ImageCrop ?? cfg.brideImageCrop) as ImageCropData | undefined,
        name: (cfg.person2Label ?? cfg.brideRoleLabel) as string | undefined,
        description: (cfg.person2Story ?? cfg.brideStory) as string | undefined,
        descriptionVisible: (cfg.person2StoryVisible ?? cfg.brideStoryVisible) as boolean | undefined,
      },
    ]
  }
  if (cfg.image || cfg.personName || cfg.birthDate || cfg.hashtags || cfg.description) {
    return [{
      image: cfg.image as string | undefined,
      imageCrop: cfg.imageCrop as ImageCropData | undefined,
      name: cfg.personName as string | undefined,
      title: cfg.birthDate as string | undefined,
      hashtags: cfg.hashtags as string[] | undefined,
      description: cfg.description as string | undefined,
      descriptionVisible: cfg.descriptionVisible as boolean | undefined,
    }]
  }
  return []
}

// ── 세로형 프로필 (공통, 1명 이상) ────────────────────────────────────────────
function SoloProfileSection({ accent, content, showEnglish, module }: { accent: string; content: InvitationContent; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as Record<string, unknown>
  const persons = readProfilePersons(cfg)
  // 빈 데이터일 때 baby content 한 명을 fallback 으로 표시(시드 호환)
  const fallbackBaby = content.baby
  const display: ProfilePerson[] = persons.length > 0 ? persons : (fallbackBaby ? [{
    name: fallbackBaby.name,
    title: fallbackBaby.birthDate,
    hashtags: fallbackBaby.hashtags,
    description: fallbackBaby.description,
  }] : [])
  const koreanTitle = cfg.koreanTitle as string | undefined
  const englishTitle = cfg.englishTitle as string | undefined
  const titleBig = cfg.titleBig as string | undefined
  const titleSmall = cfg.titleSmall as string | undefined
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {cfg.koreanLabelVisible !== false && <p className="text-sm mb-1" style={{ color: accent }}>{koreanTitle ?? '소개'}</p>}
      {showEnglish && cfg.labelVisible !== false && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif' }}>{englishTitle ?? 'About'}</p>}
      {cfg.titleBigVisible !== false && titleBig && <div className="text-sm text-gray-800 mb-1">{titleBig}</div>}
      {cfg.titleSmallVisible !== false && titleSmall && <div className="text-xs text-gray-400 mb-4">{titleSmall}</div>}
      <div className="space-y-3 mt-2">
        {display.map((person, i) => {
          const hashtags = (person.hashtags ?? []).map(h => `#${h}`).join(' ')
          const descVisible = person.descriptionVisible !== false
          return (
            <div key={i} className="bg-white rounded-2xl p-5">
              <div className="w-32 mx-auto mb-4">
                <ClickableImage
                  src={person.image}
                  crop={person.imageCrop}
                  fallbackAspect="1/1"
                  rounded="rounded-full"
                  placeholder={<ImageIcon size={28} className="text-gray-300" strokeWidth={1} />}
                />
              </div>
              {person.name && <div className="tracking-widest mb-1" style={{ color: accent, fontSize: '1.25rem' }}>{person.name}</div>}
              {person.title && <div className="text-xs text-gray-500 mb-1">{person.title}</div>}
              {hashtags && <div className="text-xs mb-2" style={{ color: accent }}>{hashtags}</div>}
              {person.description && descVisible && (
                <RichText html={person.description} className="text-xs text-gray-500 leading-relaxed whitespace-pre-line" />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ── 커플 프로필 ───────────────────────────────────────────────────────────────
function BabyProfileSection({ accent, content, showEnglish, module }: { accent: string; content: InvitationContent; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as { babyImage?: string; babyImageCrop?: ImageCropData; koreanTitle?: string; koreanLabelVisible?: boolean; englishTitle?: string; labelVisible?: boolean; titleBig?: string; titleBigVisible?: boolean; titleSmall?: string; titleSmallVisible?: boolean }
  const baby = content.baby ?? {}
  const birthDateStr = baby.birthDate ? (() => {
    const d = new Date(baby.birthDate as string)
    if (Number.isNaN(d.getTime())) return baby.birthDate
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`
  })() : ''
  const hashtags = (baby.hashtags ?? []).map(h => `#${h}`).join(' ')
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {cfg.koreanLabelVisible !== false && <p className="text-sm mb-1" style={{ color: accent }}>{cfg.koreanTitle ?? '주인공 소개'}</p>}
      {showEnglish && cfg.labelVisible !== false && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif' }}>{cfg.englishTitle ?? 'About Baby'}</p>}
      {cfg.titleBigVisible !== false && cfg.titleBig && <div className="text-sm text-gray-800 mb-1">{cfg.titleBig}</div>}
      {cfg.titleSmallVisible !== false && cfg.titleSmall && <div className="text-xs text-gray-400 mb-4">{cfg.titleSmall}</div>}
      <div className="bg-white rounded-2xl p-5 mt-2">
        <div className="w-32 mx-auto mb-4">
          <ClickableImage
            src={cfg.babyImage}
            crop={cfg.babyImageCrop}
            fallbackAspect="1/1"
            rounded="rounded-full"
            placeholder={<ImageIcon size={28} className="text-gray-300" strokeWidth={1} />}
          />
        </div>
        {baby.name && (
          <div className="tracking-widest mb-1" style={{ color: accent, fontSize: '1.25rem' }}>{baby.name}</div>
        )}
        {birthDateStr && <div className="text-xs text-gray-500 mb-1">{birthDateStr}</div>}
        {hashtags && <div className="text-xs mb-2" style={{ color: accent }}>{hashtags}</div>}
        {baby.description && <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{baby.description}</div>}
      </div>
    </section>
  )
}

// ── 가로형 프로필 (공통, 1명 이상 좌우 교차) ──────────────────────────────────
function ProfileSection({ accent, content, showEnglish, module }: { accent: string; content: InvitationContent; showEnglish: boolean; module: InvitationModule }) {
  if ((module.config?.subjectMode as string | undefined) === 'baby') {
    return <BabyProfileSection accent={accent} content={content} showEnglish={showEnglish} module={module} />
  }
  const cfg = module.config as Record<string, unknown>
  const persons = readProfilePersons(cfg)
  const koreanTitle = cfg.koreanTitle as string | undefined
  const englishTitle = cfg.englishTitle as string | undefined
  const titleBig = cfg.titleBig as string | undefined
  const titleSmall = cfg.titleSmall as string | undefined
  const introText = cfg.introText as string | undefined
  const labelVisible = cfg.labelVisible !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (cfg.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center'), whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: (cfg.labelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.labelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center'), whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: (cfg.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (cfg.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center'), whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (cfg.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center'), whiteSpace: 'pre-line' }
  return (
    <section className="py-10 mx-4 border-t border-gray-200">
      {cfg.koreanLabelVisible !== false && <p className="text-sm mb-1 text-center" style={{ color: accent, ...koreanLabelStyle }}>{koreanTitle ?? '소개'}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1 text-center" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishTitle ?? 'About'}</p>}
      {cfg.titleBigVisible !== false && titleBig && <div className="text-sm text-gray-800 mb-1 text-center" style={titleBigStyle}>{titleBig}</div>}
      {cfg.titleSmallVisible !== false && titleSmall && <div className="text-xs text-gray-400 mb-4 text-center" style={titleSmallStyle}>{titleSmall}</div>}
      <div className="space-y-3 mb-4">
        {persons.map((person, i) => (
          <ProfileCard
            key={i}
            accent={accent}
            person={person}
            imageSide={i % 2 === 0 ? 'left' : 'right'}
          />
        ))}
      </div>
      {introText && cfg.introTextVisible !== false && <RichText html={introText} className="text-xs text-gray-500 leading-relaxed text-center" />}
    </section>
  )
}

function ProfileCard({ accent, person, imageSide }: { accent: string; person: ProfilePerson; imageSide: 'left' | 'right' }) {
  const hashtags = (person.hashtags ?? []).map(h => `#${h}`).join(' ')
  const descVisible = person.descriptionVisible !== false
  const image = (
    <div className="w-1/2 flex-shrink-0">
      <ClickableImage
        src={person.image}
        crop={person.imageCrop}
        fallbackAspect="1/1"
        rounded="rounded-xl"
        placeholder={<ImageIcon size={22} className="text-gray-300" strokeWidth={1} />}
      />
    </div>
  )
  const body = (
    <div className={`w-1/2 flex flex-col ${imageSide === 'left' ? 'items-start text-left' : 'items-end text-right'} gap-1.5 justify-start`}>
      {person.name && <span className="inline-block rounded-full px-3 py-0.5 text-[11px]" style={{ color: accent, backgroundColor: accent + '1A' }}>{person.name}</span>}
      {person.title && <span className="text-[10px] text-gray-500">{person.title}</span>}
      {hashtags && <span className="text-[10px]" style={{ color: accent }}>{hashtags}</span>}
      {person.description && descVisible && <RichText html={person.description} className="text-xs text-gray-500 leading-relaxed [&_p]:m-0" />}
    </div>
  )
  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3 items-stretch">
      {imageSide === 'left' ? <>{image}{body}</> : <>{body}{image}</>}
    </div>
  )
}

// ── 타임라인 공통 ───────────────────────────────────────────────────────────
type TimelineItemData = { title: string; content?: string; image?: string; crop?: ImageCropData; titleVisible?: boolean; contentVisible?: boolean }

function TimelineHeader({ accent, showEnglish, module, defaultKorean = '타임라인', defaultEnglish = 'Timeline' }: { accent: string; showEnglish: boolean; module: InvitationModule; defaultKorean?: string; defaultEnglish?: string }) {
  const cfg = module.config
  const englishTitle = (cfg?.englishTitle as string | undefined) ?? defaultEnglish
  const labelVisible = (cfg?.labelVisible as boolean) !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (cfg?.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg?.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg?.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: (cfg?.labelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg?.labelItalic as boolean) ? 'italic' : undefined, textAlign: (cfg?.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: (cfg?.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (cfg?.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: (cfg?.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (cfg?.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (cfg?.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: (cfg?.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  return (
    <>
      {(cfg?.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1 text-center" style={{ color: accent, ...koreanLabelStyle }}>{(cfg?.koreanTitle as string | undefined) ?? defaultKorean}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1 text-center" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishTitle}</p>}
      {(cfg?.titleBigVisible as boolean) !== false && (cfg?.titleBig as string | undefined) && <div className="text-sm text-gray-800 mb-1 text-center" style={titleBigStyle}>{cfg?.titleBig as string}</div>}
      {(cfg?.titleSmallVisible as boolean) !== false && (cfg?.titleSmall as string | undefined) && <div className="text-xs text-gray-400 mb-4 text-center" style={titleSmallStyle}>{cfg?.titleSmall as string}</div>}
    </>
  )
}

function TimelineTitleBadge({ html, accent, align = 'left' }: { html: string; accent: string; align?: 'left' | 'center' | 'right' }) {
  const isHtml = html.trimStart().startsWith('<')
  // tiptap HTML 내 text-align 스타일이 있으면 우선, 없으면 prop 사용
  const match = isHtml ? html.match(/text-align:\s*(left|center|right)/) : null
  const resolvedAlign = (match?.[1] as 'left' | 'center' | 'right' | undefined) ?? align
  return (
    <div style={{ textAlign: resolvedAlign }}>
      <span
        className="inline-block rounded-full px-3 py-[3px] text-[11px] font-medium leading-tight [&_p]:inline [&_p]:m-0 [&_p]:p-0"
        style={{ backgroundColor: accent, color: '#fff' }}
      >
        {isHtml ? <span dangerouslySetInnerHTML={{ __html: html }} /> : html}
      </span>
    </div>
  )
}

// ── 타임라인 (좌우 교차) ─────────────────────────────────────────────────────
function TimelineSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const items = (module.config?.items as TimelineItemData[]) ?? []
  return (
    <section className="py-10 mx-4 border-t border-gray-200">
      <TimelineHeader accent={accent} showEnglish={showEnglish} module={module} defaultKorean="타임라인" defaultEnglish="Timeline" />
      {items.length > 0 ? (
        <div className="relative">
          <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2" style={{ backgroundColor: accent + '40' }} />
          <div className="space-y-6">
            {items.map((item, i) => {
              const imageOnLeft = i % 2 === 0
              const imageCell = (
                <div>
                  <ClickableImage
                    src={item.image}
                    crop={item.crop}
                    fallbackAspect="1/1"
                    rounded="rounded-md"
                    placeholder={<ImageIcon size={18} className="text-gray-300" strokeWidth={1} />}
                  />
                </div>
              )
              const railCell = (
                <div className="flex flex-col items-center pt-[9px]">
                  <div className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: accent, backgroundColor: '#fff' }} />
                </div>
              )
              const textCell = (
                <div className={`${imageOnLeft ? 'text-left' : 'text-right'} space-y-1.5`}>
                  {item.titleVisible !== false && <TimelineTitleBadge html={item.title || '제목 자리입니다.'} accent={accent} align={imageOnLeft ? 'left' : 'right'} />}
                  {item.contentVisible !== false && <RichText html={item.content || '내용 자리입니다.'} className="text-xs text-gray-500 leading-relaxed" />}
                </div>
              )
              return (
                <div key={i} className="relative grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
                  {imageOnLeft ? imageCell : textCell}
                  {railCell}
                  {imageOnLeft ? textCell : imageCell}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="w-full h-20 bg-gray-100 rounded-xl" />
      )}
    </section>
  )
}

// ── 폴라로이드 ───────────────────────────────────────────────────────────────
const POLAROID_ROTATIONS = [-3, 2, -2, 3, -1.5, 2.5]

function TimelinePolaroidSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const items = (module.config?.items as TimelineItemData[]) ?? []
  return (
    <section className="py-10 mx-4 border-t border-gray-200">
      <TimelineHeader accent={accent} showEnglish={showEnglish} module={module} defaultKorean="폴라로이드" defaultEnglish="Polaroid" />
      {items.length > 0 ? (
        <div className="space-y-10 px-6">
          {items.map((item, i) => {
            const rot = POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length]
            return (
              <div
                key={i}
                className="relative bg-white rounded-sm p-3 pb-4 shadow-sm"
                style={{ transform: `rotate(${rot}deg)` }}
              >
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-gray-300/40 rounded-sm" />
                <div className="mb-3">
                  <ClickableImage
                    src={item.image}
                    crop={item.crop}
                    fallbackAspect="1/1"
                    rounded="rounded-sm"
                    placeholder={<ImageIcon size={24} className="text-gray-300" strokeWidth={1} />}
                  />
                </div>
                <div className="text-center space-y-1.5">
                  {item.titleVisible !== false && <TimelineTitleBadge html={item.title || '제목 자리입니다.'} accent={accent} align="center" />}
                  {item.contentVisible !== false && <RichText html={item.content || '내용 자리입니다.'} className="text-xs text-gray-500 leading-relaxed" />}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="w-full h-20 bg-gray-100 rounded-xl" />
      )}
    </section>
  )
}

// ── 인터뷰 ───────────────────────────────────────────────────────────────────
function InterviewSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const items = (module.config?.items as Array<{ question: string; answer: string; questionVisible?: boolean; answerVisible?: boolean }>) ?? []
  const englishTitle = (module.config?.englishTitle as string | undefined) ?? 'Interview'
  const labelVisible = (module.config?.labelVisible as boolean) !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (module.config?.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((module.config?.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: (module.config?.labelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.labelItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: (module.config?.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (module.config?.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (module.config?.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  return (
    <section className="py-10 mx-4 border-t border-gray-200">
      {(module.config?.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1 text-center" style={{ color: accent, ...koreanLabelStyle }}>{(module.config?.koreanTitle as string | undefined) ?? '인터뷰'}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1 text-center" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishTitle}</p>}
      {(module.config?.titleBigVisible as boolean) !== false && (module.config?.titleBig as string | undefined) && <div className="text-sm text-gray-800 mb-1 text-center" style={titleBigStyle}>{module.config?.titleBig as string}</div>}
      {(module.config?.titleSmallVisible as boolean) !== false && (module.config?.titleSmall as string | undefined) && <div className="text-xs text-gray-400 mb-4 text-center" style={titleSmallStyle}>{module.config?.titleSmall as string}</div>}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 text-left">
              {item.questionVisible !== false && <div className="text-xs font-medium text-gray-700 mb-1 flex gap-1"><span>Q.</span><RichText html={item.question} /></div>}
              {item.answerVisible !== false && <div className="text-xs text-gray-500 leading-5 flex gap-1"><span>A.</span><RichText html={item.answer} /></div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-20 bg-gray-100 rounded-xl" />
      )}
    </section>
  )
}

// ── 중간 사진 ────────────────────────────────────────────────────────────────
function MidphotoSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as { image?: string; imageCrop?: ImageCropData; caption?: string; noSideMargin?: boolean; koreanTitle?: string; koreanLabelVisible?: boolean; koreanLabelBold?: boolean; koreanLabelItalic?: boolean; koreanLabelAlign?: string; englishTitle?: string; labelVisible?: boolean; labelBold?: boolean; labelItalic?: boolean; labelAlign?: string; titleBig?: string; titleBigVisible?: boolean; titleBigBold?: boolean; titleBigItalic?: boolean; titleBigAlign?: string; titleSmall?: string; titleSmallVisible?: boolean; titleSmallBold?: boolean; titleSmallItalic?: boolean; titleSmallAlign?: string }
  const koreanLabelStyle: React.CSSProperties = { fontWeight: cfg.koreanLabelBold ? 'bold' : undefined, fontStyle: cfg.koreanLabelItalic ? 'italic' : undefined, textAlign: (cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: cfg.labelBold ? 'bold' : undefined, fontStyle: cfg.labelItalic ? 'italic' : undefined, textAlign: (cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: cfg.titleBigBold ? 'bold' : 'medium', fontStyle: cfg.titleBigItalic ? 'italic' : undefined, textAlign: (cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: cfg.titleSmallBold ? 'bold' : undefined, fontStyle: cfg.titleSmallItalic ? 'italic' : undefined, textAlign: (cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const noMargin = cfg.noSideMargin === true
  return (
    <section className={`py-10 border-t border-gray-200 text-center ${noMargin ? '' : 'mx-4'}`}>
      {cfg.koreanLabelVisible !== false && <p className={`text-sm mb-1 ${noMargin ? 'mx-4' : ''}`} style={{ color: accent, ...koreanLabelStyle }}>{cfg.koreanTitle ?? '단독'}</p>}
      {showEnglish && cfg.labelVisible !== false && <p className={`text-xs mb-1 ${noMargin ? 'mx-4' : ''}`} style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{cfg.englishTitle ?? 'Photo'}</p>}
      {cfg.titleBigVisible !== false && cfg.titleBig && (
        <div className={`text-sm text-gray-800 mb-1 ${noMargin ? 'mx-4' : ''}`} style={titleBigStyle}>{cfg.titleBig}</div>
      )}
      {cfg.titleSmallVisible !== false && cfg.titleSmall && (
        <div className={`text-xs text-gray-400 mb-5 ${noMargin ? 'mx-4' : ''}`} style={titleSmallStyle}>{cfg.titleSmall}</div>
      )}
      <ClickableImage
        src={cfg.image}
        crop={cfg.imageCrop}
        fallbackAspect="4/3"
        placeholder={<ImageIcon size={40} className="text-gray-300" strokeWidth={1} />}
      />
      {cfg.caption && <div className={`text-center py-3 text-xs text-gray-500 italic ${noMargin ? 'mx-4' : ''}`}>{cfg.caption}</div>}
    </section>
  )
}

// ── 추가 사진 액자 ───────────────────────────────────────────────────────────
// 메인 화면(main)과 분리된 단일 사진 + 라벨/캡션 모듈. 자체 image/imageCrop을 모듈 config에 보관한다.
function PhotoFrameSection({ accent, fontFamily, showEnglish, module }: { accent: string; fontFamily: string; showEnglish: boolean; module: InvitationModule }) {
  const cfg = (module.config ?? {}) as {
    image?: string; imageCrop?: ImageCropData
    bottomText?: string; subText?: string
    showTitle?: boolean; showSubText?: boolean
    noSideMargin?: boolean
    koreanTitle?: string; koreanLabelVisible?: boolean; koreanLabelBold?: boolean; koreanLabelItalic?: boolean; koreanLabelAlign?: string
    englishTitle?: string; labelVisible?: boolean; labelBold?: boolean; labelItalic?: boolean; labelAlign?: string
    titleBig?: string; titleBigVisible?: boolean; titleBigBold?: boolean; titleBigItalic?: boolean; titleBigAlign?: string
    titleSmall?: string; titleSmallVisible?: boolean; titleSmallBold?: boolean; titleSmallItalic?: boolean; titleSmallAlign?: string
  }
  const koreanLabelStyle: React.CSSProperties = { fontWeight: cfg.koreanLabelBold ? 'bold' : undefined, fontStyle: cfg.koreanLabelItalic ? 'italic' : undefined, textAlign: (cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: cfg.labelBold ? 'bold' : undefined, fontStyle: cfg.labelItalic ? 'italic' : undefined, textAlign: (cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: cfg.titleBigBold ? 'bold' : 'medium', fontStyle: cfg.titleBigItalic ? 'italic' : undefined, textAlign: (cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: cfg.titleSmallBold ? 'bold' : undefined, fontStyle: cfg.titleSmallItalic ? 'italic' : undefined, textAlign: (cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const noMargin = cfg.noSideMargin === true
  return (
    <section className={`py-10 border-t border-gray-200 text-center ${noMargin ? '' : 'mx-4'}`}>
      {cfg.koreanLabelVisible !== false && cfg.koreanTitle && (
        <p className={`text-sm mb-1 ${noMargin ? 'mx-4' : ''}`} style={{ color: accent, ...koreanLabelStyle }}>{cfg.koreanTitle}</p>
      )}
      {showEnglish && cfg.labelVisible !== false && cfg.englishTitle && (
        <p className={`text-xs mb-1 ${noMargin ? 'mx-4' : ''}`} style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{cfg.englishTitle}</p>
      )}
      {cfg.titleBigVisible !== false && cfg.titleBig && (
        <div className={`text-sm text-gray-800 mb-1 ${noMargin ? 'mx-4' : ''}`} style={titleBigStyle}>{cfg.titleBig}</div>
      )}
      {cfg.titleSmallVisible !== false && cfg.titleSmall && (
        <div className={`text-xs text-gray-400 mb-5 ${noMargin ? 'mx-4' : ''}`} style={titleSmallStyle}>{cfg.titleSmall}</div>
      )}
      <div className={`${noMargin ? '' : 'border-8 border-white'}`}>
        <ClickableImage
          src={cfg.image}
          crop={cfg.imageCrop}
          fallbackAspect="4/5"
          alt="액자"
          placeholder={<ImageIcon size={40} className="text-gray-300" strokeWidth={1} />}
        />
      </div>
      {(cfg.showTitle !== false && cfg.bottomText) && (
        <div className={`mt-4 ${noMargin ? 'mx-4' : ''}`} style={{ fontFamily }}>
          <RichText html={cfg.bottomText} className="text-sm text-gray-700" />
        </div>
      )}
      {(cfg.showSubText !== false && cfg.subText) && (
        <div className={`mt-1 ${noMargin ? 'mx-4' : ''}`} style={{ fontFamily }}>
          <RichText html={cfg.subText} className="text-xs text-gray-400" />
        </div>
      )}
    </section>
  )
}

// ── 교통 수단 ────────────────────────────────────────────────────────────────
function TabSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as TabModuleConfig
  const tabs = cfg.tabs ?? []
  const [activeIdx, setActiveIdx] = useState(0)
  useEffect(() => {
    if (activeIdx >= tabs.length) setActiveIdx(0)
  }, [tabs.length, activeIdx])
  const active = tabs[activeIdx] ?? tabs[0]

  const koreanLabel = cfg.koreanTitle ?? '탭'
  const koreanLabelVisible = cfg.koreanLabelVisible !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: cfg.koreanLabelBold ? 'bold' : undefined, fontStyle: cfg.koreanLabelItalic ? 'italic' : undefined, textAlign: (cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const englishTitle = cfg.englishTitle ?? 'Tabs'
  const labelVisible = cfg.labelVisible !== false
  const labelStyle: React.CSSProperties = { fontWeight: cfg.labelBold ? 'bold' : undefined, fontStyle: cfg.labelItalic ? 'italic' : undefined, textAlign: (cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: cfg.titleBigBold ? 'bold' : 'medium', fontStyle: cfg.titleBigItalic ? 'italic' : undefined, textAlign: (cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: cfg.titleSmallBold ? 'bold' : undefined, fontStyle: cfg.titleSmallItalic ? 'italic' : undefined, textAlign: (cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }

  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {koreanLabelVisible && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{koreanLabel}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishTitle}</p>}
      {cfg.titleBigVisible !== false && cfg.titleBig && <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{cfg.titleBig}</div>}
      {cfg.titleSmallVisible !== false && cfg.titleSmall && <div className="text-xs text-gray-400 mb-4" style={titleSmallStyle}>{cfg.titleSmall}</div>}

      {tabs.length === 0 ? (
        <div className="w-full h-16 bg-gray-100 rounded-xl" />
      ) : (
        <>
          <div className="flex gap-1 mb-4">
            {tabs.map((t, i) => (
              <button key={i} onClick={() => setActiveIdx(i)}
                className={`flex-1 py-1.5 rounded-xl text-xs transition-colors ${activeIdx === i ? 'text-white' : 'border border-gray-200 text-gray-500'}`}
                style={activeIdx === i ? { backgroundColor: accent } : {}}
              >{t.label || `탭 ${i + 1}`}</button>
            ))}
          </div>
          {active && (
            <div className="space-y-3">
              {active.image && active.imageVisible !== false && (
                <ClickableImage src={active.image} crop={active.imageCrop} fallbackAspect="4/3" />
              )}
              {active.contentVisible !== false && active.content && (
                <RichText html={active.content} className="text-xs text-gray-500 text-center leading-6" />
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── 갤러리 ───────────────────────────────────────────────────────────────────
function GallerySection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const images = (module.config?.images as string[]) ?? []
  const imageCrops = (module.config?.imageCrops as Array<ImageCropData | undefined>) ?? []
  const englishTitle = (module.config?.englishTitle as string | undefined) ?? 'Gallery'
  const labelVisible = (module.config?.labelVisible as boolean) !== false
  const labelStyle: React.CSSProperties = { fontWeight: (module.config?.labelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.labelItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (module.config?.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((module.config?.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: (module.config?.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (module.config?.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (module.config?.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  return (
    <section className="py-10 border-t border-gray-200 text-center">
      {(module.config?.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1 mx-4" style={{ color: accent, ...koreanLabelStyle }}>{(module.config?.koreanTitle as string | undefined) ?? '갤러리'}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1 mx-4" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishTitle}</p>}
      {(module.config?.titleBigVisible as boolean) !== false && (module.config?.titleBig as string | undefined) && <div className="text-sm text-gray-800 mb-1 mx-4" style={titleBigStyle}>{module.config?.titleBig as string}</div>}
      {(module.config?.titleSmallVisible as boolean) !== false && (module.config?.titleSmall as string | undefined) && <div className="text-xs text-gray-400 mb-4 mx-4" style={titleSmallStyle}>{module.config?.titleSmall as string}</div>}
      <div className="grid grid-cols-3 gap-0.5 mx-4">
        {images.length > 0
          ? images.slice(0, 9).map((src, i) => (
            <ClickableImage
              key={i}
              src={src}
              crop={imageCrops[i]}
              fallbackAspect="1/1"
            />
          ))
          : Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 flex items-center justify-center">
              <ImageIcon size={20} className="text-gray-300" strokeWidth={1} />
            </div>
          ))
        }
      </div>
    </section>
  )
}

// ── 슬라이드 ─────────────────────────────────────────────────────────────────
function SlideSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as SlideModuleConfig
  const slides = cfg.slides ?? []
  const [activeIdx, setActiveIdx] = useState(0)
  const startX = useRef<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const SWIPE_THRESHOLD = 60
  useEffect(() => {
    if (activeIdx >= slides.length) setActiveIdx(0)
  }, [slides.length, activeIdx])

  const koreanLabel = cfg.koreanTitle ?? '안내사항'
  const koreanLabelVisible = cfg.koreanLabelVisible !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: cfg.koreanLabelBold ? 'bold' : undefined, fontStyle: cfg.koreanLabelItalic ? 'italic' : undefined, textAlign: (cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const englishTitle = cfg.englishTitle ?? 'Information'
  const labelVisible = cfg.labelVisible !== false
  const labelStyle: React.CSSProperties = { fontWeight: cfg.labelBold ? 'bold' : undefined, fontStyle: cfg.labelItalic ? 'italic' : undefined, textAlign: (cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: cfg.titleBigBold ? 'bold' : 'medium', fontStyle: cfg.titleBigItalic ? 'italic' : undefined, textAlign: (cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: cfg.titleSmallBold ? 'bold' : undefined, fontStyle: cfg.titleSmallItalic ? 'italic' : undefined, textAlign: (cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }

  function go(delta: number) {
    if (slides.length === 0) return
    setActiveIdx((prev) => Math.max(0, Math.min(slides.length - 1, prev + delta)))
  }

  function beginDrag(x: number) {
    startX.current = x
    setIsDragging(true)
    setDragOffset(0)
  }
  function moveDrag(x: number) {
    if (startX.current == null) return
    let offset = x - startX.current
    // 양 끝에서 러버밴드(저항) 효과
    if (activeIdx === 0 && offset > 0) offset = offset * 0.3
    if (activeIdx === slides.length - 1 && offset < 0) offset = offset * 0.3
    setDragOffset(offset)
  }
  function endDrag(x: number) {
    if (startX.current == null) return
    const diff = x - startX.current
    startX.current = null
    setIsDragging(false)
    setDragOffset(0)
    if (Math.abs(diff) < SWIPE_THRESHOLD) return
    if (diff < 0 && activeIdx < slides.length - 1) setActiveIdx(activeIdx + 1)
    if (diff > 0 && activeIdx > 0) setActiveIdx(activeIdx - 1)
  }
  function cancelDrag() {
    startX.current = null
    setIsDragging(false)
    setDragOffset(0)
  }

  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {koreanLabelVisible && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{koreanLabel}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishTitle}</p>}
      {cfg.titleBigVisible !== false && cfg.titleBig && <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{cfg.titleBig}</div>}
      {cfg.titleSmallVisible !== false && cfg.titleSmall && <div className="text-xs text-gray-400 mb-4" style={titleSmallStyle}>{cfg.titleSmall}</div>}

      {slides.length === 0 ? (
        <div className="w-full h-32 bg-gray-100 rounded-xl" />
      ) : (
        <>
          <div className="relative">
            <div
              className="overflow-hidden select-none cursor-grab active:cursor-grabbing"
              onTouchStart={(e) => beginDrag(e.touches[0]?.clientX ?? 0)}
              onTouchMove={(e) => moveDrag(e.touches[0]?.clientX ?? 0)}
              onTouchEnd={(e) => endDrag(e.changedTouches[0]?.clientX ?? startX.current ?? 0)}
              onMouseDown={(e) => beginDrag(e.clientX)}
              onMouseMove={(e) => { if (isDragging) moveDrag(e.clientX) }}
              onMouseUp={(e) => endDrag(e.clientX)}
              onMouseLeave={() => { if (isDragging) cancelDrag() }}
              onDragStart={(e) => e.preventDefault()}
            >
              <div
                className="flex items-start"
                style={{
                  transform: `translate3d(calc(${-activeIdx * 100}% + ${dragOffset}px), 0, 0)`,
                  transition: isDragging ? 'none' : 'transform 350ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                }}
              >
                {slides.map((slide, idx) => (
                  <div key={idx} className="flex-shrink-0 w-full space-y-4 px-1">
                    {slide.image && slide.imageVisible !== false && (
                      <div draggable={false}>
                        <ClickableImage src={slide.image} crop={slide.imageCrop} fallbackAspect="16/9" />
                      </div>
                    )}
                    {slide.titleVisible !== false && slide.title && (
                      <RichText html={slide.title} className="text-base text-gray-800 text-center" />
                    )}
                    {slide.contentVisible !== false && slide.content && (
                      <RichText html={slide.content} className="text-xs text-gray-500 text-center leading-relaxed" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={activeIdx === 0}
                  aria-label="이전 슬라이드"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 p-1 text-gray-400 hover:text-gray-700 transition-colors z-10 disabled:opacity-30 disabled:hover:text-gray-400"
                >
                  <ChevronLeft size={22} strokeWidth={1.25} />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={activeIdx === slides.length - 1}
                  aria-label="다음 슬라이드"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 p-1 text-gray-400 hover:text-gray-700 transition-colors z-10 disabled:opacity-30 disabled:hover:text-gray-400"
                >
                  <ChevronRight size={22} strokeWidth={1.25} />
                </button>
              </>
            )}
          </div>
          {slides.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  aria-label={`슬라이드 ${i + 1}`}
                  className="block w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: i === activeIdx ? accent : '#d1d5db' }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── 방명록 ───────────────────────────────────────────────────────────────────
type GuestbookSectionConfig = GuestbookModuleConfig & {
  koreanTitle?: string; koreanLabelVisible?: boolean; koreanLabelBold?: boolean; koreanLabelItalic?: boolean; koreanLabelAlign?: string
  englishTitle?: string; labelVisible?: boolean; labelBold?: boolean; labelItalic?: boolean; labelAlign?: string
  titleBig?: string; titleBigVisible?: boolean; titleBigBold?: boolean; titleBigItalic?: boolean; titleBigAlign?: string
  titleSmall?: string; titleSmallVisible?: boolean; titleSmallBold?: boolean; titleSmallItalic?: boolean; titleSmallAlign?: string
}

// 에디터 프리뷰에서만 보이는 샘플 데이터. 실제 초대장 뷰에서는 DB 데이터로 교체됨.
const GUESTBOOK_SAMPLE_ENTRIES: GuestbookEntry[] = [
  {
    id: 'sample-1',
    name: '샘플 방명록',
    message: '이 방명록은 미리보기용 예시입니다.\n에디터에서는 실제 데이터 대신 이렇게 샘플로 표시됩니다.',
    password: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]

function formatGuestbookDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function GuestbookSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as GuestbookSectionConfig
  const [entries, setEntries] = useState<GuestbookEntry[]>(GUESTBOOK_SAMPLE_ENTRIES)
  const [open, setOpen] = useState(false)
  const pageSize = cfg.pageSize ?? 3
  const [visibleCount, setVisibleCount] = useState(pageSize)

  const koreanLabelStyle: React.CSSProperties = { fontWeight: cfg.koreanLabelBold ? 'bold' : undefined, fontStyle: cfg.koreanLabelItalic ? 'italic' : undefined, textAlign: (cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: cfg.labelBold ? 'bold' : undefined, fontStyle: cfg.labelItalic ? 'italic' : undefined, textAlign: (cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: cfg.titleBigBold ? 'bold' : 'medium', fontStyle: cfg.titleBigItalic ? 'italic' : undefined, textAlign: (cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: cfg.titleSmallBold ? 'bold' : undefined, fontStyle: cfg.titleSmallItalic ? 'italic' : undefined, textAlign: (cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }

  const buttonLabel = cfg.buttonLabel ?? '작성하기'
  const visibleEntries = entries.slice(0, visibleCount)
  const hasMore = entries.length > visibleCount

  const addEntry = (entry: GuestbookEntry) => {
    setEntries(prev => [entry, ...prev])
    setVisibleCount(v => v + 1)
  }

  // 에디터 프리뷰에서는 초대장 소유자로 간주하여 확인 없이 로컬 삭제
  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <>
      <section className="py-10 mx-4 border-t border-gray-200 text-center">
        {cfg.koreanLabelVisible !== false && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{cfg.koreanTitle ?? '방명록'}</p>}
        {showEnglish && cfg.labelVisible !== false && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{cfg.englishTitle ?? 'Guestbook'}</p>}
        {cfg.titleBigVisible !== false && cfg.titleBig && (
          <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{cfg.titleBig}</div>
        )}
        {cfg.titleSmallVisible !== false && cfg.titleSmall && (
          <div className="text-xs text-gray-400 mb-4" style={titleSmallStyle}>{cfg.titleSmall}</div>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-3 rounded-xl text-xs border mb-4"
          style={{ borderColor: accent, color: accent }}
        >
          {buttonLabel}
        </button>

        {visibleEntries.length > 0 && (
          <div className="space-y-3 text-left">
            {visibleEntries.map(entry => (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 px-4 pt-3.5 pb-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm text-gray-800">
                    <span className="text-gray-400">from.</span> {entry.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                    aria-label="방명록 삭제"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-800 whitespace-pre-line leading-6">{entry.message}</p>
                  <p className="text-xs text-gray-400 text-right mt-3">{formatGuestbookDate(entry.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount(v => v + pageSize)}
            className="mt-5 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            더보기 <ChevronDown size={14} />
          </button>
        )}
      </section>
      <GuestbookModal open={open} onClose={() => setOpen(false)} config={cfg} accent={accent} onSubmit={addEntry} />
    </>
  )
}

// ── 하객 앨범 ─────────────────────────────────────────────────────────────────
function GuestAlbumSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as { koreanTitle?: string; koreanLabelVisible?: boolean; koreanLabelBold?: boolean; koreanLabelItalic?: boolean; koreanLabelAlign?: string; englishTitle?: string; labelVisible?: boolean; labelBold?: boolean; labelItalic?: boolean; labelAlign?: string; titleBig?: string; titleBigVisible?: boolean; titleBigBold?: boolean; titleBigItalic?: boolean; titleBigAlign?: string; titleSmall?: string; titleSmallVisible?: boolean; titleSmallBold?: boolean; titleSmallItalic?: boolean; titleSmallAlign?: string }
  const koreanLabelStyle: React.CSSProperties = { fontWeight: cfg.koreanLabelBold ? 'bold' : undefined, fontStyle: cfg.koreanLabelItalic ? 'italic' : undefined, textAlign: (cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: cfg.labelBold ? 'bold' : undefined, fontStyle: cfg.labelItalic ? 'italic' : undefined, textAlign: (cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: cfg.titleBigBold ? 'bold' : 'medium', fontStyle: cfg.titleBigItalic ? 'italic' : undefined, textAlign: (cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: cfg.titleSmallBold ? 'bold' : undefined, fontStyle: cfg.titleSmallItalic ? 'italic' : undefined, textAlign: (cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {cfg.koreanLabelVisible !== false && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{cfg.koreanTitle ?? '하객 앨범'}</p>}
      {showEnglish && cfg.labelVisible !== false && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{cfg.englishTitle ?? 'Guest Album'}</p>}
      {cfg.titleBigVisible !== false && cfg.titleBig && (
        <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{cfg.titleBig}</div>
      )}
      {cfg.titleSmallVisible !== false && cfg.titleSmall && (
        <div className="text-xs text-gray-400 mb-5" style={titleSmallStyle}>{cfg.titleSmall}</div>
      )}
      <div className="w-full h-20 bg-gray-100 rounded-lg border border-gray-100 flex items-center justify-center text-xs text-gray-400">
        <Camera size={20} className="mr-2 text-gray-300" strokeWidth={1} />
        하객 사진
      </div>
    </section>
  )
}

// ── 계좌 정보 ────────────────────────────────────────────────────────────────
interface AccountItem { bank: string; number: string; name: string }
interface AccountGroup { label: string; accounts: AccountItem[] }

function AccountSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const cfg = module.config as Record<string, unknown>
  const groups = (cfg.groups ?? []) as AccountGroup[]

  const koreanLabelVisible = (cfg.koreanLabelVisible as boolean) !== false
  const koreanLabel = (cfg.koreanTitle as string | undefined) ?? '계좌 정보'
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (cfg.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const labelVisible = (cfg.labelVisible as boolean) !== false
  const englishLabel = (cfg.englishTitle as string | undefined) ?? 'Account'
  const labelStyle: React.CSSProperties = { fontWeight: (cfg.labelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.labelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.labelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const titleBig = (cfg.titleBig as string | undefined) ?? '마음 전하실 곳'
  const titleBigStyle: React.CSSProperties = { fontWeight: (cfg.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (cfg.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleBigAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (cfg.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleSmallAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }

  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {koreanLabelVisible && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{koreanLabel}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishLabel}</p>}
      {(cfg.titleBigVisible as boolean) !== false && titleBig && <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{titleBig}</div>}
      {(cfg.titleSmallVisible as boolean) !== false && (cfg.titleSmall as string | undefined) && <div className="text-xs text-gray-400 mb-2" style={titleSmallStyle}>{cfg.titleSmall as string}</div>}
      <div className="mt-4" />
      {groups.map((group, gi) => {
        const isOpen = !!openMap[gi]
        return (
          <div key={gi} className="mb-3">
            <button
              className={`w-full flex items-center justify-between px-4 py-3 bg-white text-xs text-gray-700 border border-gray-100 transition-[border-radius] ${isOpen ? 'rounded-t-xl border-b-0' : 'rounded-xl'}`}
              onClick={() => setOpenMap(m => ({ ...m, [gi]: !m[gi] }))}
            >
              <span>{group.label}</span>
              <motion.span
                className="text-gray-400"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >▼</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-b-xl border-x border-b border-gray-100 divide-y divide-gray-100">
                    {group.accounts.map((acc, ai) => {
                      const digits = acc.number.replace(/\D/g, '')
                      const isCopied = copied === `${gi}-${ai}`
                      return (
                        <div key={ai} className="flex items-center justify-between px-4 py-3">
                          <div className="text-left">
                            <p className="text-xs text-gray-500">{acc.bank}</p>
                            <p className="text-sm font-medium text-gray-800">{acc.number}</p>
                            <p className="text-xs text-gray-400">{acc.name}</p>
                          </div>
                          <button
                            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                            style={{ borderColor: accent, color: isCopied ? '#fff' : accent, backgroundColor: isCopied ? accent : 'transparent' }}
                            onClick={() => {
                              navigator.clipboard.writeText(digits)
                              setCopied(`${gi}-${ai}`)
                              setTimeout(() => setCopied(null), 2000)
                            }}
                          >
                            {isCopied ? '복사됨' : '복사하기'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </section>
  )
}

// ── 연락처 ───────────────────────────────────────────────────────────────────
function ContactSection({ accent, content, showEnglish, module }: { accent: string; content: InvitationContent; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as Record<string, unknown>
  const groups = (cfg.groups ?? []) as ContactGroup[]

  const koreanLabelVisible = (cfg.koreanLabelVisible as boolean) !== false
  const koreanLabel = (cfg.koreanTitle as string | undefined) ?? '연락하기'
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (cfg.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const labelVisible = (cfg.labelVisible as boolean) !== false
  const englishLabel = (cfg.englishTitle as string | undefined) ?? 'Contact'
  const labelStyle: React.CSSProperties = { fontWeight: (cfg.labelBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.labelItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.labelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const titleBig = (cfg.titleBig as string | undefined) ?? ''
  const titleBigVisible = (cfg.titleBigVisible as boolean) !== false
  const titleBigStyle: React.CSSProperties = { fontWeight: (cfg.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (cfg.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleBigAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (cfg.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (cfg.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: ((cfg.titleSmallAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }

  const resolvePhone = (c: ContactGroup['contacts'][number]): string => {
    if (c.bindTo === 'groomPhone') return content.groomPhone ?? ''
    if (c.bindTo === 'bridePhone') return content.bridePhone ?? ''
    return c.phone ?? ''
  }

  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {koreanLabelVisible && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{koreanLabel}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishLabel}</p>}
      {titleBigVisible && titleBig && <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{titleBig}</div>}
      {(cfg.titleSmallVisible as boolean) !== false && (cfg.titleSmall as string | undefined) && <div className="text-xs text-gray-400 mb-2" style={titleSmallStyle}>{cfg.titleSmall as string}</div>}
      <div className="mt-6 space-y-6">
        {groups.map((group, gi) => (
          <div key={gi}>
            <div className="flex items-baseline justify-center gap-2 border-b border-gray-200 pb-2 mb-3">
              <span className="text-sm font-medium text-gray-800">{group.label}</span>
              {group.englishLabel && (
                <span className="text-[11px] text-gray-400 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>{group.englishLabel}</span>
              )}
            </div>
            <div className="space-y-2">
              {group.contacts.map((c, ci) => {
                const phone = resolvePhone(c)
                const digits = phone.replace(/[^0-9+]/g, '')
                const disabled = digits.length === 0
                return (
                  <div key={ci} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-700 text-left">{c.name || '\u00A0'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => { if (!disabled) window.location.href = `tel:${digits}` }}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: accent, color: '#fff' }}
                        aria-label="전화"
                      >
                        <Phone size={15} strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => { if (!disabled) window.location.href = `sms:${digits}` }}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: accent, color: '#fff' }}
                        aria-label="문자"
                      >
                        <MessageCircle size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── RSVP ─────────────────────────────────────────────────────────────────────
type RsvpSectionConfig = RsvpModuleConfig & {
  koreanTitle?: string; koreanLabelVisible?: boolean; koreanLabelBold?: boolean; koreanLabelItalic?: boolean; koreanLabelAlign?: string
  englishTitle?: string; labelVisible?: boolean; labelBold?: boolean; labelItalic?: boolean; labelAlign?: string
  titleBig?: string; titleBigVisible?: boolean; titleBigBold?: boolean; titleBigItalic?: boolean; titleBigAlign?: string
  titleSmall?: string; titleSmallVisible?: boolean; titleSmallBold?: boolean; titleSmallItalic?: boolean; titleSmallAlign?: string
}

function RsvpSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const cfg = module.config as RsvpSectionConfig
  const [open, setOpen] = useState(false)
  const labelVisible = cfg.labelVisible !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: cfg.koreanLabelBold ? 'bold' : undefined, fontStyle: cfg.koreanLabelItalic ? 'italic' : undefined, textAlign: (cfg.koreanLabelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: cfg.labelBold ? 'bold' : undefined, fontStyle: cfg.labelItalic ? 'italic' : undefined, textAlign: (cfg.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: cfg.titleBigBold ? 'bold' : 'medium', fontStyle: cfg.titleBigItalic ? 'italic' : undefined, textAlign: (cfg.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: cfg.titleSmallBold ? 'bold' : undefined, fontStyle: cfg.titleSmallItalic ? 'italic' : undefined, textAlign: (cfg.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const buttonLabel = cfg.buttonLabel ?? '참석 여부 알리기'
  return (
    <>
      <section className="py-10 mx-4 border-t border-gray-200 text-center">
        {(cfg.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{cfg.koreanTitle ?? '참석 의사'}</p>}
        {showEnglish && labelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{cfg.englishTitle ?? 'RSVP'}</p>}
        {cfg.titleBigVisible !== false && cfg.titleBig && <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{cfg.titleBig}</div>}
        {cfg.titleSmallVisible !== false && cfg.titleSmall && <div className="text-xs text-gray-400 mb-4" style={titleSmallStyle}>{cfg.titleSmall}</div>}
        {cfg.deadline && <div className="text-xs text-gray-400 mb-4">{cfg.deadline}까지</div>}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-3 rounded-xl text-xs border"
          style={{ borderColor: accent, color: accent }}
        >
          {buttonLabel}
        </button>
      </section>
      <RsvpModal open={open} onClose={() => setOpen(false)} config={cfg} accent={accent} />
    </>
  )
}

// ── D+Day ────────────────────────────────────────────────────────────────────
function DdaySection({ accent, content, showEnglish, module }: { accent: string; content: InvitationContent; showEnglish: boolean; module: InvitationModule }) {
  const target = content.eventDate ? new Date(content.eventDate) : new Date('2026-10-18')
  const today = new Date()
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const label = diff > 0 ? `D-${diff}` : diff === 0 ? 'D-Day' : `D+${Math.abs(diff)}`
  const englishTitle = (module.config?.englishTitle as string | undefined) ?? 'D+Day'
  const ddayLabelVisible = (module.config?.labelVisible as boolean) !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (module.config?.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((module.config?.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const ddayLabelStyle: React.CSSProperties = { fontWeight: (module.config?.labelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.labelItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: (module.config?.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (module.config?.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (module.config?.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const captionVisible = (module.config?.captionVisible as boolean) !== false
  const captionText = (module.config?.caption as string | undefined) ?? '결혼식까지'
  const captionStyle: React.CSSProperties = { fontWeight: (module.config?.captionBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.captionItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.captionAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {(module.config?.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{(module.config?.koreanTitle as string | undefined) ?? 'D+Day'}</p>}
      {showEnglish && ddayLabelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...ddayLabelStyle }}>{englishTitle}</p>}
      {(module.config?.titleBigVisible as boolean) !== false && (module.config?.titleBig as string | undefined) && <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{module.config?.titleBig as string}</div>}
      {(module.config?.titleSmallVisible as boolean) !== false && (module.config?.titleSmall as string | undefined) && <div className="text-xs text-gray-400 mb-3" style={titleSmallStyle}>{module.config?.titleSmall as string}</div>}
      {captionVisible && captionText && <div className="text-xs text-gray-400 mb-3" style={captionStyle}>{captionText}</div>}
      <div className="text-4xl font-light tracking-wider" style={{ color: accent }}>{label}</div>
    </section>
  )
}

// ── 동영상 ───────────────────────────────────────────────────────────────────
function VideoSection({ accent, showEnglish, module }: { accent: string; showEnglish: boolean; module: InvitationModule }) {
  const englishTitle = (module.config?.englishTitle as string | undefined) ?? 'Video'
  const labelVisible = (module.config?.labelVisible as boolean) !== false
  const koreanLabelStyle: React.CSSProperties = { fontWeight: (module.config?.koreanLabelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.koreanLabelItalic as boolean) ? 'italic' : undefined, textAlign: ((module.config?.koreanLabelAlign as string | undefined) ?? 'center') as React.CSSProperties['textAlign'], whiteSpace: 'pre-line' }
  const labelStyle: React.CSSProperties = { fontWeight: (module.config?.labelBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.labelItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.labelAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleBigStyle: React.CSSProperties = { fontWeight: (module.config?.titleBigBold as boolean) ? 'bold' : 'medium', fontStyle: (module.config?.titleBigItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleBigAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  const titleSmallStyle: React.CSSProperties = { fontWeight: (module.config?.titleSmallBold as boolean) ? 'bold' : undefined, fontStyle: (module.config?.titleSmallItalic as boolean) ? 'italic' : undefined, textAlign: (module.config?.titleSmallAlign as React.CSSProperties['textAlign']) ?? 'center', whiteSpace: 'pre-line' }
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {(module.config?.koreanLabelVisible as boolean) !== false && <p className="text-sm mb-1" style={{ color: accent, ...koreanLabelStyle }}>{(module.config?.koreanTitle as string | undefined) ?? '동영상'}</p>}
      {showEnglish && labelVisible && <p className="text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif', ...labelStyle }}>{englishTitle}</p>}
      {(module.config?.titleBigVisible as boolean) !== false && (module.config?.titleBig as string | undefined) && <div className="text-sm text-gray-800 mb-1" style={titleBigStyle}>{module.config?.titleBig as string}</div>}
      {(module.config?.titleSmallVisible as boolean) !== false && (module.config?.titleSmall as string | undefined) && <div className="text-xs text-gray-400 mb-4" style={titleSmallStyle}>{module.config?.titleSmall as string}</div>}
      <div className="w-full aspect-video bg-gray-200 rounded-xl flex items-center justify-center">
        <Film size={32} className="text-gray-300" strokeWidth={1} />
      </div>
    </section>
  )
}

// ── 배경음악 ─────────────────────────────────────────────────────────────────
// 단순 EQ 아이콘 — 재생 중일 때만 CSS 키프레임 애니메이션. 실제 음원과 무관한 시각적 표시.
function BgmEqIcon({ playing }: { playing: boolean }) {
  return (
    <span className="flex items-end gap-[2px] h-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={
            playing
              ? 'bgm-eq-bar block w-[2px] h-full bg-white rounded-sm'
              : 'block w-[2px] h-1 bg-white rounded-sm'
          }
        />
      ))}
    </span>
  )
}

function BgmFloatingPlayer({ cfg }: { cfg: BgmConfig }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  // 자동 재생 시도. 브라우저 정책상 실패하면 사용자 인터랙션마다 재시도 (성공할 때까지).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !cfg.url) return

    let attached = false
    const detach = () => {
      if (!attached) return
      window.removeEventListener('pointerdown', tryPlay)
      window.removeEventListener('click', tryPlay)
      window.removeEventListener('touchend', tryPlay)
      window.removeEventListener('keydown', tryPlay)
      attached = false
    }
    const attach = () => {
      if (attached) return
      attached = true
      window.addEventListener('pointerdown', tryPlay)
      window.addEventListener('click', tryPlay)
      window.addEventListener('touchend', tryPlay)
      window.addEventListener('keydown', tryPlay)
    }
    const tryPlay = () => {
      audio.play().then(() => {
        setPlaying(true)
        detach()
      }).catch(() => {
        // 아직도 실패 — 리스너를 유지해서 다음 인터랙션에서 재시도
      })
    }

    // 즉시 시도. 실패하면 모든 인터랙션에 리스너 부착.
    audio.play().then(() => setPlaying(true)).catch(() => attach())

    // 데이터가 준비되면 다시 시도 (preload 타이밍에 따라 첫 시도가 너무 일렀을 수 있음)
    const onCanPlay = () => {
      if (audio.paused) {
        audio.play().then(() => {
          setPlaying(true)
          detach()
        }).catch(() => attach())
      }
    }
    audio.addEventListener('canplay', onCanPlay)

    return () => {
      detach()
      audio.removeEventListener('canplay', onCanPlay)
      // 페이지 전환/cfg.url 변경 시 이전 audio 정지(GC 전 재생이 잠깐 살아있는 케이스 방지).
      // src 까지 비우면 같은 페이지 내 effect 재실행 시 재생이 안 되므로 pause 만.
      try { audio.pause() } catch { /* noop */ }
    }
  }, [cfg.url])

  // 반복 구간 처리 (업로드 음원에서 loopEnabled일 때만 의미)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      if (cfg.loopEnabled && cfg.loopEnd != null && cfg.loopEnd > (cfg.loopStart ?? 0) && audio.currentTime >= cfg.loopEnd) {
        audio.currentTime = cfg.loopStart ?? 0
      }
    }
    const onLoadedMetadata = () => {
      if (cfg.loopEnabled && cfg.loopStart != null && cfg.loopStart > 0) {
        audio.currentTime = cfg.loopStart
      }
    }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [cfg.loopEnabled, cfg.loopStart, cfg.loopEnd])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  if (!cfg.url) return null

  return (
    <>
      <audio
        ref={audioRef}
        src={cfg.url}
        loop={!cfg.loopEnabled}
        preload="auto"
        autoPlay
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {/* 카드(375px) 우측 상단 — PreviewPane 의 outer wrapper(relative) 기준 절대 위치. */}
      <button
        type="button"
        onClick={toggle}
        className="absolute top-2 right-2 z-40 w-7 h-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors"
        aria-label={playing ? '배경음악 정지' : '배경음악 재생'}
      >
        {playing ? <BgmEqIcon playing /> : <Play size={12} className="ml-0.5 fill-white" />}
      </button>
    </>
  )
}

// ── 엔딩 사진 ────────────────────────────────────────────────────────────────
function EndingSection({ module }: { module: InvitationModule }) {
  const cfg = module.config as { image?: string; imageCrop?: ImageCropData; message?: string }
  return (
    <section className="border-t border-gray-200">
      <ClickableImage
        src={cfg.image}
        crop={cfg.imageCrop}
        fallbackAspect="4/3"
        placeholder={<ImageIcon size={40} className="text-gray-300" strokeWidth={1} />}
      />
      {cfg.message && (cfg as Record<string, unknown>).messageVisible !== false && (
        <div className="py-8 text-center mx-4">
          <RichText html={cfg.message} className="text-xs text-gray-500 leading-6" />
        </div>
      )}
    </section>
  )
}

// ── SimpleSection fallback ────────────────────────────────────────────────────
function SimpleSection({ label, accent, showEnglish, englishLabel }: {
  label: string; accent: string; showEnglish: boolean; englishLabel?: string
}) {
  return (
    <section className="py-10 mx-4 border-t border-gray-200 text-center">
      {showEnglish && englishLabel && (
        <p className="italic text-xs mb-1" style={{ color: accent, fontFamily: 'Georgia, serif' }}>{englishLabel}</p>
      )}
      <div className="text-sm mb-4" style={{ color: accent }}>{label}</div>
      <div className="w-full h-20 bg-gray-100 rounded-lg border border-gray-100" />
    </section>
  )
}

// ── 모듈 렌더 ────────────────────────────────────────────────────────────────
function renderModule(
  module: InvitationModule,
  accent: string,
  content: InvitationContent,
  showEnglish: boolean,
  fontFamily: string,
  hasCoupleNames: boolean,
) {
  switch (module.type) {
    case 'couple_names': return <CoupleNamesSection accent={accent} content={content} fontFamily={fontFamily} module={module} showEnglish={showEnglish} />
    case 'main': return <MainSection content={content} accent={accent} fontFamily={fontFamily} showNames={!hasCoupleNames} showEnglish={showEnglish} module={module} />
    case 'photo_frame': return <PhotoFrameSection accent={accent} fontFamily={fontFamily} showEnglish={showEnglish} module={module} />
    case 'greeting': return <GreetingSection accent={accent} content={content} showEnglish={showEnglish} />
    case 'datetime': return <DatetimeSection accent={accent} content={content} showEnglish={showEnglish} />
    case 'venue': return <VenueSection accent={accent} content={content} showEnglish={showEnglish} module={module} />
    case 'profile': return <ProfileSection accent={accent} content={content} showEnglish={showEnglish} module={module} />
    case 'solo_profile': return <SoloProfileSection accent={accent} content={content} showEnglish={showEnglish} module={module} />
    case 'timeline': return <TimelineSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'timeline_polaroid': return <TimelinePolaroidSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'interview': return <InterviewSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'midphoto': return <MidphotoSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'tab': return <TabSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'slide': return <SlideSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'gallery': return <GallerySection accent={accent} showEnglish={showEnglish} module={module} />
    case 'guestbook': return <GuestbookSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'guestalbum': return <GuestAlbumSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'account': return <AccountSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'contact': return <ContactSection accent={accent} content={content} showEnglish={showEnglish} module={module} />
    case 'rsvp': return <RsvpSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'dday': return <DdaySection accent={accent} content={content} showEnglish={showEnglish} module={module} />
    case 'video': return <VideoSection accent={accent} showEnglish={showEnglish} module={module} />
    case 'ending': return <EndingSection module={module} />
    default: {
      const cfg = SIMPLE_SECTIONS[module.type]
      return cfg ? <SimpleSection {...cfg} accent={accent} showEnglish={showEnglish} /> : null
    }
  }
}

// ── 모듈 호버 컨트롤 (편집 + 삭제) ─────────────────────────────────────────
function ModuleHoverControls({ module, onEdit }: { module: InvitationModule; onEdit: () => void }) {
  const { removeModule } = useEditorStore()
  const meta = MODULE_META[module.type]
  if (!meta) return null
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
      <button
        onClick={onEdit}
        className="flex flex-col items-center gap-1 px-2.5 py-2 bg-white/95 border border-gray-200 rounded-xl shadow-sm hover:border-primary hover:shadow-md transition-all min-w-[44px]"
        title="편집"
      >
        <Pencil size={13} strokeWidth={1.5} className="text-gray-500" />
        <span className="text-[9px] text-gray-500 leading-tight whitespace-nowrap">편집</span>
      </button>
      {!module.required && (
        <button
          onClick={() => removeModule(module.id)}
          className="flex flex-col items-center gap-1 px-2.5 py-2 bg-white/95 border border-gray-200 rounded-xl shadow-sm hover:border-red-400 hover:text-red-500 transition-all min-w-[44px]"
          title="삭제"
        >
          <Trash2 size={13} strokeWidth={1.5} className="text-gray-400 hover:text-red-500" />
          <span className="text-[9px] text-gray-400 leading-tight whitespace-nowrap">삭제</span>
        </button>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
interface PreviewPaneProps {
  panelRef?: React.RefObject<HTMLDivElement | null>
  contentOverride?: InvitationContent
  modulesOverride?: InvitationModule[]
  stylesOverride?: InvitationStyles
  readOnly?: boolean
}

export default function PreviewPane({ panelRef, contentOverride, modulesOverride, stylesOverride, readOnly }: PreviewPaneProps) {
  const store = useEditorStore()
  const content = contentOverride ?? store.content
  const modules = modulesOverride ?? store.modules
  const styles = stylesOverride ?? store.styles
  const setActiveNav = store.setActiveNav
  const setEditingModuleId = store.setEditingModuleId
  const linkRef = useRef<HTMLLinkElement | null>(null)

  const accent = styles.accentColor ?? DEFAULT_ACCENT
  const bgColor = styles.bgColor ?? DEFAULT_BG
  const spacingColor = styles.spacingColor ?? '#e5e7eb'
  const fontFamily = FONT_MAP[styles.font ?? '고운돋움'] ?? FONT_MAP['고운돋움']
  const showEnglish = styles.showEnglishTitle ?? true
  const fontSize = styles.fontSize === 'large' ? '15px' : styles.fontSize === 'xlarge' ? '17px' : '14px'
  const bgEffect = getBgEffect(styles.bgEffect)

  useEffect(() => {
    const fontUrl = FONT_URLS[styles.font ?? '고운돋움']
    if (!fontUrl) {
      linkRef.current?.remove()
      linkRef.current = null
      return
    }
    if (!linkRef.current) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      linkRef.current = link
    }
    linkRef.current.href = fontUrl
    return () => { linkRef.current?.remove(); linkRef.current = null }
  }, [styles.font])

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.order - b.order),
    [modules]
  )

  const hasMainModule = sortedModules.some(m => m.type === 'main')
  const hasCoupleNames = sortedModules.some(m => m.type === 'couple_names')
  const bgmCfg = styles.bgm

  // 레거시 커버 섹션 (main 모듈 없는 기존 초대장 호환)
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  const groomName = `${groom.last ?? '신'}${groom.first ?? '랑'}`
  const brideName = `${bride.last ?? '신'}${bride.first ?? '부'}`
  const [firstName, secondName] = (content.groomFirst ?? true) ? [groomName, brideName] : [brideName, groomName]
  const dateObj = content.eventDate ? new Date(content.eventDate) : new Date('2026-10-18')
  const dateStr = `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}.`
  const timeStr = content.eventTime ?? '낮 12시 00분'

  function handleModuleClick(module: InvitationModule) {
    if (readOnly) return
    // main 모듈은 'main_screen' solo 그룹의 패널을 띄운다 (variant 그리드 + 입력)
    const navId = module.type === 'main' ? 'main_screen' : module.type
    setActiveNav(navId)
    setEditingModuleId(module.id)
    setTimeout(() => {
      document.querySelector(`[data-nav-id="${navId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (panelRef?.current) panelRef.current.scrollTop = 0
    }, 50)
  }

  return (
    <ImageLightboxProvider zoomEnabled={!(styles.zoomDisabled ?? true)}>
    <div
      data-preview
      data-text-scale={styles.fontSize ?? 'normal'}
      className="w-[375px] text-center relative"
      style={{
        backgroundColor: spacingColor,
        color: '#333',
        fontFamily,
        fontSize,
        lineHeight: '2rem',
        '--spacing-color': spacingColor,
        padding: '0 10px',
        boxSizing: 'border-box',
      } as React.CSSProperties}
    >
    <div
      style={{
        backgroundColor: bgColor,
        ...bgEffect,
      } as React.CSSProperties}
    >
      {/* 레거시: main 모듈 없을 때 커버 섹션 표시 */}
      {!hasMainModule && (
        <section className="pb-10">
          <header className="pt-10 pb-8 tracking-widest" style={{ color: accent, fontFamily, fontSize: '1.125rem' }}>
            <div>{firstName}</div>
            <div className="my-1 text-gray-400 text-sm">그리고</div>
            <div>{secondName}</div>
          </header>
          <div className="mx-3.5 border-8 border-white">
            <div className="w-full aspect-[4/5] bg-gray-200 flex items-center justify-center overflow-hidden">
              {content.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={content.coverImage} alt="커버" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={40} className="text-gray-300" strokeWidth={1} />
              )}
            </div>
            <div className="py-6 bg-white text-center">
              <div className="text-xs text-gray-600">{dateStr} {timeStr}</div>
              {(content.venue?.name || content.venue?.hall) && (
                <div className="text-xs text-gray-400 mt-1">
                  {content.venue.name}{content.venue.hall ? ` ${content.venue.hall}` : ''}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 모듈 렌더링 */}
      {sortedModules.map((module) => {
        const el = renderModule(module, accent, content, showEnglish, fontFamily, hasCoupleNames)
        if (!el) return null
        return (
          <div key={module.id} data-module-id={module.id} className="relative group">
            {el}
            {!readOnly && <ModuleHoverControls module={module} onEdit={() => handleModuleClick(module)} />}
          </div>
        )
      })}

      <footer className="py-8 border-t border-gray-200">
        <div className="space-y-2 mx-4">
          <button className="w-full py-3 rounded-xl text-xs font-medium" style={{ backgroundColor: '#FAE100', color: '#3A1D1D' }}>
            카카오톡으로 공유하기
          </button>
          <button className="w-full py-3 rounded-xl text-xs border border-gray-200 text-gray-600">
            청첩장 주소 복사하기
          </button>
        </div>
        <div className="mt-6 text-xs text-gray-300">Copyright 2025. OPENDAY. All rights reserved.</div>
      </footer>
    </div>
    {bgmCfg?.url && <BgmFloatingPlayer cfg={bgmCfg} />}
    </div>
    </ImageLightboxProvider>
  )
}

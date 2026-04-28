'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { GripVertical, Upload, Link as LinkIcon, X, AlignLeft, AlignCenter, AlignRight, Crop, Check, Copy, ExternalLink, Play, Pause, Repeat, RefreshCw, ChevronUp, MessageCircleMore } from 'lucide-react'
import { captureAndUploadThumbnail } from '@/lib/capture-thumbnail'
import { buildFallbackTitle, formatEventDateText as fallbackFormatEventDateText, buildFallbackVenueText } from '@/lib/share-fallback'
import { nanoid } from 'nanoid'
import { useEditorStore } from '@/store/editor'
import type { BabyPerson, ContactGroup, GuestbookModuleConfig, ImageCropData, ModuleType, ParentPerson, ProfilePerson, RsvpModuleConfig, RsvpQuestion, RsvpQuestionType, SlideItem, TabItem, VenueModuleConfig, WeddingPerson } from '@/types/invitation'
import RichTextEditor from './RichTextEditor'
import CroppedImage from './CroppedImage'
import AspectRatioPicker from './AspectRatioPicker'
import { getTracksForCategory, type BgmTrack } from '@/lib/bgm-tracks'
import type { BgmConfig } from '@/types/invitation'
import dynamic from 'next/dynamic'

const LoopRegionEditor = dynamic(() => import('./LoopRegionEditor'), { ssr: false })

import type { NavGroup } from './nav-config'
import { getVariantsForCategory, findVariant, hydrateTextSlots, type MainScreenVariant } from './main-screen-variants'
import { PHOTO_SHAPES, PhotoShapeIcon, type PhotoShapeId } from './photo-shapes'
import {
  FRAME_STYLES, FrameIcon, type FrameStyleId,
  DECORATIONS, DecorationIcon, type DecorationId,
  BACKGROUND_PATTERNS, BackgroundPatternIcon, type BackgroundPatternId,
} from './main-decorations'

interface Props { section: string; navGroups: NavGroup[] }

const ALL_BG_EFFECTS = [
  { value: 'none', label: '없음' }, { value: 'paper', label: '종이' },
  { value: 'grid', label: '격자' }, { value: 'cloud', label: '구름' },
  { value: 'hanji', label: '한지' }, { value: 'dot', label: '점' },
]
const DEFAULT_FONTS = ['고운돋움', '나눔명조', '나눔바른고딕', '제주명조', 'KoPubWorld돋움', 'Noto Sans KR']
const DEFAULT_BG_COLORS      = ['#f3f3f3', '#fff8f3', '#f5f0eb', '#faf5f0', '#f0f0f0']
const DEFAULT_ACCENT_COLORS  = ['#bf8362', '#8a7b6e', '#d97c74', '#7b9e87', '#668eaa']
const DEFAULT_SPACING_COLORS = ['#ffffff', '#000000', '#f5f0eb']

const LABELS: Partial<Record<string, string>> = {
  settings: '설정', theme: '테마', basic: '기본 정보', main: '메인 화면',
  couple_names: '주인공',
  'required-host': '혼주', 'required-datetime-venue': '일시 장소',
  greeting: '인사말', nickname: '세례명·닉네임', contact: '연락처',
  profile: '가로형 프로필', solo_profile: '세로형 프로필',
  timeline: '타임라인', timeline_polaroid: '폴라로이드', interview: '인터뷰',
  midphoto: '단독', datetime: '달력 표현', venue: '지도',
  tab: '탭', slide: '슬라이드', gallery: '갤러리', notice: '안내사항',
  photo_frame: '액자',
  guestbook: '방명록', account: '계좌 정보', rsvp: 'RSVP · 참석 의사',
  dday: 'D+Day', floral: '화환', video: '동영상', guestalbum: '하객 앨범',
  ending: '엔딩 사진, 문구', opening: '오프닝 애니메이션', bgm: '배경음악',
  share: '공유하기', linkshare: '링크 공유 설정', kakaoshare: '카카오톡 공유 설정',
  order: '순서 변경',
}

// ── 공통 UI 컴포넌트 ───────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-sm font-medium text-gray-900 mb-5">{title}</h3>
}

function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 4 }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1.5">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none leading-6"
      />
    </div>
  )
}

function SegmentButtons<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 mb-1.5">{label}</label>}
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
              value === opt.value ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function AddButton({ onClick, label = '+ 추가' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 rounded-xl text-xs border border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors"
    >
      {label}
    </button>
  )
}

function ItemCard({ index, label, onDelete, children }: {
  index: number; label: string; onDelete: () => void; children: React.ReactNode
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-700">{label} {index + 1}</span>
        <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-400">삭제</button>
      </div>
      {children}
    </div>
  )
}

// ── 이미지 업로더 ─────────────────────────────────────────────────────────────
function parseAspect(ratio: string): number {
  const [w, h] = ratio.split('/').map(Number)
  return w / h
}

function ImageUploader({ label, value, onChange, crop, onCropChange, fallbackAspect }: {
  label: string
  value: string
  onChange: (v: string) => void
  crop?: ImageCropData
  onCropChange?: (c: ImageCropData | undefined) => void
  fallbackAspect?: string
}) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [editing, setEditing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cropEnabled = Boolean(onCropChange) && Boolean(fallbackAspect)
  const currentAspect = crop?.aspectRatio ?? fallbackAspect ?? '1/1'

  // 편집 중일 때 Cropper의 대화형 상태(오프셋/줌). 저장된 crop과 별개로 로컬 유지.
  const [liveOffset, setLiveOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [liveZoom, setLiveZoom] = useState<number>(1)
  // 편집 시작 시점의 crop을 보관. 취소 시 이 값으로 복원.
  const [cropSnapshot, setCropSnapshot] = useState<ImageCropData | undefined>(undefined)

  useEffect(() => {
    if (editing) {
      setLiveOffset(crop?.crop ?? { x: 0, y: 0 })
      setLiveZoom(crop?.zoom ?? 1)
    }
  }, [editing, crop])

  function startEditing() {
    setCropSnapshot(crop)
    setEditing(true)
  }
  function cancelEditing() {
    onCropChange?.(cropSnapshot)
    setEditing(false)
  }
  function finishEditing() {
    setEditing(false)
  }

  const upload = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const { url } = await res.json()
      if (url) {
        onChange(url)
        // 새 이미지 업로드 시 기존 크롭은 초기화 (원본이 바뀌었으므로)
        onCropChange?.(undefined)
        setEditing(false)
      }
    } finally {
      setUploading(false)
    }
  }, [onChange, onCropChange])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) upload(file)
  }

  // 비율 변경: 편집 중이면 Cropper가 자동 재계산 → 로컬/저장 상태 초기화. 편집 중 아니면 비율만 바꾸고 전체 영역으로 리셋.
  function handleAspectChange(next: string) {
    if (!onCropChange) return
    setLiveOffset({ x: 0, y: 0 })
    setLiveZoom(1)
    onCropChange({
      aspectRatio: next,
      zoom: 1,
      crop: { x: 0, y: 0 },
      croppedAreaPercentage: { x: 0, y: 0, width: 100, height: 100 },
    })
  }

  // Cropper 상호작용 끝나면 croppedAreaPercentage를 저장 (드래그 중엔 로컬 상태만 갱신)
  const onCropComplete = useCallback((area: Area) => {
    if (!onCropChange) return
    onCropChange({
      aspectRatio: currentAspect,
      zoom: liveZoom,
      crop: liveOffset,
      croppedAreaPercentage: {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      },
    })
  }, [onCropChange, currentAspect, liveZoom, liveOffset])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500">{label}</label>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-[10px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-1 flex items-center gap-1 transition-colors ${mode === 'upload' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Upload size={10} /> 파일
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-1 flex items-center gap-1 transition-colors ${mode === 'url' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LinkIcon size={10} /> URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        value ? (
          <div className="relative w-full rounded-xl overflow-hidden border-2 border-gray-200">
            {cropEnabled && editing ? (
              <div
                className="relative w-full bg-gray-900"
                style={{ aspectRatio: '3 / 2' }}
              >
                <Cropper
                  image={value}
                  crop={liveOffset}
                  zoom={liveZoom}
                  aspect={parseAspect(currentAspect)}
                  minZoom={1}
                  maxZoom={3}
                  zoomSpeed={1}
                  showGrid
                  objectFit="contain"
                  onCropChange={setLiveOffset}
                  onZoomChange={setLiveZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    cropAreaStyle: {
                      border: '2px solid rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.55)',
                      color: 'rgba(255, 255, 255, 0.6)',
                    },
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="h-7 px-2.5 bg-white rounded-full flex items-center gap-1 shadow text-[11px] text-gray-700 hover:bg-gray-50"
                  >
                    <X size={12} className="text-gray-500" />
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={finishEditing}
                    className="h-7 px-2.5 bg-white rounded-full flex items-center gap-1 shadow text-[11px] text-gray-800 hover:bg-gray-50"
                  >
                    <Check size={12} className="text-primary" />
                    완료
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="relative cursor-pointer group"
                onClick={() => fileRef.current?.click()}
              >
                {cropEnabled ? (
                  <CroppedImage src={value} crop={crop} fallbackAspect={fallbackAspect!} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={value} alt="" className="w-full object-contain max-h-64" />
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(''); onCropChange?.(undefined) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white"
                >
                  <X size={13} className="text-gray-600" />
                </button>
                {cropEnabled && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startEditing() }}
                    className="absolute top-2 right-11 h-7 px-2.5 bg-white/90 rounded-full flex items-center gap-1 shadow hover:bg-white"
                  >
                    <Crop size={11} className="text-gray-700" />
                    <span className="text-[10px] text-gray-700">편집</span>
                  </button>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-white text-xs font-medium">클릭하여 변경</span>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative w-full rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
              dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              {uploading ? (
                <div className="text-xs text-gray-400">업로드 중...</div>
              ) : (
                <>
                  <Upload size={20} className="text-gray-300" strokeWidth={1.5} />
                  <div className="text-xs text-gray-400 text-center">
                    <span className="text-primary font-medium">파일 선택</span> 또는 드래그
                  </div>
                  <div className="text-[10px] text-gray-300">JPG, PNG, GIF, WEBP</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        )
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); onCropChange?.(undefined) }}
          placeholder="https://..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
        />
      )}

      {cropEnabled && value && editing && (
        <div className="pt-1 space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">비율</label>
            <AspectRatioPicker value={currentAspect} onChange={handleAspectChange} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 shrink-0">확대</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={liveZoom}
              onChange={(e) => setLiveZoom(Number(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none bg-gray-200 cursor-pointer accent-primary
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-sm
                [&::-webkit-slider-thumb]:cursor-grab
                [&::-moz-range-thumb]:w-3.5
                [&::-moz-range-thumb]:h-3.5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-grab"
            />
            <span className="text-xs text-gray-500 w-9 text-right">{liveZoom.toFixed(1)}x</span>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonFields({ side, colorClass, person, onChange, nickname, onNicknameChange, phone, onPhoneChange }: {
  side: '신랑' | '신부'
  colorClass: string
  person: WeddingPerson
  onChange: (partial: Partial<WeddingPerson>) => void
  nickname?: string
  onNicknameChange?: (v: string) => void
  phone?: string
  onPhoneChange?: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className={`text-xs font-medium ${colorClass}`}>{side} 측 정보</p>
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">{side}님 <span className="text-red-400">*</span></label>
        <div className="flex gap-1.5">
          <input type="text" value={person.last ?? ''} onChange={(e) => onChange({ last: e.target.value })} placeholder="성"
            className="w-12 border border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-primary text-center" />
          <input type="text" value={person.first ?? ''} onChange={(e) => onChange({ first: e.target.value })} placeholder="이름"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary" />
          <input type="text" value={person.role ?? side} onChange={(e) => onChange({ role: e.target.value })} placeholder={side}
            className="w-12 border border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-primary text-center" />
        </div>
      </div>
      {[
        { label: `${side} 아버님`, nameKey: 'fatherName' as const, decKey: 'fatherDeceased' as const },
        { label: `${side} 어머님`, nameKey: 'motherName' as const, decKey: 'motherDeceased' as const },
      ].map(({ label, nameKey, decKey }) => (
        <div key={nameKey}>
          <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={person[nameKey] ?? ''}
              onChange={(e) => onChange({ [nameKey]: e.target.value })}
              placeholder="성함(OOO)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-gray-400">고인</span>
              <Toggle checked={person[decKey] ?? false} onChange={(v) => onChange({ [decKey]: v })} />
            </div>
          </div>
        </div>
      ))}
      {onNicknameChange !== undefined && (
        <Input label={`${side} 세례명 / 닉네임`} value={nickname ?? ''} onChange={onNicknameChange} placeholder={side === '신랑' ? '예: 바오로' : '예: 루시아'} />
      )}
      {onPhoneChange !== undefined && (
        <Input label={`${side} 연락처`} value={phone ?? ''} onChange={onPhoneChange} placeholder="010-0000-0000" />
      )}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200"
      style={{ width: 28, height: 16, backgroundColor: checked ? '#21AFBF' : '#e5e7eb' }}
    >
      <span
        className="absolute rounded-full shadow-sm transition-all duration-200"
        style={{
          width: 12, height: 12,
          top: 2,
          left: checked ? 14 : 2,
          backgroundColor: 'white',
        }}
      />
    </button>
  )
}

function ToggleWrapper({ label, visible, onToggle, children }: {
  label: string; visible: boolean; onToggle: (v: boolean) => void; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <Toggle checked={visible} onChange={onToggle} />
      </div>
      {visible && children}
    </div>
  )
}

function StyledInput({ value, onChange, bold, italic, align, onBoldChange, onItalicChange, onAlignChange, placeholder, multiline }: {
  value: string; onChange: (v: string) => void
  bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right'
  onBoldChange: (v: boolean) => void; onItalicChange: (v: boolean) => void; onAlignChange: (v: 'left' | 'center' | 'right') => void
  placeholder?: string; multiline?: boolean
}) {
  const b = bold ?? false
  const it = italic ?? false
  const al = align ?? 'center'
  const style = { fontWeight: b ? 'bold' : 'normal', fontStyle: it ? 'italic' : 'normal', textAlign: al } as React.CSSProperties
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 bg-gray-50">
        <button type="button" onClick={() => onBoldChange(!b)}
          className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${b ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>B</button>
        <button type="button" onClick={() => onItalicChange(!it)}
          className={`px-1.5 py-0.5 rounded text-xs italic transition-colors ${it ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>I</button>
        <div className="w-px h-3.5 bg-gray-200 mx-0.5" />
        {(['left', 'center', 'right'] as const).map((a) => (
          <button key={a} type="button" onClick={() => onAlignChange(a)}
            className={`p-1 rounded transition-colors ${al === a ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
            {a === 'left' ? <AlignLeft size={11} /> : a === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
          </button>
        ))}
      </div>
      {multiline ? (
        <textarea
          value={value}
          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
          onChange={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; onChange(e.target.value) }}
          placeholder={placeholder}
          rows={1}
          className="w-full px-3 py-2 text-xs focus:outline-none bg-white resize-none leading-5 overflow-hidden"
          style={style}
        />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 text-xs focus:outline-none bg-white"
          style={style} />
      )}
    </div>
  )
}

function LabelField({ modId, config, defaultKorean, defaultEnglish, defaultTitleBig, defaultTitleSmall }: {
  modId: string; config: Record<string, unknown>; defaultKorean: string; defaultEnglish: string
  defaultTitleBig?: string; defaultTitleSmall?: string
}) {
  const { updateModule } = useEditorStore()
  const save = (patch: Record<string, unknown>) => updateModule(modId, { ...config, ...patch })
  return (
    <div className="space-y-3">
      <ToggleWrapper label="레이블 큰 글씨" visible={(config.koreanLabelVisible as boolean) !== false} onToggle={(v) => save({ koreanLabelVisible: v })}>
        <StyledInput multiline
          value={(config.koreanTitle as string | undefined) ?? defaultKorean}
          onChange={(v) => save({ koreanTitle: v })}
          bold={config.koreanLabelBold as boolean | undefined}
          italic={config.koreanLabelItalic as boolean | undefined}
          align={(config.koreanLabelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
          onBoldChange={(v) => save({ koreanLabelBold: v })}
          onItalicChange={(v) => save({ koreanLabelItalic: v })}
          onAlignChange={(v) => save({ koreanLabelAlign: v })}
          placeholder={defaultKorean}
        />
      </ToggleWrapper>
      <ToggleWrapper label="레이블 작은 글씨" visible={(config.labelVisible as boolean) !== false} onToggle={(v) => save({ labelVisible: v })}>
        <StyledInput multiline
          value={(config.englishTitle as string | undefined) ?? defaultEnglish}
          onChange={(v) => save({ englishTitle: v })}
          bold={config.labelBold as boolean | undefined}
          italic={config.labelItalic as boolean | undefined}
          align={(config.labelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
          onBoldChange={(v) => save({ labelBold: v })}
          onItalicChange={(v) => save({ labelItalic: v })}
          onAlignChange={(v) => save({ labelAlign: v })}
          placeholder={defaultEnglish}
        />
      </ToggleWrapper>
      {defaultTitleBig !== undefined && (
        <ToggleWrapper label="제목 큰 글씨" visible={(config.titleBigVisible as boolean) === true || ((config.titleBigVisible as boolean) !== false && !!((config.titleBig as string) || defaultTitleBig))} onToggle={(v) => save({ titleBigVisible: v })}>
          <StyledInput multiline
            value={(config.titleBig as string | undefined) ?? defaultTitleBig}
            onChange={(v) => save({ titleBig: v })}
            bold={config.titleBigBold as boolean | undefined}
            italic={config.titleBigItalic as boolean | undefined}
            align={(config.titleBigAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => save({ titleBigBold: v })}
            onItalicChange={(v) => save({ titleBigItalic: v })}
            onAlignChange={(v) => save({ titleBigAlign: v })}
            placeholder={defaultTitleBig}
          />
        </ToggleWrapper>
      )}
      {defaultTitleSmall !== undefined && (
        <ToggleWrapper label="제목 작은 글씨" visible={(config.titleSmallVisible as boolean) === true || ((config.titleSmallVisible as boolean) !== false && !!((config.titleSmall as string) || defaultTitleSmall))} onToggle={(v) => save({ titleSmallVisible: v })}>
          <StyledInput multiline
            value={(config.titleSmall as string | undefined) ?? defaultTitleSmall}
            onChange={(v) => save({ titleSmall: v })}
            bold={config.titleSmallBold as boolean | undefined}
            italic={config.titleSmallItalic as boolean | undefined}
            align={(config.titleSmallAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => save({ titleSmallBold: v })}
            onItalicChange={(v) => save({ titleSmallItalic: v })}
            onAlignChange={(v) => save({ titleSmallAlign: v })}
            placeholder={defaultTitleSmall}
          />
        </ToggleWrapper>
      )}
    </div>
  )
}

// ── 패널들 ─────────────────────────────────────────────────────────────────

function SettingsPanel() {
  const { styles, setStyles, content, setContent } = useEditorStore()
  const opts: Array<{ key: 'zoomDisabled' | 'scrollAnimation' | 'showEnglishTitle'; label: string }> = [
    { key: 'zoomDisabled',     label: '확대 방지 기능 사용' },
    { key: 'scrollAnimation',  label: '스크롤 등장 애니메이션 사용' },
    { key: 'showEnglishTitle', label: '소제목 위 영문 디자인 노출' },
  ]
  return (
    <div className="p-5 space-y-5">
      <SectionHeader title="설정" />
      <div className="space-y-3">
        {opts.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-700">{label}</span>
            <Toggle checked={styles[key] ?? true} onChange={(v) => setStyles({ [key]: v })} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ThemeBgmTrackRow({ track, selected, playing, onSelect, onTogglePreview }: {
  track: BgmTrack
  selected: boolean
  playing: boolean
  onSelect: () => void
  onTogglePreview: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
      <button
        type="button"
        onClick={onSelect}
        className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
          selected ? 'bg-primary border-primary text-white' : 'border-gray-300 bg-white hover:border-primary'
        }`}
        aria-label={selected ? '선택됨' : '선택하기'}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </button>
      <button type="button" onClick={onSelect} className="flex-1 min-w-0 text-left">
        <div className="text-xs text-gray-900 truncate">{track.title}</div>
        <div className="text-[10px] text-gray-400 truncate">{track.artist}</div>
      </button>
      <button
        type="button"
        onClick={onTogglePreview}
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
          playing ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
        }`}
        aria-label={playing ? '미리듣기 정지' : '미리듣기'}
      >
        {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>
    </div>
  )
}

function ThemeBgmSection() {
  const { styles, setStyles, categorySlug } = useEditorStore()
  const cfg = (styles.bgm ?? {}) as BgmConfig
  const tracks = useMemo(() => getTracksForCategory(categorySlug), [categorySlug])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => () => {
    audioRef.current?.pause()
    audioRef.current = null
  }, [])

  function patch(p: Partial<BgmConfig>) {
    setStyles({ bgm: { ...cfg, ...p } })
  }

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPreviewingId(null)
  }

  function togglePreview(id: string, url: string) {
    if (previewingId === id) {
      stopPreview()
      return
    }
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(url)
    audio.volume = 0.7
    audio.onended = () => setPreviewingId(null)
    audio.play().catch(() => setPreviewingId(null))
    audioRef.current = audio
    setPreviewingId(id)
  }

  function selectTrack(track: BgmTrack) {
    patch({
      source: 'preset',
      trackId: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist,
      // 프리셋은 풀 트랙 반복이 기본이므로 loop 설정 초기화
      loopEnabled: false,
      loopStart: undefined,
      loopEnd: undefined,
    })
  }

  function selectNone() {
    setStyles({ bgm: undefined })
    stopPreview()
  }

  async function handleUpload(file: File) {
    setUploadError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data?.error ?? '업로드에 실패했습니다.')
        return
      }
      if (data.url) {
        patch({
          source: 'upload',
          trackId: undefined,
          url: data.url,
          title: file.name.replace(/\.[^.]+$/, ''),
          artist: undefined,
          loopEnabled: false,
          loopStart: undefined,
          loopEnd: undefined,
        })
      }
    } catch {
      setUploadError('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const isUpload = cfg.source === 'upload'
  const selectedId = isUpload ? null : cfg.trackId

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">배경 음악</p>
        {cfg.url && (
          <button
            type="button"
            onClick={selectNone}
            className="text-[11px] text-gray-400 hover:text-gray-600"
          >
            제거
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[11px] text-gray-400 px-1 mb-1">추천 음원</div>
        <div className="border border-gray-200 rounded-xl p-1.5">
          {tracks.map((t) => (
            <ThemeBgmTrackRow
              key={t.id}
              track={t}
              selected={selectedId === t.id}
              playing={previewingId === t.id}
              onSelect={() => selectTrack(t)}
              onTogglePreview={() => togglePreview(t.id, t.url)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[11px] text-gray-400 px-1 mb-1">파일 업로드</div>
        <div className={`border rounded-xl p-3 transition-colors ${isUpload ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <Upload size={12} />
              {uploading ? '업로드 중…' : '파일 선택'}
            </button>
            <span className="text-[10px] text-gray-400 truncate flex-1">
              {isUpload && cfg.title ? cfg.title : 'mp3 / m4a / wav / ogg, 최대 20MB'}
            </span>
            {isUpload && cfg.url && (
              <button
                type="button"
                onClick={() => togglePreview('upload', cfg.url!)}
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  previewingId === 'upload' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label={previewingId === 'upload' ? '미리듣기 정지' : '미리듣기'}
              >
                {previewingId === 'upload' ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
              </button>
            )}
          </div>
          {uploadError && <p className="text-[11px] text-red-500 mt-2">{uploadError}</p>}
          <input
            ref={fileRef}
            type="file"
            accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/aac,.mp3,.m4a,.wav,.ogg,.aac"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {isUpload && cfg.url && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-700 flex items-center gap-1.5">
              <Repeat size={12} className="text-gray-400" /> 반복 구간
            </span>
            <Toggle
              checked={cfg.loopEnabled ?? false}
              onChange={(v) => patch({ loopEnabled: v })}
            />
          </div>
          {cfg.loopEnabled && (
            <>
              <LoopRegionEditor
                key={cfg.url}
                url={cfg.url}
                loopStart={cfg.loopStart}
                loopEnd={cfg.loopEnd}
                onChange={(start, end) => patch({ loopStart: start, loopEnd: end })}
              />
              <p className="text-[11px] text-gray-400 leading-5">
                ① 파형 위에서 양 끝을 드래그해 반복할 구간을 지정하세요.
              </p>
            </>
          )}
        </div>
      )}

      <p className="text-[11px] text-gray-400 leading-5">
        ① 발행된 초대장에서 자동 재생됩니다. 일부 모바일 환경에서는 첫 진입 시 사용자 탭이 필요할 수 있어요.
      </p>
    </div>
  )
}

function ThemePanel() {
  const { styles, setStyles, templateConfig } = useEditorStore()
  const theme = templateConfig?.theme
  const fonts          = theme?.fonts          ?? DEFAULT_FONTS
  const bgPalette      = theme?.bgColors       ?? DEFAULT_BG_COLORS
  const accentPalette  = theme?.accentColors   ?? DEFAULT_ACCENT_COLORS
  const spacingPalette = theme?.spacingColors  ?? DEFAULT_SPACING_COLORS
  const bgEffectKeys   = new Set(theme?.bgEffects ?? ALL_BG_EFFECTS.map(e => e.value))
  const bgEffects      = ALL_BG_EFFECTS.filter(e => bgEffectKeys.has(e.value as never))
  const defaultBg      = bgPalette[0]
  const defaultAccent  = accentPalette[0]
  const defaultSpacing = spacingPalette[0]
  return (
    <div className="p-5 space-y-6">
      <SectionHeader title="테마" />
      <div className="space-y-4">
        <p className="text-xs font-medium text-gray-600">텍스트 설정</p>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">글꼴</label>
          <select
            value={styles.font ?? fonts[0]}
            onChange={(e) => setStyles({ font: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
          >
            {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <SegmentButtons
          label="글자 크기"
          value={(styles.fontSize ?? 'normal') as 'normal' | 'large' | 'xlarge'}
          options={[{ value: 'normal', label: '보통' }, { value: 'large', label: '크게' }, { value: 'xlarge', label: '더 크게' }]}
          onChange={(v) => setStyles({ fontSize: v })}
        />
      </div>
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-600">배경 효과</p>
        <div className="flex flex-wrap gap-2">
          {bgEffects.map((effect) => (
            <button key={effect.value} onClick={() => setStyles({ bgEffect: effect.value as never })}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                (styles.bgEffect ?? 'none') === effect.value
                  ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >{effect.label}</button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-xs font-medium text-gray-600">색상</p>
        {[
          { label: '배경 색상', key: 'bgColor' as const, colors: bgPalette, def: defaultBg },
          { label: '강조 색상', key: 'accentColor' as const, colors: accentPalette, def: defaultAccent },
          { label: '여백 색상', key: 'spacingColor' as const, colors: spacingPalette, def: defaultSpacing },
        ].map(({ label, key, colors, def }) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-2">{label}</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button key={c} onClick={() => setStyles({ [key]: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    (styles[key] ?? def) === c ? 'border-primary scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <ThemeBgmSection />
    </div>
  )
}

function BasicPanel() {
  const { content, setContent } = useEditorStore()
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  return (
    <div className="p-5 space-y-6">
      <SectionHeader title="기본 정보" />
      <PersonFields side="신랑" colorClass="text-primary"
        person={groom} onChange={(p) => setContent({ groom: { ...groom, ...p } })} />
      <PersonFields side="신부" colorClass="text-rose-500"
        person={bride} onChange={(p) => setContent({ bride: { ...bride, ...p } })} />
    </div>
  )
}

function BabyHostPanel() {
  const { content, setContent } = useEditorStore()
  const baby: BabyPerson = content.baby ?? {}
  const father: ParentPerson = content.parents?.father ?? { role: 'father' }
  const mother: ParentPerson = content.parents?.mother ?? { role: 'mother' }

  function setBaby(patch: Partial<BabyPerson>) {
    setContent({ baby: { ...baby, ...patch } })
  }
  function setParent(side: 'father' | 'mother', patch: Partial<ParentPerson>) {
    const next = { ...(content.parents ?? {}) }
    if (side === 'father') next.father = { ...father, ...patch, role: 'father' }
    else next.mother = { ...mother, ...patch, role: 'mother' }
    setContent({ parents: next })
  }

  const hashtagsText = (baby.hashtags ?? []).join(', ')

  return (
    <div className="p-5 space-y-6">
      <SectionHeader title="주인공" />
      <div className="space-y-4">
        <SegmentButtons
          label="부모 표시 순서"
          value={(content.babyFatherFirst ?? true) ? 'father' : 'mother'}
          options={[{ value: 'father', label: '아빠 먼저' }, { value: 'mother', label: '엄마 먼저' }]}
          onChange={(v) => setContent({ babyFatherFirst: v === 'father' })}
        />
      </div>
      <div className="border-t border-gray-100 pt-2 space-y-4">
        <p className="text-xs font-medium text-primary">아기 정보</p>
        <Input label="이름" value={baby.name ?? ''} onChange={(v) => setBaby({ name: v })} placeholder="예: 시안" />
        <Input label="생년월일" value={baby.birthDate ?? ''} onChange={(v) => setBaby({ birthDate: v })} placeholder="예: 2025-04-26" type="date" />
        <Input
          label="해시태그 (쉼표로 구분)"
          value={hashtagsText}
          onChange={(v) => setBaby({ hashtags: v.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="예: 웃음요정, 잠꾸러기"
        />
        <Textarea
          label="한 줄 소개"
          value={baby.description ?? ''}
          onChange={(v) => setBaby({ description: v })}
          placeholder="예: 울다 웃다 자다 그렇게 1년"
          rows={2}
        />
      </div>
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-primary">아빠</p>
        <Input label="성함" value={father.name ?? ''} onChange={(v) => setParent('father', { name: v })} placeholder="아빠 성함" />
        <Input label="연락처" value={father.phone ?? ''} onChange={(v) => setParent('father', { phone: v })} placeholder="010-0000-0000" />
      </div>
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <p className="text-xs font-medium text-rose-500">엄마</p>
        <Input label="성함" value={mother.name ?? ''} onChange={(v) => setParent('mother', { name: v })} placeholder="엄마 성함" />
        <Input label="연락처" value={mother.phone ?? ''} onChange={(v) => setParent('mother', { phone: v })} placeholder="010-0000-0000" />
      </div>
    </div>
  )
}

function HojuPanel() {
  const { content, setContent } = useEditorStore()
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  return (
    <div className="p-5 space-y-6">
      <SectionHeader title="혼주" />
      <div className="space-y-4">
        <SegmentButtons
          label="고인 표시 방법"
          value={(content.deceasedStyle ?? 'hanja') as 'hanja' | 'chrysanthemum' | 'ribbon'}
          options={[{ value: 'hanja', label: '故 한자' }, { value: 'chrysanthemum', label: '국화꽃' }, { value: 'ribbon', label: '리본' }]}
          onChange={(v) => setContent({ deceasedStyle: v })}
        />
        <SegmentButtons
          label="표시 순서"
          value={(content.groomFirst ?? true) ? 'groom' : 'bride'}
          options={[{ value: 'groom', label: '신랑 먼저' }, { value: 'bride', label: '신부 먼저' }]}
          onChange={(v) => setContent({ groomFirst: v === 'groom' })}
        />
      </div>
      <div className="border-t border-gray-100 pt-2 space-y-6">
        <PersonFields side="신랑" colorClass="text-primary"
          person={groom} onChange={(p) => setContent({ groom: { ...groom, ...p } })}
          nickname={content.groomNickname ?? ''} onNicknameChange={(v) => setContent({ groomNickname: v })}
          phone={content.groomPhone ?? ''} onPhoneChange={(v) => setContent({ groomPhone: v })}
        />
        <PersonFields side="신부" colorClass="text-primary"
          person={bride} onChange={(p) => setContent({ bride: { ...bride, ...p } })}
          nickname={content.brideNickname ?? ''} onNicknameChange={(v) => setContent({ brideNickname: v })}
          phone={content.bridePhone ?? ''} onPhoneChange={(v) => setContent({ bridePhone: v })}
        />
      </div>
    </div>
  )
}

// 추가 사진 액자 모듈 패널. 메인 화면(main)과 달리 자체 image/imageCrop을 모듈 config에 저장한다.
function PhotoFramePanel() {
  const { modules, editingModuleId, updateModule } = useEditorStore()
  const mod = useMemo(
    () => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'photo_frame'),
    [modules, editingModuleId]
  )
  const cfg = (mod?.config ?? {}) as {
    image?: string; imageCrop?: ImageCropData
    bottomText?: string; subText?: string
    showTitle?: boolean; showSubText?: boolean
  }

  function saveConfig(patch: Record<string, unknown>) {
    if (mod) updateModule(mod.id, patch)
  }

  if (!mod) return <PendingPanel title="액자" />

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="액자" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="액자" defaultEnglish="Frame" defaultTitleBig="" defaultTitleSmall="" />
      <ImageUploader
        label="사진"
        value={cfg.image ?? ''}
        onChange={(v) => saveConfig({ image: v })}
        crop={cfg.imageCrop}
        onCropChange={(c) => saveConfig({ imageCrop: c })}
        fallbackAspect="4/5"
      />
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-medium text-gray-500">추가 텍스트 설정</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">사진 제목</span>
          <Toggle checked={cfg.showTitle !== false} onChange={(v) => saveConfig({ showTitle: v })} />
        </div>
        {cfg.showTitle !== false && (
          <RichTextEditor
            label=""
            value={cfg.bottomText ?? ''}
            onChange={(v) => saveConfig({ bottomText: v })}
            placeholder="사진 제목을 입력하세요"
            rows={2}
            defaultAlign="center"
          />
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">그 아래 텍스트</span>
          <Toggle checked={cfg.showSubText !== false} onChange={(v) => saveConfig({ showSubText: v })} />
        </div>
        {cfg.showSubText !== false && (
          <RichTextEditor
            label=""
            value={cfg.subText ?? ''}
            onChange={(v) => saveConfig({ subText: v })}
            placeholder="추가 설명"
            rows={2}
            defaultAlign="center"
          />
        )}
      </div>
    </div>
  )
}

function CoupleNamesPanel() {
  const { content, modules, editingModuleId, updateModule } = useEditorStore()
  const mod = useMemo(
    () => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'couple_names'),
    [modules, editingModuleId]
  )
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  const groomName = `${groom.last ?? '신'}${groom.first ?? '랑'}`
  const brideName = `${bride.last ?? '신'}${bride.first ?? '부'}`
  const [firstName, secondName] = (content.groomFirst ?? true) ? [groomName, brideName] : [brideName, groomName]
  const cfg = (mod?.config ?? {}) as Record<string, unknown>

  function save(patch: Record<string, unknown>) {
    if (mod) updateModule(mod.id, { ...mod.config, ...patch })
  }

  if (!mod) return <PendingPanel title="주인공" />

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="주인공" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="신랑·신부" defaultEnglish="Couple" defaultTitleBig="" defaultTitleSmall="" />
      <ToggleWrapper label="위 이름" visible={cfg.firstNameVisible !== false} onToggle={(v) => save({ firstNameVisible: v })}>
        <StyledInput
          value={(cfg.firstNameText as string | undefined) ?? firstName}
          onChange={(v) => save({ firstNameText: v })}
          bold={cfg.firstNameBold as boolean | undefined}
          italic={cfg.firstNameItalic as boolean | undefined}
          align={(cfg.firstNameAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
          onBoldChange={(v) => save({ firstNameBold: v })}
          onItalicChange={(v) => save({ firstNameItalic: v })}
          onAlignChange={(v) => save({ firstNameAlign: v })}
          placeholder={firstName}
        />
      </ToggleWrapper>
      <ToggleWrapper label="중간 텍스트" visible={cfg.separatorVisible !== false} onToggle={(v) => save({ separatorVisible: v })}>
        <StyledInput
          value={(cfg.separatorText as string | undefined) ?? '그리고'}
          onChange={(v) => save({ separatorText: v })}
          bold={cfg.separatorBold as boolean | undefined}
          italic={cfg.separatorItalic as boolean | undefined}
          align={(cfg.separatorAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
          onBoldChange={(v) => save({ separatorBold: v })}
          onItalicChange={(v) => save({ separatorItalic: v })}
          onAlignChange={(v) => save({ separatorAlign: v })}
          placeholder="그리고"
        />
      </ToggleWrapper>
      <ToggleWrapper label="아래 이름" visible={cfg.secondNameVisible !== false} onToggle={(v) => save({ secondNameVisible: v })}>
        <StyledInput
          value={(cfg.secondNameText as string | undefined) ?? secondName}
          onChange={(v) => save({ secondNameText: v })}
          bold={cfg.secondNameBold as boolean | undefined}
          italic={cfg.secondNameItalic as boolean | undefined}
          align={(cfg.secondNameAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
          onBoldChange={(v) => save({ secondNameBold: v })}
          onItalicChange={(v) => save({ secondNameItalic: v })}
          onAlignChange={(v) => save({ secondNameAlign: v })}
          placeholder={secondName}
        />
      </ToggleWrapper>
      <p className="text-xs text-gray-400 flex items-start gap-1">
        <span>①</span>신랑·신부 이름은 기본 정보 탭에서 수정할 수 있습니다.
      </p>
    </div>
  )
}

function NicknamePanel() {
  const { content, setContent } = useEditorStore()
  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="세례명·닉네임" />
      <Input
        label="신랑 세례명 / 닉네임"
        value={content.groomNickname ?? ''}
        onChange={(v) => setContent({ groomNickname: v })}
        placeholder="예: 바오로"
      />
      <Input
        label="신부 세례명 / 닉네임"
        value={content.brideNickname ?? ''}
        onChange={(v) => setContent({ brideNickname: v })}
        placeholder="예: 루시아"
      />
    </div>
  )
}

function ContactPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(
    () => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'contact'),
    [modules, editingModuleId],
  )
  const groups: ContactGroup[] = useMemo(() => (mod?.config?.groups as ContactGroup[]) ?? [], [mod])

  if (!mod) return <PendingPanel title="연락처" />

  const save = (next: ContactGroup[]) => {
    if (mod) updateModule(mod.id, { ...mod.config, groups: next })
  }

  const updateGroup = (gi: number, patch: Partial<ContactGroup>) => {
    save(groups.map((g, i) => i === gi ? { ...g, ...patch } : g))
  }

  const updateContact = (gi: number, ci: number, patch: Partial<ContactGroup['contacts'][number]>) => {
    save(groups.map((g, i) => {
      if (i !== gi) return g
      return { ...g, contacts: g.contacts.map((c, j) => j === ci ? { ...c, ...patch } : c) }
    }))
  }

  const addContact = (gi: number) => {
    save(groups.map((g, i) => i === gi
      ? { ...g, contacts: [...g.contacts, { name: '', phone: '' }] }
      : g,
    ))
  }

  const removeContact = (gi: number, ci: number) => {
    save(groups.map((g, i) => i === gi
      ? { ...g, contacts: g.contacts.filter((_, j) => j !== ci) }
      : g,
    ))
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="연락처" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="연락하기" defaultEnglish="Contact" defaultTitleBig="" defaultTitleSmall="" />
      {groups.map((group, gi) => (
        <div key={gi} className="border border-gray-100 rounded-xl p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">그룹 {gi + 1}</span>
            <button onClick={() => save(groups.filter((_, i) => i !== gi))} className="text-xs text-gray-400 hover:text-red-400">그룹 삭제</button>
          </div>
          <Input label="그룹명" value={group.label} onChange={(v) => updateGroup(gi, { label: v })} placeholder="예: 신랑 측" />
          <Input label="영문 보조 라벨 (선택)" value={group.englishLabel ?? ''} onChange={(v) => updateGroup(gi, { englishLabel: v })} placeholder="예: GROOM" />
          {group.contacts.map((c, ci) => (
            <div key={ci} className="border border-dashed border-gray-200 rounded-lg p-2.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500">연락처 {ci + 1}</span>
                <button onClick={() => removeContact(gi, ci)} className="text-[11px] text-gray-400 hover:text-red-400">삭제</button>
              </div>
              <Input label="이름" value={c.name} onChange={(v) => updateContact(gi, ci, { name: v })} placeholder="예: 신랑, 아버님" />
              {c.bindTo ? (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">전화번호</label>
                  <div className="text-[11px] text-gray-400 px-3 py-2 border border-gray-100 rounded-xl bg-gray-50">
                    {c.bindTo === 'groomPhone' ? '혼주 > 신랑 연락처' : '혼주 > 신부 연락처'}에 연결됨
                  </div>
                </div>
              ) : (
                <Input label="전화번호" value={c.phone} onChange={(v) => updateContact(gi, ci, { phone: v })} placeholder="010-0000-0000" />
              )}
            </div>
          ))}
          <button
            onClick={() => addContact(gi)}
            className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-400 hover:border-primary hover:text-primary transition-colors"
          >
            + 연락처 추가
          </button>
        </div>
      ))}
      <AddButton onClick={() => save([...groups, { label: `그룹 ${groups.length + 1}`, englishLabel: '', contacts: [{ name: '', phone: '' }] }])} label="+ 그룹 추가" />
    </div>
  )
}

function GreetingPanel() {
  const { content, setContent } = useEditorStore()
  const groom = content.groom ?? {}
  const bride = content.bride ?? {}
  const groomName = `${groom.last ?? '신'}${groom.first ?? '랑'}`
  const brideName = `${bride.last ?? '신'}${bride.first ?? '부'}`
  const [first, second] = (content.groomFirst ?? true) ? [groomName, brideName] : [brideName, groomName]
  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="인사말" />
      <div className="space-y-3">
        <ToggleWrapper label="레이블 큰 글씨" visible={content.greetingKoreanLabelVisible !== false} onToggle={(v) => setContent({ greetingKoreanLabelVisible: v })}>
          <StyledInput multiline
            value={content.greetingKoreanTitle ?? '인사말'}
            onChange={(v) => setContent({ greetingKoreanTitle: v })}
            bold={content.greetingKoreanLabelBold} italic={content.greetingKoreanLabelItalic}
            align={(content.greetingKoreanLabelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ greetingKoreanLabelBold: v })}
            onItalicChange={(v) => setContent({ greetingKoreanLabelItalic: v })}
            onAlignChange={(v) => setContent({ greetingKoreanLabelAlign: v })}
            placeholder="인사말"
          />
        </ToggleWrapper>
        <ToggleWrapper label="레이블 작은 글씨" visible={content.greetingLabelVisible !== false} onToggle={(v) => setContent({ greetingLabelVisible: v })}>
          <StyledInput multiline
            value={content.greetingEnglishTitle ?? 'Invitation'}
            onChange={(v) => setContent({ greetingEnglishTitle: v })}
            bold={content.greetingLabelBold} italic={content.greetingLabelItalic}
            align={(content.greetingLabelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ greetingLabelBold: v })}
            onItalicChange={(v) => setContent({ greetingLabelItalic: v })}
            onAlignChange={(v) => setContent({ greetingLabelAlign: v })}
            placeholder="Invitation"
          />
        </ToggleWrapper>
        <ToggleWrapper label="제목 큰 글씨" visible={content.invitationTitleVisible !== false} onToggle={(v) => setContent({ invitationTitleVisible: v })}>
          <StyledInput multiline
            value={content.invitationTitle ?? '소중한 분들을 초대합니다'}
            onChange={(v) => setContent({ invitationTitle: v })}
            bold={content.invitationTitleBold} italic={content.invitationTitleItalic}
            align={(content.invitationTitleAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ invitationTitleBold: v })}
            onItalicChange={(v) => setContent({ invitationTitleItalic: v })}
            onAlignChange={(v) => setContent({ invitationTitleAlign: v })}
            placeholder="소중한 분들을 초대합니다"
          />
        </ToggleWrapper>
        <ToggleWrapper label="제목 작은 글씨" visible={content.greetingTitleSmallVisible !== false} onToggle={(v) => setContent({ greetingTitleSmallVisible: v })}>
          <StyledInput multiline
            value={content.greetingTitleSmall ?? ''}
            onChange={(v) => setContent({ greetingTitleSmall: v })}
            bold={content.greetingTitleSmallBold} italic={content.greetingTitleSmallItalic}
            align={(content.greetingTitleSmallAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ greetingTitleSmallBold: v })}
            onItalicChange={(v) => setContent({ greetingTitleSmallItalic: v })}
            onAlignChange={(v) => setContent({ greetingTitleSmallAlign: v })}
            placeholder=""
          />
        </ToggleWrapper>
      </div>
      <ToggleWrapper label="인사말 내용" visible={content.greetingMessageVisible !== false} onToggle={(v) => setContent({ greetingMessageVisible: v })}>
        <RichTextEditor label="" value={content.greetingMessage ?? ''} onChange={(v) => setContent({ greetingMessage: v })} placeholder="초대 메시지를 입력하세요" rows={8} defaultAlign="center" />
      </ToggleWrapper>
      <ToggleWrapper label="글쓴이" visible={content.greetingAuthorVisible !== false} onToggle={(v) => setContent({ greetingAuthorVisible: v })}>
        <StyledInput multiline
          value={content.greetingAuthor ?? `${first} · ${second}`}
          onChange={(v) => setContent({ greetingAuthor: v })}
          bold={content.greetingAuthorBold} italic={content.greetingAuthorItalic}
          align={(content.greetingAuthorAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
          onBoldChange={(v) => setContent({ greetingAuthorBold: v })}
          onItalicChange={(v) => setContent({ greetingAuthorItalic: v })}
          onAlignChange={(v) => setContent({ greetingAuthorAlign: v })}
          placeholder={`${first} · ${second}`}
        />
      </ToggleWrapper>
    </div>
  )
}

// 프로필(가로형/세로형) 공통 인물 입력 — 이미지/이름/생년월일/해시태그/설명
function PersonItemEditor({ person, onChange, descriptionAlign }: {
  person: ProfilePerson
  onChange: (next: ProfilePerson) => void
  descriptionAlign?: 'left' | 'center' | 'right'
}) {
  const hashtagsText = (person.hashtags ?? []).join(', ')
  return (
    <div className="space-y-2">
      <ImageUploader
        label="이미지"
        value={person.image ?? ''}
        onChange={(v) => onChange({ ...person, image: v })}
        crop={person.imageCrop}
        onCropChange={(c) => onChange({ ...person, imageCrop: c })}
        fallbackAspect="1/1"
      />
      <Input label="이름" value={person.name ?? ''} onChange={(v) => onChange({ ...person, name: v })} placeholder="이름" />
      <Input label="제목" value={person.title ?? ''} onChange={(v) => onChange({ ...person, title: v })} placeholder="예: 1990. 12. 10." />
      <Input
        label="해시태그 (쉼표로 구분)"
        value={hashtagsText}
        onChange={(v) => onChange({ ...person, hashtags: v.split(',').map(s => s.trim()).filter(Boolean) })}
        placeholder="웃음요정, 잠꾸러기"
      />
      <ToggleWrapper
        label="설명"
        visible={person.descriptionVisible !== false}
        onToggle={(v) => onChange({ ...person, descriptionVisible: v })}
      >
        <RichTextEditor
          label=""
          value={person.description ?? ''}
          onChange={(v) => onChange({ ...person, description: v })}
          placeholder="소개를 입력하세요"
          rows={3}
          defaultAlign={descriptionAlign ?? 'center'}
        />
      </ToggleWrapper>
    </div>
  )
}

// legacy(person1*/person2* 또는 단일 image/personName) → ProfilePerson[] 변환.
// EditorLayout 마이그레이션이 실패한 데이터에 대한 읽기 측 안전망.
function readPersons(cfg: Record<string, unknown>): ProfilePerson[] {
  if (Array.isArray(cfg.persons)) return cfg.persons as ProfilePerson[]
  // 가로형 legacy
  if (cfg.person1Image || cfg.person1Label || cfg.person1Story || cfg.person2Image || cfg.person2Label || cfg.person2Story) {
    const p1: ProfilePerson = {
      image: cfg.person1Image as string | undefined,
      imageCrop: cfg.person1ImageCrop as ImageCropData | undefined,
      name: cfg.person1Label as string | undefined,
      description: cfg.person1Story as string | undefined,
      descriptionVisible: cfg.person1StoryVisible as boolean | undefined,
    }
    const p2: ProfilePerson = {
      image: cfg.person2Image as string | undefined,
      imageCrop: cfg.person2ImageCrop as ImageCropData | undefined,
      name: cfg.person2Label as string | undefined,
      description: cfg.person2Story as string | undefined,
      descriptionVisible: cfg.person2StoryVisible as boolean | undefined,
    }
    return [p1, p2]
  }
  // 세로형 legacy
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

function ProfilePanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? (m.id === editingModuleId && m.type === 'profile') : m.type === 'profile'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as Record<string, unknown>
  const persons = readPersons(cfg)
  const introText = (cfg.introText as string | undefined) ?? ''
  const introTextVisible = cfg.introTextVisible !== false

  function savePersons(next: ProfilePerson[]) {
    if (!mod) return
    // legacy 키는 더 이상 쓰지 않으므로 제거 후 persons 만 저장
    const { person1Image, person1ImageCrop, person1Label, person1Story, person1StoryVisible,
            person2Image, person2ImageCrop, person2Label, person2Story, person2StoryVisible,
            ...rest } = cfg as Record<string, unknown>
    void person1Image; void person1ImageCrop; void person1Label; void person1Story; void person1StoryVisible
    void person2Image; void person2ImageCrop; void person2Label; void person2Story; void person2StoryVisible
    updateModule(mod.id, { ...rest, persons: next })
  }
  function savePatch(patch: Record<string, unknown>) {
    if (mod) updateModule(mod.id, { ...mod.config, ...patch })
  }

  if (!mod) return <PendingPanel title="가로형 프로필" />

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="가로형 프로필" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="소개" defaultEnglish="About" defaultTitleBig="" defaultTitleSmall="" />
      {persons.map((person, i) => (
        <ItemCard key={i} index={i} label="인물" onDelete={() => savePersons(persons.filter((_, j) => j !== i))}>
          <PersonItemEditor
            person={person}
            onChange={(next) => savePersons(persons.map((p, j) => (j === i ? next : p)))}
            descriptionAlign={i % 2 === 0 ? 'left' : 'right'}
          />
        </ItemCard>
      ))}
      <AddButton onClick={() => savePersons([...persons, {}])} label="+ 인물 추가" />
      <ToggleWrapper label="공통 소개글 (선택)" visible={introTextVisible} onToggle={(v) => savePatch({ introTextVisible: v })}>
        <RichTextEditor label="" value={introText} onChange={(v) => savePatch({ introText: v })} placeholder="공통 소개글을 입력하세요" rows={4} defaultAlign="center" />
      </ToggleWrapper>
    </div>
  )
}

function SoloProfilePanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? (m.id === editingModuleId && m.type === 'solo_profile') : m.type === 'solo_profile'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as Record<string, unknown>
  const persons = readPersons(cfg)

  function savePersons(next: ProfilePerson[]) {
    if (!mod) return
    const { image, imageCrop, personName, birthDate, hashtags, description, descriptionVisible, ...rest } = cfg as Record<string, unknown>
    void image; void imageCrop; void personName; void birthDate; void hashtags; void description; void descriptionVisible
    updateModule(mod.id, { ...rest, persons: next })
  }

  if (!mod) return <PendingPanel title="세로형 프로필" />

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="세로형 프로필" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="소개" defaultEnglish="About" defaultTitleBig="" defaultTitleSmall="" />
      {persons.map((person, i) => (
        <ItemCard key={i} index={i} label="인물" onDelete={() => savePersons(persons.filter((_, j) => j !== i))}>
          <PersonItemEditor
            person={person}
            onChange={(next) => savePersons(persons.map((p, j) => (j === i ? next : p)))}
            descriptionAlign="center"
          />
        </ItemCard>
      ))}
      <AddButton onClick={() => savePersons([...persons, {}])} label="+ 인물 추가" />
    </div>
  )
}

type TimelineItem = { title: string; content?: string; image?: string; crop?: ImageCropData; titleVisible?: boolean; contentVisible?: boolean }

function TimelineItemsEditor({ moduleType, title, defaultKorean, defaultEnglish }: { moduleType: 'timeline' | 'timeline_polaroid'; title: string; defaultKorean: string; defaultEnglish: string }) {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(
    () => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === moduleType),
    [modules, editingModuleId, moduleType],
  )
  const items = ((mod?.config?.items ?? []) as TimelineItem[])

  if (!mod) return <PendingPanel title={title} />

  function save(next: TimelineItem[]) {
    if (mod) updateModule(mod.id, { ...mod.config, items: next })
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title={title} />
      <LabelField modId={mod.id} config={mod.config} defaultKorean={defaultKorean} defaultEnglish={defaultEnglish} defaultTitleBig="" defaultTitleSmall="" />
      {items.map((item, i) => {
        const defaultAlign: 'left' | 'center' | 'right' = moduleType === 'timeline_polaroid'
          ? 'center'
          : (i % 2 === 0 ? 'left' : 'right')
        return (
          <ItemCard key={i} index={i} label="항목" onDelete={() => save(items.filter((_, j) => j !== i))}>
            <ImageUploader
              label="이미지"
              value={item.image ?? ''}
              onChange={(v) => { const n = [...items]; n[i] = { ...n[i], image: v }; save(n) }}
              crop={item.crop}
              onCropChange={(c) => { const n = [...items]; n[i] = { ...n[i], crop: c }; save(n) }}
              fallbackAspect="1/1"
            />
            <ToggleWrapper label="제목" visible={item.titleVisible !== false} onToggle={(v) => { const n = [...items]; n[i] = { ...n[i], titleVisible: v }; save(n) }}>
              <RichTextEditor label="" value={item.title} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], title: v }; save(n) }} placeholder="제목 자리입니다." rows={2} defaultAlign={defaultAlign} />
            </ToggleWrapper>
            <ToggleWrapper label="내용" visible={item.contentVisible !== false} onToggle={(v) => { const n = [...items]; n[i] = { ...n[i], contentVisible: v }; save(n) }}>
              <RichTextEditor label="" value={item.content ?? ''} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], content: v }; save(n) }} placeholder="내용 자리입니다." rows={2} defaultAlign={defaultAlign} />
            </ToggleWrapper>
          </ItemCard>
        )
      })}
      <AddButton onClick={() => save([...items, { title: '', content: '', image: '' }])} label="+ 항목 추가" />
    </div>
  )
}

function TimelinePanel() {
  return <TimelineItemsEditor moduleType="timeline" title="타임라인" defaultKorean="타임라인" defaultEnglish="Timeline" />
}

function TimelinePolaroidPanel() {
  return <TimelineItemsEditor moduleType="timeline_polaroid" title="폴라로이드" defaultKorean="폴라로이드" defaultEnglish="Polaroid" />
}

function InterviewPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'interview'), [modules, editingModuleId])
  const items = ((mod?.config?.items ?? []) as Array<{ question: string; answer: string }>)

  if (!mod) return <PendingPanel title="인터뷰" />

  function save(next: typeof items) {
    if (mod) updateModule(mod.id, { ...mod.config, items: next })
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="인터뷰" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="인터뷰" defaultEnglish="Interview" defaultTitleBig="" defaultTitleSmall="" />
      {items.map((item, i) => (
        <ItemCard key={i} index={i} label="Q&A" onDelete={() => save(items.filter((_, j) => j !== i))}>
          <ToggleWrapper label="질문" visible={(item as Record<string, unknown>).questionVisible !== false} onToggle={(v) => { const n = [...items]; (n[i] as Record<string, unknown>).questionVisible = v; save(n) }}>
            <RichTextEditor label="" value={item.question} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], question: v }; save(n) }} placeholder="두 분의 첫 인상은?" singleLine />
          </ToggleWrapper>
          <ToggleWrapper label="답변" visible={(item as Record<string, unknown>).answerVisible !== false} onToggle={(v) => { const n = [...items]; (n[i] as Record<string, unknown>).answerVisible = v; save(n) }}>
            <RichTextEditor label="" value={item.answer} onChange={(v) => { const n = [...items]; n[i] = { ...n[i], answer: v }; save(n) }} rows={2} placeholder="답변을 입력하세요" />
          </ToggleWrapper>
        </ItemCard>
      ))}
      <AddButton onClick={() => save([...items, { question: '', answer: '' }])} label="+ Q&A 추가" />
    </div>
  )
}

function MidphotoPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'midphoto'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as { image?: string; imageCrop?: ImageCropData; caption?: string; noSideMargin?: boolean }

  if (!mod) return <PendingPanel title="중간 사진" />

  function save(patch: Partial<typeof cfg>) {
    if (mod) updateModule(mod.id, { ...mod.config, ...patch })
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="단독" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="단독" defaultEnglish="Photo" defaultTitleBig="" defaultTitleSmall="" />
      <ImageUploader
        label="이미지"
        value={cfg.image ?? ''}
        onChange={(v) => save({ image: v })}
        crop={cfg.imageCrop}
        onCropChange={(c) => save({ imageCrop: c })}
        fallbackAspect="4/3"
      />
      <Input label="캡션 (선택)" value={cfg.caption ?? ''} onChange={(v) => save({ caption: v })} placeholder="사진 설명을 입력하세요" />
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-600">좌우 여백 없음</span>
        <Toggle checked={cfg.noSideMargin === true} onChange={(v) => save({ noSideMargin: v })} />
      </div>
    </div>
  )
}

function DatetimePanel() {
  const { content, setContent } = useEditorStore()
  const dateObj = content.eventDate ? new Date(content.eventDate) : new Date('2026-10-18')
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const autoDateStr = `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}. ${weekdays[dateObj.getDay()]}요일`
  const autoTimeStr = content.eventTime ?? '낮 12시 00분'
  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="달력 표현" />
      <div className="space-y-3">
        <ToggleWrapper label="레이블 큰 글씨" visible={content.datetimeKoreanLabelVisible !== false} onToggle={(v) => setContent({ datetimeKoreanLabelVisible: v })}>
          <StyledInput multiline
            value={content.datetimeKoreanTitle ?? '예식 일시'}
            onChange={(v) => setContent({ datetimeKoreanTitle: v })}
            bold={content.datetimeKoreanLabelBold} italic={content.datetimeKoreanLabelItalic}
            align={(content.datetimeKoreanLabelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ datetimeKoreanLabelBold: v })}
            onItalicChange={(v) => setContent({ datetimeKoreanLabelItalic: v })}
            onAlignChange={(v) => setContent({ datetimeKoreanLabelAlign: v })}
            placeholder="예식 일시"
          />
        </ToggleWrapper>
        <ToggleWrapper label="레이블 작은 글씨" visible={content.datetimeLabelVisible !== false} onToggle={(v) => setContent({ datetimeLabelVisible: v })}>
          <StyledInput multiline
            value={content.datetimeEnglishTitle ?? 'Wedding Day'}
            onChange={(v) => setContent({ datetimeEnglishTitle: v })}
            bold={content.datetimeLabelBold} italic={content.datetimeLabelItalic}
            align={(content.datetimeLabelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ datetimeLabelBold: v })}
            onItalicChange={(v) => setContent({ datetimeLabelItalic: v })}
            onAlignChange={(v) => setContent({ datetimeLabelAlign: v })}
            placeholder="Wedding Day"
          />
        </ToggleWrapper>
        <ToggleWrapper label="제목 큰 글씨" visible={content.datetimeTitleBigVisible !== false} onToggle={(v) => setContent({ datetimeTitleBigVisible: v })}>
          <StyledInput multiline
            value={content.datetimeTitleBig ?? autoDateStr}
            onChange={(v) => setContent({ datetimeTitleBig: v })}
            bold={content.datetimeTitleBigBold} italic={content.datetimeTitleBigItalic}
            align={(content.datetimeTitleBigAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ datetimeTitleBigBold: v })}
            onItalicChange={(v) => setContent({ datetimeTitleBigItalic: v })}
            onAlignChange={(v) => setContent({ datetimeTitleBigAlign: v })}
            placeholder={autoDateStr}
          />
        </ToggleWrapper>
        <ToggleWrapper label="제목 작은 글씨" visible={content.datetimeTitleSmallVisible !== false} onToggle={(v) => setContent({ datetimeTitleSmallVisible: v })}>
          <StyledInput multiline
            value={content.datetimeTitleSmall ?? autoTimeStr}
            onChange={(v) => setContent({ datetimeTitleSmall: v })}
            bold={content.datetimeTitleSmallBold} italic={content.datetimeTitleSmallItalic}
            align={(content.datetimeTitleSmallAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => setContent({ datetimeTitleSmallBold: v })}
            onItalicChange={(v) => setContent({ datetimeTitleSmallItalic: v })}
            onAlignChange={(v) => setContent({ datetimeTitleSmallAlign: v })}
            placeholder={autoTimeStr}
          />
        </ToggleWrapper>
      </div>
      <Input label="날짜" value={content.eventDate?.split('T')[0] ?? ''} onChange={(v) => setContent({ eventDate: v })} type="date" />
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">시간</label>
        <input
          type="time"
          defaultValue="12:00"
          onChange={(e) => {
            const [h, m] = e.target.value.split(':')
            const hour = parseInt(h)
            const period = hour < 12 ? '오전' : hour === 12 ? '낮' : '오후'
            const dh = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
            setContent({ eventTime: `${period} ${dh}시 ${m}분` })
          }}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
        />
      </div>
      <p className="text-xs text-gray-400 flex items-start gap-1">
        <span>①</span>미입력 시 자동 설정되며, 필요할 경우에만 수정해 주세요.
      </p>
    </div>
  )
}

type DaumPostcodeData = {
  roadAddress?: string
  jibunAddress?: string
  buildingName?: string
  address?: string
}

function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).daum?.Postcode) return resolve()
    const scriptId = 'daum-postcode-sdk'
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('daum postcode load failed')))
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('daum postcode load failed'))
    document.head.appendChild(script)
  })
}

function VenuePanel() {
  const { content, setContent, modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(
    () => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'venue'),
    [modules, editingModuleId],
  )

  async function searchAddress() {
    if (!mod) return
    try {
      await loadDaumPostcode()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Postcode = (window as any).daum?.Postcode
      if (!Postcode) return
      new Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          const address = data.roadAddress || data.jibunAddress || data.address || ''
          if (!address) return
          const buildingName = data.buildingName || ''
          const prev = ((mod.config ?? {}) as VenueModuleConfig).mapVenue ?? {}
          const fallbackName = prev.name || content.venue?.name || ''
          updateModule(mod.id, {
            mapVenue: { address, name: buildingName || fallbackName },
          })
        },
      }).open()
    } catch {
      // noop
    }
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="지도" />
      <div className="space-y-3">
        <ToggleWrapper label="레이블 큰 글씨" visible={content.venueKoreanLabelVisible !== false} onToggle={(val) => setContent({ venueKoreanLabelVisible: val })}>
          <StyledInput multiline
            value={content.venueKoreanTitle ?? '예식 장소'}
            onChange={(val) => setContent({ venueKoreanTitle: val })}
            bold={content.venueKoreanLabelBold} italic={content.venueKoreanLabelItalic}
            align={(content.venueKoreanLabelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(val) => setContent({ venueKoreanLabelBold: val })}
            onItalicChange={(val) => setContent({ venueKoreanLabelItalic: val })}
            onAlignChange={(val) => setContent({ venueKoreanLabelAlign: val })}
            placeholder="예식 장소"
          />
        </ToggleWrapper>
        <ToggleWrapper label="레이블 작은 글씨" visible={content.venueLabelVisible !== false} onToggle={(val) => setContent({ venueLabelVisible: val })}>
          <StyledInput multiline
            value={content.venueEnglishTitle ?? 'Location'}
            onChange={(val) => setContent({ venueEnglishTitle: val })}
            bold={content.venueLabelBold} italic={content.venueLabelItalic}
            align={(content.venueLabelAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(val) => setContent({ venueLabelBold: val })}
            onItalicChange={(val) => setContent({ venueLabelItalic: val })}
            onAlignChange={(val) => setContent({ venueLabelAlign: val })}
            placeholder="Location"
          />
        </ToggleWrapper>
        <ToggleWrapper label="제목 큰 글씨" visible={content.venueTitleBigVisible !== false} onToggle={(val) => setContent({ venueTitleBigVisible: val })}>
          <StyledInput multiline
            value={content.venueTitleBig ?? ''}
            onChange={(val) => setContent({ venueTitleBig: val })}
            bold={content.venueTitleBigBold} italic={content.venueTitleBigItalic}
            align={(content.venueTitleBigAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(val) => setContent({ venueTitleBigBold: val })}
            onItalicChange={(val) => setContent({ venueTitleBigItalic: val })}
            onAlignChange={(val) => setContent({ venueTitleBigAlign: val })}
            placeholder="예: 서울 그랜드 웨딩홀 2층 그레이스홀"
          />
        </ToggleWrapper>
        <ToggleWrapper label="제목 작은 글씨" visible={content.venueTitleSmallVisible !== false} onToggle={(val) => setContent({ venueTitleSmallVisible: val })}>
          <StyledInput multiline
            value={content.venueTitleSmall ?? ''}
            onChange={(val) => setContent({ venueTitleSmall: val })}
            bold={content.venueTitleSmallBold} italic={content.venueTitleSmallItalic}
            align={(content.venueTitleSmallAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(val) => setContent({ venueTitleSmallBold: val })}
            onItalicChange={(val) => setContent({ venueTitleSmallItalic: val })}
            onAlignChange={(val) => setContent({ venueTitleSmallAlign: val })}
            placeholder="안내 문구를 입력하세요"
          />
        </ToggleWrapper>
      </div>
      <div className="pt-2 border-t border-gray-100 space-y-2">
        <label className="block text-xs text-gray-500">지도 위치</label>
        <button
          type="button"
          onClick={searchAddress}
          className="w-full py-2.5 rounded-xl text-xs border border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition-colors"
        >
          지도 위치 설정
        </button>
      </div>
    </div>
  )
}

function TabPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'tab'), [modules, editingModuleId])
  const tabs = ((mod?.config?.tabs ?? []) as TabItem[])

  if (!mod) return <PendingPanel title="탭" />

  // ImageUploader가 onChange/onCropChange를 연속 호출할 때 클로저의 옛 tabs를 덮어쓰는 것을 막기 위해
  // 항상 store의 최신 상태를 읽어서 patch 방식으로 업데이트한다.
  function patchTab(i: number, patch: Partial<TabItem>) {
    const modId = mod!.id
    const latest = useEditorStore.getState().modules.find(m => m.id === modId)
    const prev = (latest?.config?.tabs ?? []) as TabItem[]
    const next = [...prev]
    next[i] = { ...next[i], ...patch }
    updateModule(modId, { ...(latest?.config ?? {}), tabs: next })
  }

  function replaceTabs(next: TabItem[]) {
    const modId = mod!.id
    const latest = useEditorStore.getState().modules.find(m => m.id === modId)
    updateModule(modId, { ...(latest?.config ?? {}), tabs: next })
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="탭" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="탭" defaultEnglish="Tabs" defaultTitleBig="" defaultTitleSmall="" />
      {tabs.map((tab, i) => (
        <ItemCard key={i} index={i} label="탭" onDelete={() => replaceTabs(tabs.filter((_, j) => j !== i))}>
          <Input
            label="탭 이름"
            value={tab.label ?? ''}
            onChange={(v) => patchTab(i, { label: v })}
            placeholder="예: 지하철"
          />
          <ToggleWrapper label="이미지" visible={tab.imageVisible !== false} onToggle={(v) => patchTab(i, { imageVisible: v })}>
            <ImageUploader
              label=""
              value={tab.image ?? ''}
              onChange={(v) => patchTab(i, { image: v })}
              crop={tab.imageCrop}
              onCropChange={(c) => patchTab(i, { imageCrop: c })}
              fallbackAspect="4/3"
            />
          </ToggleWrapper>
          <ToggleWrapper label="내용" visible={tab.contentVisible !== false} onToggle={(v) => patchTab(i, { contentVisible: v })}>
            <RichTextEditor label="" value={tab.content ?? ''} onChange={(v) => patchTab(i, { content: v })} rows={3} placeholder="탭 내용을 입력하세요" defaultAlign="center" />
          </ToggleWrapper>
        </ItemCard>
      ))}
      <AddButton onClick={() => replaceTabs([...tabs, { label: `탭 ${tabs.length + 1}`, content: '' }])} label="+ 탭 추가" />
    </div>
  )
}

function SlidePanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'slide'), [modules, editingModuleId])
  const slides = ((mod?.config?.slides ?? []) as SlideItem[])

  if (!mod) return <PendingPanel title="슬라이드" />

  function patchSlide(i: number, patch: Partial<SlideItem>) {
    const modId = mod!.id
    const latest = useEditorStore.getState().modules.find(m => m.id === modId)
    const prev = (latest?.config?.slides ?? []) as SlideItem[]
    const next = [...prev]
    next[i] = { ...next[i], ...patch }
    updateModule(modId, { ...(latest?.config ?? {}), slides: next })
  }

  function replaceSlides(next: SlideItem[]) {
    const modId = mod!.id
    const latest = useEditorStore.getState().modules.find(m => m.id === modId)
    updateModule(modId, { ...(latest?.config ?? {}), slides: next })
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="슬라이드" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="안내사항" defaultEnglish="Information" defaultTitleBig="" defaultTitleSmall="" />
      {slides.map((slide, i) => (
        <ItemCard key={i} index={i} label="슬라이드" onDelete={() => replaceSlides(slides.filter((_, j) => j !== i))}>
          <ToggleWrapper label="이미지" visible={slide.imageVisible !== false} onToggle={(v) => patchSlide(i, { imageVisible: v })}>
            <ImageUploader
              label=""
              value={slide.image ?? ''}
              onChange={(v) => patchSlide(i, { image: v })}
              crop={slide.imageCrop}
              onCropChange={(c) => patchSlide(i, { imageCrop: c })}
              fallbackAspect="16/9"
            />
          </ToggleWrapper>
          <ToggleWrapper label="제목" visible={slide.titleVisible !== false} onToggle={(v) => patchSlide(i, { titleVisible: v })}>
            <RichTextEditor label="" value={slide.title ?? ''} onChange={(v) => patchSlide(i, { title: v })} placeholder="슬라이드 제목" singleLine defaultAlign="center" />
          </ToggleWrapper>
          <ToggleWrapper label="내용" visible={slide.contentVisible !== false} onToggle={(v) => patchSlide(i, { contentVisible: v })}>
            <RichTextEditor label="" value={slide.content ?? ''} onChange={(v) => patchSlide(i, { content: v })} rows={3} placeholder="슬라이드 내용을 입력하세요" defaultAlign="center" />
          </ToggleWrapper>
        </ItemCard>
      ))}
      <AddButton onClick={() => replaceSlides([...slides, { title: '', content: '', imageVisible: false }])} label="+ 슬라이드 추가" />
    </div>
  )
}

function GalleryPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'gallery'), [modules, editingModuleId])
  const images = ((mod?.config?.images ?? []) as string[])
  const imageCrops = ((mod?.config?.imageCrops ?? []) as Array<ImageCropData | undefined>)

  if (!mod) return <PendingPanel title="갤러리" />

  function save(imgs: string[], crops: Array<ImageCropData | undefined>) {
    if (mod) updateModule(mod.id, { ...mod.config, images: imgs, imageCrops: crops })
  }

  function updateImage(i: number, url: string) {
    const nextImgs = [...images]
    nextImgs[i] = url
    const nextCrops = [...imageCrops]
    nextCrops[i] = undefined
    save(nextImgs, nextCrops)
  }

  function updateCrop(i: number, c: ImageCropData | undefined) {
    const nextCrops = [...imageCrops]
    nextCrops[i] = c
    save(images, nextCrops)
  }

  function remove(i: number) {
    save(images.filter((_, j) => j !== i), imageCrops.filter((_, j) => j !== i))
  }

  return (
    <div className="p-5 space-y-3">
      <SectionHeader title="갤러리" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="갤러리" defaultEnglish="Gallery" defaultTitleBig="" defaultTitleSmall="" />
      {images.map((img, i) => (
        <div key={i} className="space-y-1">
          <ImageUploader
            label={`이미지 ${i + 1}`}
            value={img}
            onChange={(v) => updateImage(i, v)}
            crop={imageCrops[i]}
            onCropChange={(c) => updateCrop(i, c)}
            fallbackAspect="1/1"
          />
          <button onClick={() => remove(i)} className="text-[10px] text-gray-400 hover:text-red-400">삭제</button>
        </div>
      ))}
      {images.length < 9 && (
        <AddButton onClick={() => save([...images, ''], [...imageCrops, undefined])} label="+ 이미지 추가" />
      )}
      <p className="text-xs text-gray-400">최대 9장까지 추가할 수 있습니다.</p>
    </div>
  )
}

const GUESTBOOK_DEFAULTS = {
  buttonLabel: '작성하기',
  modalTitle: '방명록 작성',
  submitLabel: '등록하기',
  namePlaceholder: '이름을 입력해 주세요',
  messagePlaceholder: '축하 메시지를 남겨주세요',
  passwordPlaceholder: '4자리 숫자',
} as const

function GuestbookPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'guestbook'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as GuestbookModuleConfig

  // 기본값이 누락된 경우 config 에 주입해서 인풋과 프리뷰가 동일한 값을 읽게 한다
  useEffect(() => {
    if (!mod) return
    const patch: Partial<GuestbookModuleConfig> = {}
    if (cfg.buttonLabel === undefined) patch.buttonLabel = GUESTBOOK_DEFAULTS.buttonLabel
    if (cfg.modalTitle === undefined) patch.modalTitle = GUESTBOOK_DEFAULTS.modalTitle
    if (cfg.submitLabel === undefined) patch.submitLabel = GUESTBOOK_DEFAULTS.submitLabel
    if (cfg.namePlaceholder === undefined) patch.namePlaceholder = GUESTBOOK_DEFAULTS.namePlaceholder
    if (cfg.messagePlaceholder === undefined) patch.messagePlaceholder = GUESTBOOK_DEFAULTS.messagePlaceholder
    if (cfg.passwordPlaceholder === undefined) patch.passwordPlaceholder = GUESTBOOK_DEFAULTS.passwordPlaceholder
    if (Object.keys(patch).length > 0) {
      updateModule(mod.id, { ...mod.config, ...patch })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])

  if (!mod) return <PendingPanel title="방명록" />

  const save = (patch: Partial<GuestbookModuleConfig>) => {
    updateModule(mod.id, { ...mod.config, ...patch })
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="방명록" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="방명록" defaultEnglish="Guestbook" defaultTitleBig="" defaultTitleSmall="" />
      <Input
        label="버튼 이름"
        value={cfg.buttonLabel ?? ''}
        onChange={(v) => save({ buttonLabel: v })}
      />
      <Input
        label="모달 제목"
        value={cfg.modalTitle ?? ''}
        onChange={(v) => save({ modalTitle: v })}
      />
      <Input
        label="제출 버튼 이름"
        value={cfg.submitLabel ?? ''}
        onChange={(v) => save({ submitLabel: v })}
      />
      <Input
        label="이름 플레이스홀더"
        value={cfg.namePlaceholder ?? ''}
        onChange={(v) => save({ namePlaceholder: v })}
      />
      <Input
        label="내용 플레이스홀더"
        value={cfg.messagePlaceholder ?? ''}
        onChange={(v) => save({ messagePlaceholder: v })}
      />
      <Input
        label="비밀번호 플레이스홀더"
        value={cfg.passwordPlaceholder ?? ''}
        onChange={(v) => save({ passwordPlaceholder: v })}
      />
      <p className="text-xs text-gray-500 leading-5">하객들이 이 초대장에서 작성하기 버튼을 눌러 이름·내용·비밀번호를 남길 수 있어요. 비밀번호는 본인이 직접 삭제할 때 사용됩니다.</p>
    </div>
  )
}

interface AccountItem { bank: string; number: string; name: string }
interface AccountGroup { label: string; accounts: AccountItem[] }

function AccountPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'account'), [modules, editingModuleId])
  const groups: AccountGroup[] = useMemo(() => (mod?.config?.groups as AccountGroup[]) ?? [], [mod])

  if (!mod) return <PendingPanel title="계좌 정보" />

  function saveGroups(next: AccountGroup[]) {
    if (mod) updateModule(mod.id, { ...mod.config, groups: next })
  }

  function updateGroup(gi: number, patch: Partial<AccountGroup>) {
    const next = groups.map((g, i) => i === gi ? { ...g, ...patch } : g)
    saveGroups(next)
  }

  function updateAccount(gi: number, ai: number, patch: Partial<AccountItem>) {
    const next = groups.map((g, i) => {
      if (i !== gi) return g
      const accs = g.accounts.map((a, j) => j === ai ? { ...a, ...patch } : a)
      return { ...g, accounts: accs }
    })
    saveGroups(next)
  }

  function addAccount(gi: number) {
    const next = groups.map((g, i) => i === gi ? { ...g, accounts: [...g.accounts, { bank: '', number: '', name: '' }] } : g)
    saveGroups(next)
  }

  function removeAccount(gi: number, ai: number) {
    const next = groups.map((g, i) => i === gi ? { ...g, accounts: g.accounts.filter((_, j) => j !== ai) } : g)
    saveGroups(next)
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="계좌 정보" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="계좌 정보" defaultEnglish="Account" defaultTitleBig="마음 전하실 곳" defaultTitleSmall="" />
      {groups.map((group, gi) => (
        <div key={gi} className="border border-gray-100 rounded-xl p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">그룹 {gi + 1}</span>
            <button onClick={() => saveGroups(groups.filter((_, i) => i !== gi))} className="text-xs text-gray-400 hover:text-red-400">그룹 삭제</button>
          </div>
          <Input label="그룹명 (토글 버튼 텍스트)" value={group.label} onChange={(v) => updateGroup(gi, { label: v })} placeholder="예: 신랑측 계좌번호" />
          {group.accounts.map((acc, ai) => (
            <div key={ai} className="border border-dashed border-gray-200 rounded-lg p-2.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500">계좌 {ai + 1}</span>
                <button onClick={() => removeAccount(gi, ai)} className="text-[11px] text-gray-400 hover:text-red-400">삭제</button>
              </div>
              <Input label="은행명" value={acc.bank} onChange={(v) => updateAccount(gi, ai, { bank: v })} placeholder="예: 국민은행" />
              <Input label="계좌번호" value={acc.number} onChange={(v) => updateAccount(gi, ai, { number: v })} placeholder="000-000-000000" />
              <Input label="예금주" value={acc.name} onChange={(v) => updateAccount(gi, ai, { name: v })} placeholder="홍길동" />
            </div>
          ))}
          <button
            onClick={() => addAccount(gi)}
            className="w-full py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-400 hover:border-primary hover:text-primary transition-colors"
          >
            + 계좌 추가
          </button>
        </div>
      ))}
      <AddButton onClick={() => saveGroups([...groups, { label: '신랑측 계좌번호', accounts: [{ bank: '', number: '', name: '' }] }])} label="+ 그룹 추가" />
    </div>
  )
}

const RSVP_QUESTION_TYPES: { value: RsvpQuestionType; label: string; hasOptions: boolean; hasPlaceholder: boolean }[] = [
  { value: 'text-short',    label: '단답형',   hasOptions: false, hasPlaceholder: true },
  { value: 'text-long',     label: '장문형',   hasOptions: false, hasPlaceholder: true },
  { value: 'single-choice', label: '객관식',   hasOptions: true,  hasPlaceholder: false },
  { value: 'multi-choice',  label: '체크박스', hasOptions: true,  hasPlaceholder: false },
  { value: 'dropdown',      label: '드롭다운', hasOptions: true,  hasPlaceholder: false },
  { value: 'number',        label: '숫자',     hasOptions: false, hasPlaceholder: true },
  { value: 'date',          label: '날짜',     hasOptions: false, hasPlaceholder: false },
  { value: 'email',         label: '이메일',   hasOptions: false, hasPlaceholder: true },
  { value: 'phone',         label: '전화번호', hasOptions: false, hasPlaceholder: true },
]

function getQuestionTypeMeta(type: RsvpQuestionType) {
  return RSVP_QUESTION_TYPES.find(t => t.value === type) ?? RSVP_QUESTION_TYPES[0]
}

function RsvpQuestionCard({ index, question, onChange, onDelete }: {
  index: number; question: RsvpQuestion; onChange: (q: RsvpQuestion) => void; onDelete: () => void
}) {
  const meta = getQuestionTypeMeta(question.type)
  const options = question.options ?? []

  const changeType = (type: RsvpQuestionType) => {
    const nextMeta = getQuestionTypeMeta(type)
    onChange({
      ...question,
      type,
      options: nextMeta.hasOptions ? (options.length ? options : ['', '']) : undefined,
      placeholder: nextMeta.hasPlaceholder ? question.placeholder : undefined,
    })
  }

  return (
    <ItemCard index={index} label="질문" onDelete={onDelete}>
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">유형</label>
        <div className="relative">
          <select
            value={question.type}
            onChange={(e) => changeType(e.target.value as RsvpQuestionType)}
            className="w-full appearance-none border border-gray-200 rounded-xl px-3 pr-8 py-2 text-xs bg-white focus:outline-none focus:border-primary cursor-pointer"
          >
            {RSVP_QUESTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
        </div>
      </div>
      <Input
        label="질문 문구"
        value={question.label}
        onChange={(v) => onChange({ ...question, label: v })}
        placeholder="예: 참석 하시나요?"
      />
      <Input
        label="보조 설명"
        value={question.description ?? ''}
        onChange={(v) => onChange({ ...question, description: v })}
        placeholder="선택 입력"
      />
      {meta.hasPlaceholder && (
        <Input
          label="플레이스홀더"
          value={question.placeholder ?? ''}
          onChange={(v) => onChange({ ...question, placeholder: v })}
          placeholder="입력 안내 문구"
        />
      )}
      {meta.hasOptions && (
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-500">선택지</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options]
                    next[i] = e.target.value
                    onChange({ ...question, options: next })
                  }}
                  placeholder={`선택지 ${i + 1}`}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => {
                    if (options.length <= 1) return
                    onChange({ ...question, options: options.filter((_, idx) => idx !== i) })
                  }}
                  className="text-gray-300 hover:text-red-400 p-1"
                  aria-label="선택지 삭제"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <AddButton onClick={() => onChange({ ...question, options: [...options, ''] })} label="+ 선택지 추가" />
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-500">필수 응답</span>
        <Toggle checked={question.required === true} onChange={(v) => onChange({ ...question, required: v })} />
      </div>
    </ItemCard>
  )
}

const RSVP_DEFAULTS = {
  buttonLabel: '참석 여부 알리기',
  modalTitle: '참석 여부 전달',
  submitLabel: '전달하기',
} as const

function RsvpPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'rsvp'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as RsvpModuleConfig

  // 기본값이 누락된 경우 config에 주입해서 인풋과 프리뷰가 동일한 값을 읽게 한다
  useEffect(() => {
    if (!mod) return
    const patch: Partial<RsvpModuleConfig> = {}
    if (cfg.buttonLabel === undefined) patch.buttonLabel = RSVP_DEFAULTS.buttonLabel
    if (cfg.modalTitle === undefined) patch.modalTitle = RSVP_DEFAULTS.modalTitle
    if (cfg.submitLabel === undefined) patch.submitLabel = RSVP_DEFAULTS.submitLabel
    if (Object.keys(patch).length > 0) {
      updateModule(mod.id, { ...mod.config, ...patch })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod?.id])

  if (!mod) return <PendingPanel title="RSVP" />

  const save = (patch: Partial<RsvpModuleConfig>) => {
    updateModule(mod.id, { ...mod.config, ...patch })
  }

  const questions: RsvpQuestion[] = cfg.questions ?? []
  const setQuestions = (next: RsvpQuestion[]) => save({ questions: next })
  const updateQ = (id: string, q: RsvpQuestion) => setQuestions(questions.map(item => item.id === id ? q : item))
  const removeQ = (id: string) => setQuestions(questions.filter(item => item.id !== id))
  const addQ = () => setQuestions([...questions, { id: nanoid(8), type: 'text-short', label: '', required: false }])

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="RSVP · 참석 의사" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="참석 의사" defaultEnglish="RSVP" defaultTitleBig="" defaultTitleSmall="" />
      <Input
        label="버튼 이름"
        value={cfg.buttonLabel ?? ''}
        onChange={(v) => save({ buttonLabel: v })}
      />
      <Input
        label="모달 제목"
        value={cfg.modalTitle ?? ''}
        onChange={(v) => save({ modalTitle: v })}
      />
      <Input
        label="제출 버튼 이름"
        value={cfg.submitLabel ?? ''}
        onChange={(v) => save({ submitLabel: v })}
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">질문</span>
          <span className="text-xs text-gray-400">{questions.length}개</span>
        </div>
        {questions.length === 0 ? (
          <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl px-3 py-4 text-center">
            원하는 질문을 추가해 보세요.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <RsvpQuestionCard
                key={q.id}
                index={i}
                question={q}
                onChange={(next) => updateQ(q.id, next)}
                onDelete={() => removeQ(q.id)}
              />
            ))}
          </div>
        )}
        <AddButton onClick={addQ} label="+ 질문 추가" />
      </div>
    </div>
  )
}

function DdayPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'dday'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as Record<string, unknown>
  const save = (patch: Record<string, unknown>) => { if (mod) updateModule(mod.id, { ...mod.config, ...patch }) }
  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="D+Day" />
      {mod && <LabelField modId={mod.id} config={mod.config} defaultKorean="D+Day" defaultEnglish="D+Day" defaultTitleBig="" defaultTitleSmall="" />}
      {mod && (
        <ToggleWrapper label="카운트다운 캡션" visible={(cfg.captionVisible as boolean) !== false} onToggle={(v) => save({ captionVisible: v })}>
          <StyledInput multiline
            value={(cfg.caption as string | undefined) ?? '결혼식까지'}
            onChange={(v) => save({ caption: v })}
            bold={cfg.captionBold as boolean | undefined}
            italic={cfg.captionItalic as boolean | undefined}
            align={(cfg.captionAlign as 'left' | 'center' | 'right' | undefined) ?? 'center'}
            onBoldChange={(v) => save({ captionBold: v })}
            onItalicChange={(v) => save({ captionItalic: v })}
            onAlignChange={(v) => save({ captionAlign: v })}
            placeholder="결혼식까지"
          />
        </ToggleWrapper>
      )}
      <p className="text-xs text-gray-500 leading-5">예식 일시를 기준으로 자동 계산됩니다. 날짜는 예식 일시 탭에서 변경할 수 있습니다.</p>
    </div>
  )
}

function VideoPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'video'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as { url?: string }

  if (!mod) return <PendingPanel title="동영상" />

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="동영상" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="동영상" defaultEnglish="Video" defaultTitleBig="" defaultTitleSmall="" />
      <Input
        label="동영상 URL"
        value={cfg.url ?? ''}
        onChange={(v) => { if (mod) updateModule(mod.id, { ...mod.config, url: v }) }}
        placeholder="https://youtube.com/watch?v=..."
      />
      <p className="text-xs text-gray-400 flex items-start gap-1">
        <span>①</span>유튜브, 비메오 등 동영상 URL을 입력하세요.
      </p>
    </div>
  )
}

function GuestAlbumPanel() {
  const { modules, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'guestalbum'), [modules, editingModuleId])

  if (!mod) return <PendingPanel title="하객 앨범" />

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="하객 앨범" />
      <LabelField modId={mod.id} config={mod.config} defaultKorean="하객 앨범" defaultEnglish="Guest Album" defaultTitleBig="" defaultTitleSmall="" />
      <p className="text-xs text-gray-500 leading-5">하객들이 직접 사진을 올릴 수 있는 앨범입니다.</p>
    </div>
  )
}

function EndingPanel() {
  const { modules, updateModule, editingModuleId } = useEditorStore()
  const mod = useMemo(() => modules.find(m => editingModuleId ? m.id === editingModuleId : m.type === 'ending'), [modules, editingModuleId])
  const cfg = (mod?.config ?? {}) as { image?: string; imageCrop?: ImageCropData; message?: string }

  if (!mod) return <PendingPanel title="엔딩 사진" />

  function save(patch: Record<string, unknown>) {
    if (mod) updateModule(mod.id, { ...mod.config, ...patch })
  }

  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="엔딩 사진, 문구" />
      <ImageUploader
        label="사진"
        value={cfg.image ?? ''}
        onChange={(v) => save({ image: v })}
        crop={cfg.imageCrop}
        onCropChange={(c) => save({ imageCrop: c })}
        fallbackAspect="4/3"
      />
      <ToggleWrapper label="마무리 메시지" visible={(mod.config?.messageVisible as boolean) !== false} onToggle={(v) => save({ messageVisible: v })}>
        <RichTextEditor label="" value={cfg.message ?? ''} onChange={(v) => save({ message: v })} placeholder="감사의 말씀을 입력하세요" rows={4} />
      </ToggleWrapper>
    </div>
  )
}

function formatEventDateText(dateStr?: string, timeStr?: string): string {
  return fallbackFormatEventDateText(dateStr ?? null, timeStr ?? null) ?? ''
}

function ThumbnailUpdater({ thumbnailUrl, onUpdated }: { thumbnailUrl: string | null; onUpdated: (url: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const url = await captureAndUploadThumbnail()
      onUpdated(url)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '캡처에 실패했습니다.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }, [busy, onUpdated])

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={busy}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        <RefreshCw size={12} className={busy ? 'animate-spin' : ''} />
        {busy ? '캡처 중...' : (thumbnailUrl ? '썸네일 다시 캡처하기' : '메인 영역으로 썸네일 만들기')}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function PublishToggle() {
  const { invitationId, isPublished, setIsPublished } = useEditorStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = useCallback(async () => {
    if (!invitationId || busy) return
    const next = !isPublished
    setBusy(true)
    setError(null)
    try {
      const r = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: next }),
      })
      if (!r.ok) throw new Error()
      setIsPublished(next)
    } catch {
      setError(next ? '발행에 실패했습니다.' : '발행 취소에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }, [invitationId, isPublished, busy, setIsPublished])

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{isPublished ? '발행됨' : '미발행'}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isPublished ? '링크로 누구나 볼 수 있어요.' : '발행해야 링크 공유가 가능해요.'}
        </p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <Toggle checked={isPublished} onChange={() => { if (!busy) toggle() }} />
    </div>
  )
}

function LinkSharePanel() {
  const { invitationId, slug, content, share, setShare, categorySlug } = useEditorStore()
  const [copied, setCopied] = useState(false)

  const shareUrl = useMemo(() => {
    if (!slug) return ''
    if (typeof window !== 'undefined') return `${window.location.origin}/i/${slug}`
    return `/i/${slug}`
  }, [slug])

  const fallbackTitle = useMemo(() => buildFallbackTitle({
    content,
    categorySlug,
    invitationTitle: '초대합니다',
  }), [content, categorySlug])

  const previewTitle = share.linkShareTitle ?? fallbackTitle
  const previewDate = formatEventDateText(content.eventDate, content.eventTime)

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }, [shareUrl])

  const onThumbUpdated = useCallback(async (url: string) => {
    setShare({ thumbnailUrl: url })
    if (invitationId) {
      try {
        await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thumbnailUrl: url }),
        })
      } catch {
        // 다음 자동저장 때 다시 시도됨
      }
    }
  }, [invitationId, setShare])

  if (!slug) {
    return <div className="p-5"><p className="text-xs text-gray-400">초대장 정보를 불러오는 중입니다...</p></div>
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <LinkIcon size={16} className="text-gray-700" />
        <h3 className="text-sm font-medium text-gray-900">링크 공유 설정</h3>
      </div>

      <PublishToggle />

      <section className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700">미리보기</h4>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="rounded-lg overflow-hidden border border-gray-100 bg-white">
            <div className="aspect-[16/9] bg-gray-100">
              {share.thumbnailUrl ? (
                <img src={share.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm text-gray-900 truncate">{previewTitle}</p>
              {previewDate && <p className="text-xs text-gray-500">{previewDate}</p>}
              <p className="text-xs text-primary truncate">{shareUrl.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>
        </div>
      </section>

      <ThumbnailUpdater thumbnailUrl={share.thumbnailUrl} onUpdated={onThumbUpdated} />

      <section className="space-y-3">
        <h4 className="text-xs font-medium text-gray-700">텍스트 구성</h4>
        <Input
          label="제목"
          value={share.linkShareTitle ?? fallbackTitle}
          onChange={(v) => setShare({ linkShareTitle: v })}
          placeholder="URL 썸네일 제목을 입력하세요"
        />
        <Input
          label="문구"
          value={share.linkShareText ?? (previewDate || '')}
          onChange={(v) => setShare({ linkShareText: v })}
          placeholder="URL 썸네일 문구를 입력하세요."
        />
      </section>

      <section className="space-y-2 border-t border-gray-100 pt-4">
        <h4 className="text-xs font-medium text-gray-700">초대장 링크</h4>
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-3 rounded-xl text-xs font-medium border transition-colors ${
              copied ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors"
        >
          <ExternalLink size={12} />
          새 창에서 열기
        </a>
      </section>
    </div>
  )
}

function SharePanel() {
  const { invitationId, content, share, setShare, categorySlug } = useEditorStore()
  const fallbackTitle = useMemo(() => buildFallbackTitle({
    content,
    categorySlug,
    invitationTitle: '초대합니다',
  }), [content, categorySlug])
  const previewTitle = share.kakaoShareTitle ?? fallbackTitle
  const previewText = share.kakaoShareText ?? formatEventDateText(content.eventDate, content.eventTime)
  const previewExtra = share.kakaoShareExtra ?? (buildFallbackVenueText(content) ?? '')

  const onThumbUpdated = useCallback(async (url: string) => {
    setShare({ thumbnailUrl: url })
    if (invitationId) {
      try {
        await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thumbnailUrl: url }),
        })
      } catch {
        // 다음 자동저장 때 다시 시도됨
      }
    }
  }, [invitationId, setShare])

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <MessageCircleMore size={16} className="text-gray-700" />
        <h3 className="text-sm font-medium text-gray-900">카카오톡 공유 설정</h3>
      </div>

      <PublishToggle />

      <section className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700">미리보기</h4>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex justify-center">
          <div className="w-56 rounded-lg overflow-hidden border border-gray-100 bg-white">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {share.thumbnailUrl ? (
                <img src={share.thumbnailUrl} alt="" className="w-full h-full object-contain" />
              ) : null}
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-sm text-gray-900 truncate">{previewTitle}</p>
              {previewText && <p className="text-xs text-gray-500">{previewText}</p>}
              {previewExtra && <p className="text-xs text-gray-500 truncate">{previewExtra}</p>}
              <button className="mt-2 w-full py-2 rounded-md text-xs border border-gray-200 text-gray-700">
                청첩장 보기
              </button>
              <div className="mt-1 flex items-center justify-between gap-2 px-1 py-2 border-t border-gray-100 text-xs text-gray-400">
                <span className="truncate">OpenDay</span>
                <ChevronUp size={12} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ThumbnailUpdater thumbnailUrl={share.thumbnailUrl} onUpdated={onThumbUpdated} />

      <section className="space-y-3">
        <h4 className="text-xs font-medium text-gray-700">텍스트 구성</h4>
        <Input
          label="제목"
          value={share.kakaoShareTitle ?? fallbackTitle}
          onChange={(v) => setShare({ kakaoShareTitle: v })}
          placeholder="카카오톡 공유 제목을 입력하세요."
        />
        <Input
          label="문구"
          value={share.kakaoShareText ?? (previewText || '')}
          onChange={(v) => setShare({ kakaoShareText: v })}
          placeholder="0000.00.00. 토요일, 오전 00시 00분"
        />
        <Input
          label="추가 문구"
          value={share.kakaoShareExtra ?? (previewExtra || '')}
          onChange={(v) => setShare({ kakaoShareExtra: v })}
          placeholder="OOO예식장 1F, OOO홀"
        />
      </section>
    </div>
  )
}

function OrderPanel() {
  const { modules, reorderModules } = useEditorStore()
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const sorted = useMemo(() => [...modules].sort((a, b) => a.order - b.order), [modules])

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === i) { setDragOver(i); return }
    const next = [...sorted]
    const [item] = next.splice(from, 1)
    next.splice(i, 0, item)
    reorderModules(next.map((m, idx) => ({ ...m, order: idx + 1 })))
    dragIndex.current = i
    setDragOver(i)
  }

  return (
    <div className="p-5">
      <SectionHeader title="순서 변경" />
      <div className="space-y-1.5">
        {sorted.map((module, i) => (
          <div
            key={module.id}
            draggable
            onDragStart={() => { dragIndex.current = i; setDragOver(i) }}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={() => { dragIndex.current = null; setDragOver(null) }}
            onDrop={(e) => { e.preventDefault(); dragIndex.current = null; setDragOver(null) }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs cursor-grab active:cursor-grabbing transition-colors ${
              dragOver === i ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-gray-600">
              {LABELS[module.type] ?? module.type}
            </span>
            <GripVertical size={14} className="text-gray-300" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400 flex items-start gap-1">
        <span>①</span>항목을 드래그하여 순서를 변경할 수 있습니다.
      </p>
    </div>
  )
}

function RequiredDatetimePanel() {
  const { content, setContent } = useEditorStore()
  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="예식 일시" />
      <Input label="날짜" type="date" value={content.eventDate ?? ''} onChange={(v) => setContent({ eventDate: v })} />
      <Input label="시간" value={content.eventTime ?? ''} onChange={(v) => setContent({ eventTime: v })} placeholder="예: 낮 12시 00분" />
    </div>
  )
}

function RequiredVenuePanel() {
  const { content, setContent } = useEditorStore()
  const v = content.venue
  function update(patch: { name?: string; hall?: string; address?: string; lat?: number; lng?: number }) {
    setContent({ venue: { name: v?.name ?? '', address: v?.address ?? '', ...v, ...patch } })
  }
  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="예식 장소" />
      <Input label="장소명" value={v?.name ?? ''} onChange={(val) => update({ name: val })} placeholder="서울 그랜드 웨딩홀" />
      <Input label="홀명"   value={v?.hall ?? ''} onChange={(val) => update({ hall: val })} placeholder="2층 그레이스홀" />
      <Input label="주소"   value={v?.address ?? ''} onChange={(val) => update({ address: val })} placeholder="서울특별시 강남구 테헤란로 123" />
    </div>
  )
}

function RequiredDatetimeVenuePanel() {
  const { content, setContent } = useEditorStore()
  const v = content.venue
  function update(patch: { name?: string; hall?: string; address?: string; lat?: number; lng?: number }) {
    setContent({ venue: { name: v?.name ?? '', address: v?.address ?? '', ...v, ...patch } })
  }
  return (
    <div className="p-5 space-y-4">
      <SectionHeader title="일시 장소" />
      <Input label="날짜" type="date" value={content.eventDate ?? ''} onChange={(val) => setContent({ eventDate: val })} />
      <Input label="시간" value={content.eventTime ?? ''} onChange={(val) => setContent({ eventTime: val })} placeholder="예: 낮 12시 00분" />
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-medium text-gray-500">예식 장소</p>
        <Input label="장소명" value={v?.name ?? ''} onChange={(val) => update({ name: val })} placeholder="서울 그랜드 웨딩홀" />
        <Input label="홀명"   value={v?.hall ?? ''} onChange={(val) => update({ hall: val })} placeholder="2층 그레이스홀" />
        <Input label="주소"   value={v?.address ?? ''} onChange={(val) => update({ address: val })} placeholder="서울특별시 강남구 테헤란로 123" />
      </div>
    </div>
  )
}

// ── 메인 화면 패널 ────────────────────────────────────────────────────────────
// variant 그리드 + variant.inputs에 따른 입력 필드. main 모듈이 없으면 자동 생성.
function MainScreenPanel() {
  const { content, setContent, modules, addModule, updateModule, categorySlug } = useEditorStore()
  const mainMod = useMemo(() => modules.find(m => m.type === 'main'), [modules])

  // main 모듈이 없으면 자동 생성 — 항상 가장 작은 order로 첫번째 자리 보장
  useEffect(() => {
    if (mainMod) return
    const minOrder = modules.length === 0 ? 1 : Math.min(...modules.map(m => m.order)) - 1
    addModule({
      id: nanoid(),
      type: 'main',
      order: minOrder,
      required: true,
      config: { variant: 'classic' },
    })
  }, [mainMod, modules, addModule])

  const variants = useMemo(() => getVariantsForCategory(categorySlug), [categorySlug])
  const cfg = (mainMod?.config ?? {}) as Record<string, unknown>
  const currentVariantId = (cfg.variant as string | undefined) ?? 'classic'
  const variant = findVariant(currentVariantId) ?? variants[0]

  function selectVariant(v: MainScreenVariant) {
    if (!mainMod) return
    updateModule(mainMod.id, {
      variant: v.id,
      ...(v.defaultConfig ?? {}),
      textSlots: hydrateTextSlots(v, content),
    })
  }
  function saveConfig(patch: Record<string, unknown>) {
    if (mainMod) updateModule(mainMod.id, patch)
  }

  // legacy 데이터 보강 — variant 의 textSlots 중 현재 cfg 에 비어있는 것을 content 기반으로 채움
  useEffect(() => {
    if (!mainMod || !variant?.textSlots?.length) return
    const slots = (cfg.textSlots as Record<string, string> | undefined) ?? {}
    const need = variant.textSlots.filter(s => !slots[s.key])
    if (need.length === 0) return
    const filled: Record<string, string> = { ...slots }
    for (const s of need) filled[s.key] = s.getDefault(content as never)
    updateModule(mainMod.id, { textSlots: filled })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant?.id, mainMod?.id])

  if (!mainMod) return <PendingPanel title="메인 화면" />

  const inputs = variant.inputs
  const has = (k: string) => inputs.includes(k as never)

  return (
    <div className="p-5 space-y-5">
      <SectionHeader title="메인 화면" />

      {/* 변형 선택 그리드 */}
      <div className="border border-gray-100 rounded-xl p-3">
        <p className="text-xs font-medium text-gray-700 mb-3">메인 타입</p>
        <div className="grid grid-cols-3 gap-2.5">
          {variants.map((v) => {
            const selected = v.id === currentVariantId
            const Thumb = v.Thumbnail
            return (
              <button
                key={v.id}
                onClick={() => selectVariant(v)}
                className={`relative rounded-lg border p-2 transition-colors text-left ${selected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <div className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-sm border flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                  {selected && <Check size={10} strokeWidth={3} className="text-white" />}
                </div>
                <div className="bg-gray-50 rounded p-1.5 overflow-hidden">
                  <Thumb />
                </div>
                <p className="text-[10px] text-gray-600 text-center mt-1.5 truncate">{v.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 사진 영역 */}
      {has('coverImage') && (
        <ImageUploader
          label="메인 사진"
          value={content.coverImage ?? ''}
          onChange={(v) => setContent({ coverImage: v })}
          crop={content.coverImageCrop}
          onCropChange={(c) => setContent({ coverImageCrop: c })}
          fallbackAspect="4/5"
        />
      )}
      {has('secondImage') && (
        <ImageUploader
          label="두 번째 사진"
          value={(cfg.secondImage as string | undefined) ?? ''}
          onChange={(v) => saveConfig({ secondImage: v })}
          crop={cfg.secondImageCrop as ImageCropData | undefined}
          onCropChange={(c) => saveConfig({ secondImageCrop: c })}
          fallbackAspect="4/3"
        />
      )}
      {/* 문구 수정 — variant.textSlots 가시 순서대로 라벨 없는 단순 인풋만 노출 */}
      {variant.textSlots && variant.textSlots.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-3 space-y-2.5">
          <p className="text-xs font-medium text-gray-700 mb-1">문구 수정</p>
          {variant.textSlots.map((slot) => {
            const slots = (cfg.textSlots as Record<string, string> | undefined) ?? {}
            const onChange = (val: string) => saveConfig({ textSlots: { ...slots, [slot.key]: val } })
            const value = slots[slot.key] ?? slot.getDefault(content)
            return slot.multiline ? (
              <Textarea key={slot.key} value={value} onChange={onChange} rows={2} />
            ) : (
              <Input key={slot.key} value={value} onChange={onChange} />
            )
          })}
        </div>
      )}

      {/* 사진 모양 (photoShape) */}
      {has('photoShape') && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-700 mb-2.5">사진 모양</p>
          <div className="grid grid-cols-3 gap-2">
            {PHOTO_SHAPES.map(({ id, label }) => {
              const selected = ((cfg.photoShape as PhotoShapeId | undefined) ?? variant.defaultConfig?.photoShape) === id
              return (
                <button
                  key={id}
                  onClick={() => saveConfig({ photoShape: id })}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <PhotoShapeIcon shape={id} color={selected ? '#bf8362' : '#9ca3af'} />
                  <span className="text-[10px] text-gray-600">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 프레임 스타일 (frameStyle) */}
      {has('frameStyle') && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-700 mb-2.5">프레임</p>
          <div className="grid grid-cols-3 gap-2">
            {FRAME_STYLES.map(({ id, label }) => {
              const selected = ((cfg.frameStyle as FrameStyleId | undefined) ?? variant.defaultConfig?.frameStyle ?? 'none') === id
              return (
                <button
                  key={id}
                  onClick={() => saveConfig({ frameStyle: id })}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <FrameIcon id={id} color={selected ? '#bf8362' : '#9ca3af'} />
                  <span className="text-[10px] text-gray-600">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 데코레이션 (decorations[], multi-toggle) */}
      {has('decorations') && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-700 mb-2.5">데코레이션</p>
          <div className="flex flex-wrap gap-2">
            {DECORATIONS.map(({ id, label }) => {
              const current = (cfg.decorations as DecorationId[] | undefined) ?? (variant.defaultConfig?.decorations as DecorationId[] | undefined) ?? []
              const selected = current.includes(id)
              const toggle = () => {
                const next = selected ? current.filter(x => x !== id) : [...current, id]
                saveConfig({ decorations: next })
              }
              return (
                <button
                  key={id}
                  onClick={toggle}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${selected ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                >
                  <DecorationIcon id={id} color={selected ? '#bf8362' : '#9ca3af'} />
                  <span className="text-[11px]">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 배경 패턴 (backgroundPattern) */}
      {has('backgroundPattern') && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-700 mb-2.5">배경</p>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUND_PATTERNS.map(({ id, label }) => {
              const selected = ((cfg.backgroundPattern as BackgroundPatternId | undefined) ?? variant.defaultConfig?.backgroundPattern ?? 'none') === id
              return (
                <button
                  key={id}
                  onClick={() => saveConfig({ backgroundPattern: id })}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <BackgroundPatternIcon id={id} color={selected ? '#bf8362' : '#9ca3af'} />
                  <span className="text-[10px] text-gray-600">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 사진 회전 (photoTilt) */}
      {has('photoTilt') && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">사진 기울기</span>
            <span className="text-[11px] text-gray-500">{(cfg.photoTilt as number | undefined) ?? variant.defaultConfig?.photoTilt ?? 0}°</span>
          </div>
          <input
            type="range"
            min={-8}
            max={8}
            step={1}
            value={(cfg.photoTilt as number | undefined) ?? variant.defaultConfig?.photoTilt ?? 0}
            onChange={(e) => saveConfig({ photoTilt: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

function PendingPanel({ title }: { title: string }) {
  return (
    <div className="p-5">
      <SectionHeader title={title} />
      <p className="text-xs text-gray-400">준비 중입니다</p>
    </div>
  )
}

// ── 라우터 ────────────────────────────────────────────────────────────────────
function findInfoItemPanelType(navGroups: NavGroup[], section: string): string | undefined {
  const requiredGroup = navGroups.find(g => g.id === 'required')
  return requiredGroup?.modules?.find(m => m.id === section)?.panelType
}

export default function ModulePanel({ section, navGroups }: Props) {
  // 정보 그룹 항목은 templateConfig.info.items[].panelType으로 라우팅한다.
  // 같은 'required-host' id라도 청첩장은 'wedding-host', 돌잔치는 'baby-host'.
  const infoPanelType = findInfoItemPanelType(navGroups, section)
  if (infoPanelType === 'wedding-host')   return <HojuPanel />
  if (infoPanelType === 'baby-host')      return <BabyHostPanel />
  if (infoPanelType === 'datetime-venue') return <RequiredDatetimeVenuePanel />
  if (infoPanelType === 'datetime')       return <RequiredDatetimePanel />
  if (infoPanelType === 'venue')          return <RequiredVenuePanel />
  if (section === 'settings')      return <SettingsPanel />
  if (section === 'theme')         return <ThemePanel />
  if (section === 'main_screen')   return <MainScreenPanel />
  if (section === 'basic')         return <BasicPanel />
  if (section === 'photo_frame')   return <PhotoFramePanel />
  if (section === 'couple_names')  return <CoupleNamesPanel />
  if (section === 'nickname')      return <NicknamePanel />
  if (section === 'contact')       return <ContactPanel />
  if (section === 'greeting')      return <GreetingPanel />
  if (section === 'profile')       return <ProfilePanel />
  if (section === 'solo_profile')  return <SoloProfilePanel />
  if (section === 'timeline')          return <TimelinePanel />
  if (section === 'timeline_polaroid') return <TimelinePolaroidPanel />
  if (section === 'interview')     return <InterviewPanel />
  if (section === 'midphoto')      return <MidphotoPanel />
  if (section === 'datetime')      return <DatetimePanel />
  if (section === 'venue')         return <VenuePanel />
  if (section === 'tab')           return <TabPanel />
  if (section === 'slide')         return <SlidePanel />
  if (section === 'gallery')       return <GalleryPanel />
  if (section === 'guestbook')     return <GuestbookPanel />
  if (section === 'guestalbum')    return <GuestAlbumPanel />
  if (section === 'account')       return <AccountPanel />
  if (section === 'rsvp')          return <RsvpPanel />
  if (section === 'dday')          return <DdayPanel />
  if (section === 'video')         return <VideoPanel />
  if (section === 'ending')        return <EndingPanel />
  if (section === 'linkshare') return <LinkSharePanel />
  if (section === 'share' || section === 'kakaoshare') return <SharePanel />
  if (section === 'order')         return <OrderPanel />
  return <PendingPanel title={LABELS[section] ?? section} />
}

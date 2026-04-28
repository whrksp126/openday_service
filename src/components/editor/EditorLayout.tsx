'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import SideNav from './SideNav'
import ModulePanel from './ModulePanel'
import GroupPanel from './GroupPanel'
import PreviewPane from './PreviewPane'
import { useEditorStore } from '@/store/editor'
import { buildNavGroups, findParentGroup, getGroupIds } from './nav-config'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft, ArrowUpDown, X, GripVertical, Pencil, Trash2, LayoutGrid } from 'lucide-react'
import type { ModuleType } from '@/types/invitation'

interface Props {
  invitationId: string | null
  templateId: string | null
}

// moduleType → icon 맵 (공통 모듈만 — info 그룹은 모듈 카탈로그가 아님)
const MODULE_ICON_MAP: Partial<Record<ModuleType | string, LucideIcon>> = (() => {
  const map: Partial<Record<ModuleType | string, LucideIcon>> = {}
  // info 그룹은 비워둬도 됨: 어차피 panelType 기반이라 사용처에서 라벨 fallback
  for (const group of buildNavGroups(null)) {
    for (const m of group.modules ?? []) {
      if (m.moduleType) map[m.moduleType] = m.icon
    }
  }
  // main 모듈은 main_screen solo 그룹이라 nav 모듈 목록에 없음 — 별도 등록
  if (!map.main) map.main = LayoutGrid
  return map
})()

const LABELS: Record<string, string> = {
  main: '메인 화면', photo_frame: '액자',
  couple_names: '주인공', greeting: '인사말',
  nickname: '세례명·닉네임', contact: '연락처',
  profile: '가로형 프로필', solo_profile: '세로형 프로필',
  timeline: '타임라인', timeline_polaroid: '폴라로이드', interview: '인터뷰', midphoto: '단독',
  datetime: '달력 표현', venue: '지도', tab: '탭', slide: '슬라이드',
  gallery: '갤러리', guestbook: '방명록',
  account: '계좌 정보', rsvp: 'RSVP', dday: 'D+Day',
  video: '동영상', guestalbum: '하객 앨범', ending: '엔딩 사진',
  bgm: '배경음악', share: '공유하기',
}

interface OrderFloatingProps {
  previewScrollRef: React.RefObject<HTMLDivElement | null>
  onEditModule: (navId: string, moduleId: string) => void
}

function OrderFloating({ previewScrollRef, onEditModule }: OrderFloatingProps) {
  const [open, setOpen] = useState(false)
  const { modules, reorderModules, removeModule } = useEditorStore()
  const dragIndex = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // 메인 화면(main) 모듈도 목록에 표시하되 항상 첫번째 — 드래그/삭제 컨트롤만 숨김
  const sorted = useMemo(() => [...modules].sort((a, b) => a.order - b.order), [modules])

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === i) { setDragOver(i); return }
    // main 모듈은 자기 위치에서 이동 불가 + 다른 모듈이 main 위로 이동 불가
    if (sorted[from]?.type === 'main' || sorted[i]?.type === 'main') return
    const next = [...sorted]
    const [item] = next.splice(from, 1)
    next.splice(i, 0, item)
    reorderModules(next.map((m, idx) => ({ ...m, order: idx + 1 })))
    dragIndex.current = i
    setDragOver(i)
  }

  function scrollToModule(moduleId: string) {
    if (!previewScrollRef.current) return
    const el = previewScrollRef.current.querySelector(`[data-module-id="${moduleId}"]`) as HTMLElement | null
    if (el) {
      previewScrollRef.current.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' })
    }
  }

  // nav item id = moduleType (they match in nav-config). main은 별도 main_screen 그룹으로.
  function getNavId(moduleType: string): string {
    if (moduleType === 'main') return 'main_screen'
    return moduleType
  }

  return (
    <>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-colors"
          title="순서 변경"
        >
          <ArrowUpDown size={16} className="text-gray-500" />
        </button>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl w-64 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80">
            <span className="text-xs font-semibold text-gray-700">순서 변경</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="py-1.5 max-h-80 overflow-y-auto">
            {sorted.map((module, i) => {
              const Icon = MODULE_ICON_MAP[module.type]
              const isLocked = module.type === 'main'
              return (
                <div
                  key={module.id}
                  draggable={!isLocked}
                  onDragStart={isLocked ? undefined : () => { dragIndex.current = i; setDragOver(i) }}
                  onDragOver={isLocked ? undefined : (e) => handleDragOver(e, i)}
                  onDrop={isLocked ? undefined : (e) => { e.preventDefault(); dragIndex.current = null; setDragOver(null) }}
                  onDragEnd={isLocked ? undefined : () => { dragIndex.current = null; setDragOver(null) }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                  } ${dragOver === i ? 'bg-primary/5' : 'hover:bg-gray-50/80'}`}
                >
                  {/* 이동 핸들 (main은 비표시) */}
                  {isLocked
                    ? <span className="w-[13px] flex-shrink-0" aria-hidden />
                    : <GripVertical size={13} className="text-gray-300 flex-shrink-0" />
                  }
                  {/* 모듈 아이콘 */}
                  {Icon && <Icon size={13} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />}
                  {/* 레이블 */}
                  <button
                    onClick={() => {
                      scrollToModule(module.id)
                      onEditModule(getNavId(module.type), module.id)
                      setOpen(false)
                    }}
                    className="flex-1 text-left truncate"
                  >
                    <span className="text-gray-600">
                      {LABELS[module.type] ?? module.type}
                    </span>
                  </button>
                  {/* 편집 */}
                  <button
                    onClick={() => { onEditModule(getNavId(module.type), module.id); setOpen(false) }}
                    className="p-1 rounded text-gray-300 hover:text-primary hover:bg-primary/5 transition-colors flex-shrink-0"
                    title="편집"
                  >
                    <Pencil size={11} />
                  </button>
                  {/* 삭제 (main은 항상 비표시) */}
                  {!isLocked && !module.required && (
                    <button
                      onClick={() => removeModule(module.id)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      title="삭제"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="px-4 py-2.5 text-[10px] text-gray-400 border-t border-gray-100/80">
            드래그하여 순서를 변경하세요
          </p>
        </div>
      )}
    </>
  )
}

export default function EditorLayout({ invitationId, templateId }: Props) {
  const {
    isDirty, isSaving, isCreating, lastSavedAt, saveError,
    setIsSaving, setIsCreating, setLastSavedAt, setSaveError,
    markClean, content, modules, styles, templateConfig,
    activeNav, setActiveNav, setEditingModuleId,
  } = useEditorStore()
  const navGroups = useMemo(() => buildNavGroups(templateConfig?.info ?? null), [templateConfig])
  const groupIds = useMemo(() => getGroupIds(navGroups), [navGroups])
  const panelRef = useRef<HTMLDivElement>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const createdRef = useRef(false)

  // 기존 invitation 로드 (router.replace로 새 id에 도착한 경우 isCreating도 해제)
  useEffect(() => {
    if (!invitationId) return
    setIsCreating(false)
    fetch(`/api/invitations/${invitationId}`)
      .then((r) => r.json())
      .then((data) => {
        const { setContent, reorderModules, setStyles, setSlug, setIsPublished, setInvitationId, setTemplateConfig, setCategorySlug, setShare } = useEditorStore.getState()
        setInvitationId(invitationId)
        setSlug(data.slug ?? null)
        setIsPublished(Boolean(data.isPublished))
        setContent(data.contentJson ?? {})
        setShare({
          thumbnailUrl: data.thumbnailUrl ?? null,
          linkShareTitle: data.linkShareTitle ?? null,
          linkShareText: data.linkShareText ?? null,
          kakaoShareTitle: data.kakaoShareTitle ?? null,
          kakaoShareText: data.kakaoShareText ?? null,
          kakaoShareExtra: data.kakaoShareExtra ?? null,
        })

        // 마이그레이션: 기존 modulesJson 안의 'bgm' 모듈을 styles.bgm으로 이전.
        // styles.bgm이 이미 있으면 그쪽이 우선. 다음 사용자 편집 때 자연스럽게 저장된다.
        const rawModules = (data.modulesJson ?? []) as Array<{ type?: string; config?: Record<string, unknown> }>
        const legacyBgm = rawModules.find((m) => m?.type === 'bgm')
        const cleanedModules = rawModules.filter((m) => m?.type !== 'bgm')
        const stylesNext = { ...(data.styles ?? {}) }
        if (legacyBgm && !stylesNext.bgm) {
          const cfg = (legacyBgm.config ?? {}) as Record<string, unknown>
          // autoplay 필드는 더 이상 사용하지 않음 (항상 자동재생)
          const { autoplay: _autoplay, ...rest } = cfg
          void _autoplay
          stylesNext.bgm = rest
        }
        // 마이그레이션: profile/solo_profile 모듈의 legacy 키들을 persons[] 배열로 변환.
        // persons 안의 birthDate(legacy) → title 도 함께 정리.
        function migratePersonItems(arr: unknown): unknown[] {
          if (!Array.isArray(arr)) return []
          return arr.map((p) => {
            if (!p || typeof p !== 'object') return p
            const obj = p as Record<string, unknown>
            if (obj.birthDate != null && obj.title == null) {
              const { birthDate, ...rest } = obj
              return { ...rest, title: birthDate }
            }
            return obj
          })
        }
        const migratedModules = cleanedModules.map((m) => {
          if (m?.type === 'profile') {
            const cfg = (m.config ?? {}) as Record<string, unknown>
            if (Array.isArray(cfg.persons)) {
              return { ...m, config: { ...cfg, persons: migratePersonItems(cfg.persons) } }
            }
            const hasLegacy = cfg.person1Image || cfg.person1Label || cfg.person1Story
              || cfg.person2Image || cfg.person2Label || cfg.person2Story
              || cfg.groomImage || cfg.groomRoleLabel || cfg.groomStory
              || cfg.brideImage || cfg.brideRoleLabel || cfg.brideStory
            if (!hasLegacy) return m
            const persons = [
              {
                image: cfg.person1Image ?? cfg.groomImage,
                imageCrop: cfg.person1ImageCrop ?? cfg.groomImageCrop,
                name: cfg.person1Label ?? cfg.groomRoleLabel,
                description: cfg.person1Story ?? cfg.groomStory,
                descriptionVisible: cfg.person1StoryVisible ?? cfg.groomStoryVisible,
              },
              {
                image: cfg.person2Image ?? cfg.brideImage,
                imageCrop: cfg.person2ImageCrop ?? cfg.brideImageCrop,
                name: cfg.person2Label ?? cfg.brideRoleLabel,
                description: cfg.person2Story ?? cfg.brideStory,
                descriptionVisible: cfg.person2StoryVisible ?? cfg.brideStoryVisible,
              },
            ]
            const cleanedKeys = [
              'person1Image', 'person1ImageCrop', 'person1Label', 'person1Story', 'person1StoryVisible',
              'person2Image', 'person2ImageCrop', 'person2Label', 'person2Story', 'person2StoryVisible',
              'groomImage', 'groomImageCrop', 'groomRoleLabel', 'groomStory', 'groomStoryVisible',
              'brideImage', 'brideImageCrop', 'brideRoleLabel', 'brideStory', 'brideStoryVisible',
            ]
            const next: Record<string, unknown> = { ...cfg, persons }
            for (const k of cleanedKeys) delete next[k]
            return { ...m, config: next }
          }
          if (m?.type === 'solo_profile') {
            const cfg = (m.config ?? {}) as Record<string, unknown>
            if (Array.isArray(cfg.persons)) {
              return { ...m, config: { ...cfg, persons: migratePersonItems(cfg.persons) } }
            }
            const hasLegacy = cfg.image || cfg.personName || cfg.birthDate || cfg.hashtags || cfg.description
            if (!hasLegacy) return m
            const persons = [{
              image: cfg.image,
              imageCrop: cfg.imageCrop,
              name: cfg.personName,
              title: cfg.birthDate,
              hashtags: cfg.hashtags,
              description: cfg.description,
              descriptionVisible: cfg.descriptionVisible,
            }]
            const cleanedKeys = ['image', 'imageCrop', 'personName', 'birthDate', 'hashtags', 'description', 'descriptionVisible']
            const next: Record<string, unknown> = { ...cfg, persons }
            for (const k of cleanedKeys) delete next[k]
            return { ...m, config: next }
          }
          return m
        })
        reorderModules(migratedModules as never)
        setStyles(stylesNext)
        setTemplateConfig(data.templateConfigJson ?? null)
        setCategorySlug(data.categorySlug ?? null)
        markClean()
      })
  }, [invitationId, markClean, setIsCreating])

  // 템플릿으로 진입한 경우: 사용자 소유 invitation을 즉시 생성하고 새 id로 replace
  useEffect(() => {
    if (invitationId || !templateId || createdRef.current) return
    createdRef.current = true
    setIsCreating(true)
    fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('create failed'))))
      .then((inv) => {
        router.replace(`/editor/${inv.id}`)
      })
      .catch(() => {
        createdRef.current = false
        setIsCreating(false)
        setSaveError('초대장을 만들 수 없습니다. 다시 시도해주세요.')
        router.replace(`/templates/${templateId}`)
      })
  }, [invitationId, templateId, router, setIsCreating, setSaveError])

  // 저장 실행 (자동저장과 단축키가 공유)
  const saveNow = useCallback(async () => {
    const state = useEditorStore.getState()
    if (!state.invitationId || state.isSaving || state.isCreating) return
    if (!state.isDirty && !saveError) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const r = await fetch(`/api/invitations/${state.invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentJson: state.content,
          modulesJson: state.modules,
          styles: state.styles,
          thumbnailUrl: state.share.thumbnailUrl,
          linkShareTitle: state.share.linkShareTitle,
          linkShareText: state.share.linkShareText,
          kakaoShareTitle: state.share.kakaoShareTitle,
          kakaoShareText: state.share.kakaoShareText,
          kakaoShareExtra: state.share.kakaoShareExtra,
        }),
      })
      if (!r.ok) throw new Error('save failed')
      markClean()
      setLastSavedAt(Date.now())
    } catch {
      setSaveError('저장 실패')
    } finally {
      setIsSaving(false)
    }
  }, [setIsSaving, setSaveError, markClean, setLastSavedAt, saveError])

  // 디바운스 자동저장: 변경 후 1초 입력이 없으면 PUT
  useEffect(() => {
    if (!invitationId || !isDirty || isSaving || isCreating) return
    const t = setTimeout(() => { saveNow() }, 1000)
    return () => clearTimeout(t)
  }, [content, modules, styles, isDirty, isSaving, isCreating, invitationId, saveNow])

  // 미저장 변경 있을 때 페이지 이탈 경고
  useEffect(() => {
    if (!isDirty && !isSaving) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, isSaving])

  // Cmd/Ctrl+S로 즉시 flush
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveNow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveNow])

  function handleNavChange(id: string, moduleId?: string) {
    setActiveNav(id)
    setEditingModuleId(moduleId ?? null)
    if (panelRef.current) panelRef.current.scrollTop = 0
    if (moduleId) {
      setTimeout(() => {
        if (!previewScrollRef.current) return
        const el = previewScrollRef.current.querySelector(`[data-module-id="${moduleId}"]`) as HTMLElement | null
        if (el) previewScrollRef.current.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' })
      }, 300)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
        <Link href="/my" className="text-primary font-bold text-base tracking-tight">
          OpenDay
        </Link>
        <div className="flex items-center gap-3">
          <SaveStatus
            isCreating={isCreating}
            isSaving={isSaving}
            isDirty={isDirty}
            saveError={saveError}
            lastSavedAt={lastSavedAt}
            onRetry={saveNow}
          />
          <Link href="/my" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
            돌아가기
          </Link>
        </div>
      </div>

      {isCreating ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          초대장 준비 중...
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: SideNav + Panel */}
          <div className="flex border-r border-gray-100 bg-white flex-shrink-0 h-full overflow-hidden">
            <SideNav active={activeNav} navGroups={navGroups} onChange={handleNavChange} />
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              ref={panelRef}
              className="w-80 overflow-y-auto h-full"
            >
              {groupIds.has(activeNav) ? (
                <GroupPanel groupId={activeNav} navGroups={navGroups} onSelectModule={handleNavChange} />
              ) : (
                <>
                  {findParentGroup(navGroups, activeNav) && (
                    <button
                      onClick={() => handleNavChange(findParentGroup(navGroups, activeNav)!)}
                      className="flex items-center gap-1 px-5 pt-4 pb-0 text-xs text-gray-400 hover:text-primary transition-colors"
                    >
                      <ChevronLeft size={14} />
                      뒤로
                    </button>
                  )}
                  <ModulePanel section={activeNav} navGroups={navGroups} />
                </>
              )}
            </motion.div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 relative bg-gray-200">
            <div className="absolute top-4 right-4 z-20">
              <OrderFloating
                previewScrollRef={previewScrollRef}
                onEditModule={handleNavChange}
              />
            </div>
            <div ref={previewScrollRef} className="h-full overflow-y-auto">
              <div className="flex justify-center py-8">
                <PreviewPane panelRef={panelRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface SaveStatusProps {
  isCreating: boolean
  isSaving: boolean
  isDirty: boolean
  saveError: string | null
  lastSavedAt: number | null
  onRetry: () => void
}

function SaveStatus({ isCreating, isSaving, isDirty, saveError, lastSavedAt, onRetry }: SaveStatusProps) {
  if (isCreating) return <span className="text-xs text-gray-400">초대장 준비 중...</span>
  if (isSaving) return <span className="text-xs text-gray-400">저장 중...</span>
  if (saveError) {
    return (
      <button onClick={onRetry} className="text-xs text-red-500 hover:text-red-600 transition-colors">
        저장 실패 · 다시 시도
      </button>
    )
  }
  if (isDirty) return <span className="text-xs text-gray-400">변경 사항 있음</span>
  if (lastSavedAt) return <span className="text-xs text-gray-400">저장됨</span>
  return null
}

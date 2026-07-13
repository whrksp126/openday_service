'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import SideNav from './SideNav'
import ModulePanel from './ModulePanel'
import GroupPanel from './GroupPanel'
import PreviewPane from './PreviewPane'
import BgmFloatingPlayer from './BgmFloatingPlayer'
import { useEditorStore } from '@/store/editor'
import { buildNavGroups, findParentGroup, getGroupIds } from './nav-config'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft, ArrowUpDown, X, GripVertical, Pencil, Trash2, LayoutGrid } from 'lucide-react'
import type { ModuleType } from '@/types/invitation'

interface Props {
  invitationId: string | null
  templateId: string | null
  // 'invitation' (default) = 사용자 초대장 편집(자동저장).
  // 'template' = 관리자 Template 편집(명시적 저장 버튼만, /api/templates PATCH).
  mode?: 'invitation' | 'template'
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
  video: '동영상', photo_share: '사진 공유', ending: '엔딩 사진',
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

export default function EditorLayout({ invitationId, templateId, mode = 'invitation' }: Props) {
  const {
    isDirty, isSaving, isCreating, lastSavedAt, saveError,
    setIsSaving, setIsCreating, setLastSavedAt, setSaveError,
    markClean, content, modules, styles, templateConfig,
    activeNav, setActiveNav, setEditingModuleId,
  } = useEditorStore()
  const isTemplateMode = mode === 'template'
  const navGroups = useMemo(() => buildNavGroups(templateConfig?.info ?? null, mode), [templateConfig, mode])
  const groupIds = useMemo(() => getGroupIds(navGroups), [navGroups])
  const panelRef = useRef<HTMLDivElement>(null)
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const createdRef = useRef(false)

  // 기존 invitation 로드 (router.replace로 새 id에 도착한 경우 isCreating도 해제)
  useEffect(() => {
    if (isTemplateMode) return
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

        reorderModules((data.modulesJson ?? []) as never)
        setStyles(data.styles ?? {})
        setTemplateConfig(data.templateConfigJson ?? null)
        setCategorySlug(data.categorySlug ?? null)
        markClean()
      })
  }, [isTemplateMode, invitationId, markClean, setIsCreating])

  // template 모드 로드: GET /api/templates/[id] → store 에 매핑.
  // Template 의 defaultContent/defaultModules/styles/infoConfig/themeConfig/thumbnail 을
  // store.content/modules/styles/templateConfig/share.thumbnailUrl 로 단방향 주입.
  useEffect(() => {
    if (!isTemplateMode || !templateId) return
    setIsCreating(false)
    fetch(`/api/templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        const {
          setContent, reorderModules, setStyles, setSlug, setIsPublished,
          setInvitationId, setTemplateId, setTemplateConfig, setCategorySlug, setShare,
        } = useEditorStore.getState()
        setInvitationId(null)
        setTemplateId(templateId)
        setSlug(null)
        setIsPublished(false)
        setContent(data.defaultContent ?? {})
        setShare({
          thumbnailUrl: data.thumbnail ?? null,
          linkShareTitle: null,
          linkShareText: null,
          kakaoShareTitle: null,
          kakaoShareText: null,
          kakaoShareExtra: null,
        })
        reorderModules((data.defaultModules ?? []) as never)
        setStyles(data.styles ?? {})
        setTemplateConfig({
          info: data.infoConfig ?? null,
          theme: data.themeConfig ?? null,
        })
        setCategorySlug(data.category?.slug ?? null)
        markClean()
      })
  }, [isTemplateMode, templateId, markClean, setIsCreating])

  // 템플릿으로 진입한 경우: 사용자 소유 invitation을 즉시 생성하고 새 id로 replace
  useEffect(() => {
    if (isTemplateMode) return
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
  }, [isTemplateMode, invitationId, templateId, router, setIsCreating, setSaveError])

  // 저장 실행 (자동저장·단축키·template 모드 저장 버튼이 공유)
  const saveNow = useCallback(async () => {
    const state = useEditorStore.getState()
    if (state.isSaving || state.isCreating) return
    if (!state.isDirty && !saveError) return
    const isTpl = state.mode === 'template'
    const targetId = isTpl ? state.templateId : state.invitationId
    if (!targetId) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const r = isTpl
        ? await fetch(`/api/templates/${targetId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              defaultContent: state.content,
              defaultModules: state.modules,
              styles: state.styles,
              infoConfig: state.templateConfig?.info ?? null,
              themeConfig: state.templateConfig?.theme ?? null,
              thumbnail: state.share.thumbnailUrl,
            }),
          })
        : await fetch(`/api/invitations/${targetId}`, {
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

  // 디바운스 자동저장: invitation 모드에서만 동작. template 모드는 명시적 버튼 + Cmd/Ctrl+S 만.
  useEffect(() => {
    if (isTemplateMode) return
    if (!invitationId || !isDirty || isSaving || isCreating) return
    const t = setTimeout(() => { saveNow() }, 1000)
    return () => clearTimeout(t)
  }, [content, modules, styles, isDirty, isSaving, isCreating, isTemplateMode, invitationId, saveNow])

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
        <Link
          href={isTemplateMode ? '/admin/templates' : '/my'}
          className="flex items-center gap-1 text-primary font-bold text-base tracking-tight hover:opacity-80 transition-opacity"
        >
          {isTemplateMode && <ChevronLeft size={16} className="text-primary" />}
          {isTemplateMode ? '관리자 · 템플릿 편집' : 'OpenDay'}
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
          {isTemplateMode && (
            <button
              onClick={saveNow}
              disabled={isSaving || (!isDirty && !saveError)}
              className="rounded-xl px-4 py-1.5 text-xs font-medium bg-[#5B4FCF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '저장 중...' : isDirty ? '저장하기' : '저장됨'}
            </button>
          )}
          <Link href={isTemplateMode ? '/admin/templates' : '/my'} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
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
                {/* BGM 플레이어는 PreviewPane 외부에 렌더한다. PreviewPane 이 어떤 이유로든
                    재마운트되더라도 BGM 버튼/오디오 자체는 유지되어 사용자가 정지한 상태가
                    이어지고, 같은 페이지 내에서 audio 인스턴스가 두 개 생기는 일을 막는다. */}
                <div className="relative w-[375px]">
                  {styles.bgm?.url && (
                    <BgmFloatingPlayer cfg={styles.bgm} mode="editor" />
                  )}
                  <PreviewPane panelRef={panelRef} />
                </div>
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

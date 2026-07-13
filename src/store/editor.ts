'use client'

import { create } from 'zustand'
import type { InvitationContent, InvitationModule, InvitationStyles } from '@/types/invitation'
import type { TemplateConfig } from '@/types/template'

export interface ShareMeta {
  thumbnailUrl: string | null
  linkShareTitle: string | null
  linkShareText: string | null
  kakaoShareTitle: string | null
  kakaoShareText: string | null
  kakaoShareExtra: string | null
}

// BGM 재생 의도. 'auto'는 첫 진입 자동재생 시도, 'paused'는 사용자가 명시적으로 정지한 상태.
// store에 두는 이유: PreviewPane이 그룹 전환 등으로 재마운트되어도 사용자 의도가 유지되어야 함.
export type BgmIntent = 'auto' | 'playing' | 'paused'

// 'invitation' = 일반 사용자가 자신의 초대장 편집(자동저장).
// 'template' = 관리자가 Template 의 기본값 편집(명시적 저장 버튼만, /api/templates PATCH).
// templateId 의미가 모드별로 다르다: invitation 모드에서는 "원본 템플릿 추적용",
// template 모드에서는 "현재 편집 중인 Template ID".
export type EditorMode = 'invitation' | 'template'

interface EditorState {
  mode: EditorMode
  invitationId: string | null
  templateId: string | null
  slug: string | null
  isPublished: boolean
  content: InvitationContent
  modules: InvitationModule[]
  styles: InvitationStyles
  templateConfig: TemplateConfig | null
  categorySlug: string | null
  share: ShareMeta
  isDirty: boolean
  isSaving: boolean
  isCreating: boolean
  lastSavedAt: number | null
  saveError: string | null
  activeNav: string
  activeSection: string | null
  editingModuleId: string | null
  bgmIntent: BgmIntent
  bgmCaptureMuted: boolean

  setMode: (mode: EditorMode) => void
  setInvitationId: (id: string | null) => void
  setTemplateId: (id: string | null) => void
  setSlug: (slug: string | null) => void
  setIsPublished: (published: boolean) => void
  setContent: (partial: Partial<InvitationContent>) => void
  setStyles: (partial: Partial<InvitationStyles>) => void
  setTemplateConfig: (config: TemplateConfig | null) => void
  setCategorySlug: (slug: string | null) => void
  setShare: (partial: Partial<ShareMeta>) => void
  addModule: (module: InvitationModule) => void
  removeModule: (id: string) => void
  updateModule: (id: string, config: Record<string, unknown>) => void
  reorderModules: (modules: InvitationModule[]) => void
  setActiveNav: (nav: string) => void
  setActiveSection: (section: string | null) => void
  setEditingModuleId: (id: string | null) => void
  setIsSaving: (saving: boolean) => void
  setIsCreating: (creating: boolean) => void
  setLastSavedAt: (ts: number | null) => void
  setSaveError: (msg: string | null) => void
  setBgmIntent: (intent: BgmIntent) => void
  setBgmCaptureMuted: (muted: boolean) => void
  markClean: () => void
}

const EMPTY_SHARE: ShareMeta = {
  thumbnailUrl: null,
  linkShareTitle: null,
  linkShareText: null,
  kakaoShareTitle: null,
  kakaoShareText: null,
  kakaoShareExtra: null,
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: 'invitation',
  invitationId: null,
  templateId: null,
  slug: null,
  isPublished: false,
  content: {},
  modules: [],
  styles: {},
  templateConfig: null,
  categorySlug: null,
  share: { ...EMPTY_SHARE },
  isDirty: false,
  isSaving: false,
  isCreating: false,
  lastSavedAt: null,
  saveError: null,
  activeNav: 'settings',
  activeSection: null,
  editingModuleId: null,
  bgmIntent: 'auto',
  bgmCaptureMuted: false,

  setMode: (mode) => set({ mode }),
  setInvitationId: (id) => set({ invitationId: id }),
  setTemplateId: (id) => set({ templateId: id }),
  setSlug: (slug) => set({ slug }),
  setIsPublished: (published) => set({ isPublished: published }),

  setContent: (partial) =>
    set((state) => ({
      content: { ...state.content, ...partial },
      isDirty: true,
    })),

  setStyles: (partial) =>
    set((state) => ({
      styles: { ...state.styles, ...partial },
      isDirty: true,
    })),

  setTemplateConfig: (config) => set({ templateConfig: config }),
  setCategorySlug: (slug) => set({ categorySlug: slug }),

  setShare: (partial) =>
    set((state) => ({
      share: { ...state.share, ...partial },
      isDirty: true,
    })),

  addModule: (module) =>
    set((state) => ({
      modules: [...state.modules, module],
      isDirty: true,
    })),

  removeModule: (id) =>
    set((state) => ({
      modules: state.modules.filter((m) => m.id !== id),
      isDirty: true,
    })),

  updateModule: (id, config) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, config: { ...m.config, ...config } } : m
      ),
      isDirty: true,
    })),

  reorderModules: (modules) => set({ modules, isDirty: true }),

  setActiveNav: (nav) => set({ activeNav: nav }),
  setActiveSection: (section) => set({ activeSection: section }),
  setEditingModuleId: (id) => set({ editingModuleId: id }),

  setIsSaving: (saving) => set({ isSaving: saving }),
  setIsCreating: (creating) => set({ isCreating: creating }),
  setLastSavedAt: (ts) => set({ lastSavedAt: ts }),
  setSaveError: (msg) => set({ saveError: msg }),

  setBgmIntent: (intent) => set({ bgmIntent: intent }),
  setBgmCaptureMuted: (muted) => set({ bgmCaptureMuted: muted }),

  markClean: () => set({ isDirty: false, saveError: null }),
}))

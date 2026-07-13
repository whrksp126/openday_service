'use client'

import { useEffect } from 'react'
import EditorLayout from '@/components/editor/EditorLayout'
import { useEditorStore } from '@/store/editor'

interface Props {
  id: string
  templateId: string | null
  mode?: 'invitation' | 'template'
}

export default function EditorClient({ id, templateId, mode = 'invitation' }: Props) {
  const { setMode, setInvitationId, setTemplateId } = useEditorStore()

  useEffect(() => {
    setMode(mode)
    if (mode === 'template') {
      setTemplateId(id)
      setInvitationId(null)
    } else if (id !== 'new') {
      setInvitationId(id)
    }
  }, [mode, id, setMode, setInvitationId, setTemplateId])

  // OAuth(Google Drive) 복귀 후 nav/모듈 패널을 자동으로 복원한다.
  // photo_share Drive 연결 시 returnTo 에 ?nav=photo_share&moduleId=... 가 포함된다.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const nav = params.get('nav')
    const moduleId = params.get('moduleId')
    if (!nav) return
    const store = useEditorStore.getState()
    store.setActiveNav(nav)
    if (moduleId) store.setEditingModuleId(moduleId)
    // nav/moduleId 파라미터는 사용 후 정리. drive=connected 는 PhotoSharePanel 이 토스트
    // 표시 후 별도로 정리하므로 그대로 둔다.
    params.delete('nav')
    params.delete('moduleId')
    const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
    window.history.replaceState({}, '', next)
  }, [])

  if (mode === 'template') {
    return <EditorLayout invitationId={null} templateId={id} mode="template" />
  }
  return <EditorLayout invitationId={id === 'new' ? null : id} templateId={templateId} mode="invitation" />
}

'use client'

import { useEffect } from 'react'
import EditorLayout from '@/components/editor/EditorLayout'
import { useEditorStore } from '@/store/editor'

interface Props {
  id: string
  templateId: string | null
}

export default function EditorClient({ id, templateId }: Props) {
  const { setInvitationId } = useEditorStore()

  useEffect(() => {
    if (id !== 'new') {
      setInvitationId(id)
    }
  }, [id, setInvitationId])

  return <EditorLayout invitationId={id === 'new' ? null : id} templateId={templateId} />
}

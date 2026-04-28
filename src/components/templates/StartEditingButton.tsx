'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import AuthModal from '@/components/shared/AuthModal'

interface Props {
  templateId: string
}

export default function StartEditingButton({ templateId }: Props) {
  const { status } = useSession()
  const [authOpen, setAuthOpen] = useState(false)

  const target = `/editor/new?templateId=${templateId}`
  const className = 'text-xs font-medium px-4 py-1.5 rounded-lg text-white'
  const style = { backgroundColor: '#bf8362' }

  if (status === 'authenticated') {
    return (
      <Link href={target} className={className} style={style}>
        시작하기
      </Link>
    )
  }

  return (
    <>
      <button onClick={() => setAuthOpen(true)} className={className} style={style}>
        시작하기
      </button>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} callbackUrl={target} />
    </>
  )
}

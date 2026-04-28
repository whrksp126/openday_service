'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthModal from './AuthModal'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-primary font-bold text-lg tracking-tight">
            OpenDay
          </Link>

          <nav className="flex items-center gap-3">
            <Link href="/templates" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              템플릿
            </Link>
            {session ? (
              <>
                <Link
                  href="/my"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  내 초대장
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="bg-primary text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-primary-600 transition-colors"
                >
                  회원가입
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}

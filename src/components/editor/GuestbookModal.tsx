'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { GuestbookEntry, GuestbookModuleConfig } from '@/types/invitation'

interface Props {
  open: boolean
  onClose: () => void
  config: GuestbookModuleConfig
  accent: string
  onSubmit: (entry: GuestbookEntry) => void
}

export default function GuestbookModal({ open, onClose, config, accent, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) {
      setName('')
      setMessage('')
      setPassword('')
      setPasswordTouched(false)
    }
  }, [open])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  const title = config.modalTitle ?? '방명록 작성'
  const submitLabel = config.submitLabel ?? '등록하기'
  const namePlaceholder = config.namePlaceholder ?? '이름을 입력해 주세요'
  const messagePlaceholder = config.messagePlaceholder ?? '축하 메시지를 남겨주세요'
  const passwordPlaceholder = config.passwordPlaceholder ?? '4자리 숫자'

  const isPasswordValid = /^\d{4}$/.test(password)
  const passwordError = passwordTouched && !isPasswordValid
  const canSubmit =
    name.trim().length > 0 && message.trim().length > 0 && isPasswordValid

  // 숫자만 통과, 최대 4자리. 한글/영문/특수문자 자동 제거.
  const handlePasswordChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 4)
    setPassword(digitsOnly)
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      id: nanoid(),
      name: name.trim(),
      message: message.trim(),
      password: password.trim(),
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  if (!mounted) return null

  const inputBase =
    'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-gray-500 transition-colors"
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 px-6 py-5 space-y-5 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm text-gray-800">
                  이름<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  placeholder={namePlaceholder}
                  onChange={(e) => setName(e.target.value)}
                  className={inputBase}
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-800">
                  내용<span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={message}
                  placeholder={messagePlaceholder}
                  rows={5}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputBase} resize-none leading-6`}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-800">
                  비밀번호<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  placeholder={passwordPlaceholder}
                  inputMode="numeric"
                  pattern="\d{4}"
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  className={`${inputBase} ${passwordError ? 'border-red-400 focus:border-red-400' : ''}`}
                  maxLength={4}
                />
                {passwordError ? (
                  <p className="text-xs text-red-500">숫자 4자리를 입력해 주세요.</p>
                ) : (
                  <p className="text-xs text-gray-400">숫자 4자리로 설정해 주세요. 삭제할 때 필요합니다.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-5">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3 rounded-lg text-sm font-medium transition-colors"
                style={
                  canSubmit
                    ? { backgroundColor: accent, color: 'white' }
                    : { backgroundColor: '#d1d5db', color: 'white' }
                }
              >
                {submitLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

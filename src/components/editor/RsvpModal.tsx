'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { RsvpModuleConfig, RsvpQuestion } from '@/types/invitation'

interface Props {
  open: boolean
  onClose: () => void
  config: RsvpModuleConfig
  accent: string
  /** 발행된 초대장 컨텍스트. live && invitationId 일 때만 실제 API 로 제출된다. */
  invitationId?: string
  live?: boolean
}

type AnswerMap = Record<string, string | string[]>
type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

function getDefaultAnswer(type: RsvpQuestion['type']): string | string[] {
  return type === 'multi-choice' ? [] : ''
}

// ── 동적 질문 응답 → 고정 RSVP 스키마 매핑 (데이터 무손실) ────────────────────
const NAME_RE = /이름|성함|name/i
const ATTEND_RE = /참석|attend/i
const PARTY_RE = /인원|명|people|count/i
const SIDE_RE = /측|신랑|신부|side/i

function answerToString(v: string | string[] | undefined): string {
  if (v === undefined) return ''
  return Array.isArray(v) ? v.join(', ') : v
}

function mapSide(value: string): 'groom' | 'bride' | 'baby' | undefined {
  if (value.includes('신랑')) return 'groom'
  if (value.includes('신부')) return 'bride'
  if (value.includes('아기') || value.includes('아이') || value.includes('돌') || /baby/i.test(value)) return 'baby'
  return undefined
}

interface RsvpPayload {
  guestName: string
  attending: boolean
  side?: 'groom' | 'bride' | 'baby'
  partySize?: number
  phone?: string
  message?: string
}

function buildRsvpPayload(questions: RsvpQuestion[], answers: AnswerMap): RsvpPayload {
  const consumed = new Set<string>()
  const take = (q: RsvpQuestion) => { consumed.add(q.id); return answerToString(answers[q.id]) }

  // guestName: 이름/성함/name 라벨의 단답 → 첫 단답 → '익명'
  let guestName = ''
  const nameQ = questions.find(q => q.type === 'text-short' && NAME_RE.test(q.label))
  if (nameQ) guestName = take(nameQ).trim()
  if (!guestName) {
    const firstText = questions.find(q => q.type === 'text-short' && !consumed.has(q.id) && answerToString(answers[q.id]).trim())
    if (firstText) guestName = take(firstText).trim()
  }
  if (!guestName) guestName = '익명'

  // attending: 참석/attend 라벨의 단일선택/드롭다운
  let attending = true
  const attendQ = questions.find(q => (q.type === 'single-choice' || q.type === 'dropdown') && ATTEND_RE.test(q.label))
  if (attendQ) {
    const v = take(attendQ)
    if (v.includes('참석') && !v.includes('불참')) attending = true
    else if (v.includes('불참') || v.includes('안')) attending = false
    else attending = true
  }

  // partySize: 인원/명/people/count 라벨의 숫자
  let partySize: number | undefined
  const partyQ = questions.find(q => q.type === 'number' && PARTY_RE.test(q.label))
  if (partyQ) {
    const n = parseInt(take(partyQ), 10)
    partySize = Number.isNaN(n) ? 1 : Math.min(20, Math.max(1, n))
  }

  // phone
  let phone: string | undefined
  const phoneQ = questions.find(q => q.type === 'phone' && !consumed.has(q.id))
  if (phoneQ) { const v = take(phoneQ).trim(); if (v) phone = v.slice(0, 40) }

  // side: 측/신랑/신부/side 라벨 → enum 매핑 성공 시에만 소비, 실패 시 message 로 보존
  let side: 'groom' | 'bride' | 'baby' | undefined
  const sideQ = questions.find(q => (q.type === 'single-choice' || q.type === 'dropdown') && !consumed.has(q.id) && SIDE_RE.test(q.label))
  if (sideQ) {
    const mapped = mapSide(answerToString(answers[sideQ.id]))
    if (mapped) { side = mapped; consumed.add(sideQ.id) }
  }

  // message: 장문형 답 + 매핑되지 않은 나머지 응답 전부 (무손실)
  const lines: string[] = []
  for (const q of questions) {
    if (consumed.has(q.id) || q.type !== 'text-long') continue
    const v = answerToString(answers[q.id]).trim()
    if (v) { lines.push(v); consumed.add(q.id) }
  }
  for (const q of questions) {
    if (consumed.has(q.id)) continue
    const v = answerToString(answers[q.id]).trim()
    if (v) lines.push(`${q.label || '질문'}: ${v}`)
  }
  const message = lines.join('\n').slice(0, 500) || undefined

  return { guestName: guestName.slice(0, 40), attending, side, partySize, phone, message }
}

function isAnswered(question: RsvpQuestion, answer: string | string[] | undefined): boolean {
  if (answer === undefined) return false
  if (question.type === 'multi-choice') {
    return Array.isArray(answer) && answer.length > 0
  }
  return typeof answer === 'string' && answer.trim().length > 0
}

export default function RsvpModal({ open, onClose, config, accent, invitationId, live = false }: Props) {
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [mounted, setMounted] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) {
      setAnswers({})
      setSubmitState('idle')
      setErrorMsg('')
    }
  }, [open])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  const questions = config.questions ?? []
  const title = config.modalTitle ?? '참석 여부 전달'
  const submitLabel = config.submitLabel ?? '전달하기'

  const canSubmit = useMemo(
    () => questions.every(q => !q.required || isAnswered(q, answers[q.id])),
    [questions, answers],
  )

  const setAnswer = (id: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const toggleMultiChoice = (id: string, option: string) => {
    const current = (answers[id] as string[] | undefined) ?? []
    const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option]
    setAnswer(id, next)
  }

  const handleSubmit = async () => {
    if (!canSubmit || submitState === 'submitting') return
    // 에디터 프리뷰(live=false) 또는 미저장 상태 → 제출 no-op
    if (!live || !invitationId) {
      onClose()
      return
    }
    setSubmitState('submitting')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/invitations/${invitationId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRsvpPayload(questions, answers)),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const msg = typeof data?.error === 'string' ? data.error : '전달에 실패했어요. 잠시 후 다시 시도해주세요.'
        throw new Error(msg)
      }
      setSubmitState('success')
    } catch (e) {
      setSubmitState('error')
      setErrorMsg(e instanceof Error ? e.message : '전달에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  if (!mounted) return null

  const inputBase = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400'

  const renderQuestionField = (q: RsvpQuestion) => {
    const value = answers[q.id] ?? getDefaultAnswer(q.type)
    switch (q.type) {
      case 'text-short':
        return (
          <input type="text" value={value as string} placeholder={q.placeholder}
            onChange={(e) => setAnswer(q.id, e.target.value)} className={inputBase} />
        )
      case 'text-long':
        return (
          <textarea value={value as string} placeholder={q.placeholder} rows={4}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            className={`${inputBase} resize-none leading-6`} />
        )
      case 'email':
        return (
          <input type="email" value={value as string} placeholder={q.placeholder ?? 'you@example.com'}
            onChange={(e) => setAnswer(q.id, e.target.value)} className={inputBase} />
        )
      case 'phone':
        return (
          <input type="tel" value={value as string} placeholder={q.placeholder ?? '010-1234-5678'} inputMode="tel"
            onChange={(e) => setAnswer(q.id, e.target.value)} className={inputBase} />
        )
      case 'number':
        return (
          <input type="number" value={value as string} placeholder={q.placeholder} inputMode="numeric"
            onChange={(e) => setAnswer(q.id, e.target.value)} className={inputBase} />
        )
      case 'date':
        return (
          <input type="date" value={value as string}
            onChange={(e) => setAnswer(q.id, e.target.value)} className={inputBase} />
        )
      case 'dropdown': {
        return (
          <div className="relative">
            <select
              value={value as string}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              className={`${inputBase} appearance-none pr-8 cursor-pointer`}
            >
              <option value="">선택해주세요</option>
              {(q.options ?? []).map((opt, i) => (
                <option key={i} value={opt}>{opt || `선택지 ${i + 1}`}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
          </div>
        )
      }
      case 'single-choice':
        return (
          <div className="grid grid-cols-2 gap-2">
            {(q.options ?? []).map((opt, i) => {
              const selected = value === opt
              return (
                <button key={i} type="button" onClick={() => setAnswer(q.id, opt)}
                  className="py-2.5 rounded-lg text-sm transition-colors"
                  style={selected
                    ? { backgroundColor: accent, color: 'white', border: `1px solid ${accent}` }
                    : { backgroundColor: 'white', color: '#374151', border: '1px solid #e5e7eb' }}
                >
                  {opt || `선택지 ${i + 1}`}
                </button>
              )
            })}
          </div>
        )
      case 'multi-choice':
        return (
          <div className="space-y-2">
            {(q.options ?? []).map((opt, i) => {
              const checked = ((value as string[])).includes(opt)
              return (
                <label key={i} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <span className="inline-flex w-4 h-4 items-center justify-center rounded border transition-colors flex-shrink-0"
                    style={checked
                      ? { backgroundColor: accent, borderColor: accent }
                      : { backgroundColor: 'white', borderColor: '#d1d5db' }}
                  >
                    {checked && (
                      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                        <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <input type="checkbox" checked={checked}
                    onChange={() => toggleMultiChoice(q.id, opt)} className="hidden" />
                  <span>{opt || `선택지 ${i + 1}`}</span>
                </label>
              )
            })}
          </div>
        )
    }
  }

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
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors" aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 px-6 py-5 space-y-5 overflow-y-auto">
              {submitState === 'success' ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-base font-medium" style={{ color: accent }}>참석 여부가 전달되었어요</p>
                  <p className="text-sm text-gray-400">소중한 응답 감사합니다.</p>
                </div>
              ) : questions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">아직 설정된 질문이 없어요.</p>
              ) : (
                questions.map(q => (
                  <div key={q.id} className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-800">
                        {q.label || '질문'}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {q.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{q.description}</p>
                      )}
                    </div>
                    {renderQuestionField(q)}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-5">
              {submitState === 'success' ? (
                <button type="button" onClick={onClose}
                  className="w-full py-3 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: accent, color: 'white' }}
                >
                  닫기
                </button>
              ) : (
                <>
                  {submitState === 'error' && (
                    <p className="text-sm text-red-500 mb-3 text-center">{errorMsg}</p>
                  )}
                  <button type="button" onClick={handleSubmit} disabled={!canSubmit || submitState === 'submitting'}
                    className="w-full py-3 rounded-lg text-sm font-medium transition-colors"
                    style={canSubmit && submitState !== 'submitting'
                      ? { backgroundColor: accent, color: 'white' }
                      : { backgroundColor: '#d1d5db', color: 'white' }}
                  >
                    {submitState === 'submitting' ? '전달 중…' : submitLabel}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

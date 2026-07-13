'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface UploadTokenResponse {
  submissionId: string
  deleteToken: string
}

interface UploadResponse {
  driveFileId?: string
  id?: string
}

interface SubmissionResponse {
  id: string
  driveFileId?: string
  thumbnailUrl: string | null
  driveDirectUrl: string | null
  authorName: string
  relation: string
  createdAt: string
}

interface UploadResult extends SubmissionResponse {
  deleteToken: string
}

interface Props {
  invitationId: string
  moduleId: string
  open: boolean
  onClose: () => void
  onUploaded: (result: UploadResult) => void
  accent?: string
}

const RELATION_PRESETS = ['신랑/신부 친구', '가족', '회사 동료', '기타']

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif'

async function compressImage(file: File, maxLongSide = 2400, quality = 0.85): Promise<Blob> {
  // HEIC 등 디코딩 실패 시 원본 유지
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => reject(r.error)
      r.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('decode failed'))
      i.src = dataUrl
    })
    const long = Math.max(img.width, img.height)
    const scale = long > maxLongSide ? maxLongSide / long : 1
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas ctx')
    ctx.drawImage(img, 0, 0, w, h)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality)
    })
  } catch {
    return file
  }
}

export default function PhotoUploadModal({ invitationId, moduleId, open, onClose, onUploaded, accent = '#5B4FCF' }: Props) {
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) {
      setName('')
      setRelation('')
      setFiles([])
      setProgress(0)
      setError(null)
    }
  }, [open])

  // 모달 열린 동안 body 스크롤 잠금
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  const handleClose = useCallback(() => {
    if (uploading) return
    onClose()
  }, [uploading, onClose])

  const handlePick = useCallback((picked: FileList | null) => {
    if (!picked) return
    const arr = Array.from(picked).filter((f) => f.size <= 25 * 1024 * 1024)
    setFiles(arr)
  }, [])

  const submit = useCallback(async () => {
    if (!name.trim() || !relation.trim() || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const blob = await compressImage(file)
        const mimeType = blob.type || file.type || 'image/jpeg'
        const sizeBytes = blob.size

        // 1) upload-token 발급 (rate-limit + submissionId/deleteToken)
        const tokenRes = await fetch(`/api/invitations/${invitationId}/photo-share/upload-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), relation: relation.trim(), mimeType, sizeBytes, moduleId }),
        })
        if (!tokenRes.ok) {
          const j = await tokenRes.json().catch(() => ({}))
          throw new Error(typeof j.error === 'string' ? j.error : '업로드 준비에 실패했어요')
        }
        const token: UploadTokenResponse = await tokenRes.json()

        // 2) 서버 프록시로 Drive 업로드 (multipart) — 한 번만 호출되므로 중복 없음
        const fd = new FormData()
        fd.append('file', new File([blob], file.name, { type: mimeType }))
        fd.append('submissionId', token.submissionId)
        fd.append('name', name.trim())
        fd.append('relation', relation.trim())
        fd.append('moduleId', moduleId)
        const upRes = await fetch(`/api/invitations/${invitationId}/photo-share/upload`, {
          method: 'POST',
          body: fd,
        })
        if (!upRes.ok) {
          const j = await upRes.json().catch(() => ({}))
          throw new Error(typeof j.error === 'string' ? j.error : '업로드에 실패했어요')
        }
        const upJson: UploadResponse = await upRes.json()
        const driveFileId = upJson.driveFileId ?? upJson.id ?? null
        if (!driveFileId) throw new Error('업로드 응답이 비어있어요')

        // 3) submission 메타 등록
        const subRes = await fetch(`/api/invitations/${invitationId}/photo-share/submission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: token.submissionId,
            moduleId,
            driveFileId,
            name: name.trim(),
            relation: relation.trim(),
            mimeType,
            sizeBytes,
            deleteToken: token.deleteToken,
          }),
        })
        if (!subRes.ok) {
          const j = await subRes.json().catch(() => ({}))
          throw new Error(typeof j.error === 'string' ? j.error : '메타 등록에 실패했어요')
        }
        const sub: SubmissionResponse = await subRes.json()

        try {
          window.localStorage.setItem(`ps_token_${sub.id}`, token.deleteToken)
        } catch { /* private mode 등 */ }

        // 진행률은 파일 단위로 갱신 (multipart 라 정밀 progress 는 어려움)
        setProgress(Math.round(((i + 1) / files.length) * 100))

        onUploaded({ ...sub, deleteToken: token.deleteToken })
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [files, name, relation, invitationId, moduleId, onUploaded, onClose])

  if (!mounted) return null

  const node = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">사진 보내기</h3>
              <button type="button" onClick={handleClose} disabled={uploading} className="text-gray-400">
                <X size={18} />
              </button>
            </header>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">이름</label>
                <input
                  type="text"
                  value={name}
                  maxLength={30}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
                  disabled={uploading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">관계</label>
                <div className="flex flex-wrap gap-1.5">
                  {RELATION_PRESETS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRelation(r)}
                      className={`text-xs px-3 py-1.5 rounded-full border ${relation === r ? 'text-white' : 'border-gray-200 text-gray-500'}`}
                      style={relation === r ? { backgroundColor: accent, borderColor: accent } : undefined}
                      disabled={uploading}
                    >{r}</button>
                  ))}
                </div>
                <input
                  type="text"
                  value={relation}
                  maxLength={30}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="직접 입력"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
                  disabled={uploading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400">사진</label>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full border border-gray-200 rounded-lg py-3 flex items-center justify-center gap-2 text-sm text-gray-800"
                  disabled={uploading}
                >
                  <ImageIcon size={16} className="text-gray-400" />
                  {files.length > 0 ? `${files.length}장 선택됨` : '사진 선택'}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(e) => handlePick(e.target.files)}
                />
              </div>
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 size={14} className="animate-spin" /> 업로드 중… {progress}%
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: accent }} />
                  </div>
                </div>
              )}
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <p className="text-xs text-gray-400 leading-5">
                업로드한 사진은 행사 주최자의 Google Drive에 저장돼요. 본인이 올린 사진만
                나중에 삭제할 수 있어요. (브라우저 저장소를 비우면 삭제 권한도 사라져요.)
              </p>
            </div>
            <footer className="px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={submit}
                disabled={uploading || !name.trim() || !relation.trim() || files.length === 0}
                className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400"
                style={{ backgroundColor: uploading || !name.trim() || !relation.trim() || files.length === 0 ? undefined : accent }}
              >보내기</button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(node, document.body)
}

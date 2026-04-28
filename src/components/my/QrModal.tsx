'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import QRCode from 'qrcode'

interface Props {
  url: string
  filename?: string
  onClose: () => void
}

export default function QrModal({ url, filename, onClose }: Props) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, { width: 480, margin: 2 })
      .then((u) => { if (!cancelled) setDataUrl(u) })
      .catch(() => { if (!cancelled) setError('QR 코드를 만들 수 없습니다.') })
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-100 max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">QR 코드</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <div className="aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mb-4">
          {dataUrl ? (
            <img src={dataUrl} alt="QR" className="w-full h-full object-contain p-4" />
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : (
            <p className="text-xs text-gray-400">QR 코드를 만드는 중...</p>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mb-4">{url}</p>
        {dataUrl && (
          <a
            href={dataUrl}
            download={filename ?? 'invitation-qr.png'}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-medium bg-primary text-white"
          >
            <Download size={14} />
            QR 이미지 저장
          </a>
        )}
      </div>
    </div>
  )
}

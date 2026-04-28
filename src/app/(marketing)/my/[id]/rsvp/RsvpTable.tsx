'use client'

import { Download } from 'lucide-react'

interface Row {
  id: string
  guestName: string
  sideLabel: string
  attending: boolean
  partySize: number
  meal: boolean | null
  phone: string | null
  message: string | null
  createdAt: string
}

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

export default function RsvpTable({ rows }: { rows: Row[] }) {
  function downloadCsv() {
    const header = ['이름', '측', '참석', '인원', '식사', '연락처', '메시지', '작성일']
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push([
        r.guestName,
        r.sideLabel,
        r.attending ? '참석' : '불참',
        String(r.partySize),
        r.meal === null ? '-' : r.meal ? '식사' : '식사X',
        r.phone ?? '',
        (r.message ?? '').replace(/\n/g, ' '),
        new Date(r.createdAt).toLocaleString('ko-KR'),
      ].map(csvEscape).join(','))
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvp-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">아직 응답이 없어요.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={downloadCsv}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
        >
          <Download size={12} />
          CSV 내보내기
        </button>
      </div>
      <div className="border border-gray-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-left">측</th>
              <th className="px-3 py-2 text-left">참석</th>
              <th className="px-3 py-2 text-left">인원</th>
              <th className="px-3 py-2 text-left">식사</th>
              <th className="px-3 py-2 text-left">연락처</th>
              <th className="px-3 py-2 text-left">메시지</th>
              <th className="px-3 py-2 text-left">작성일</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-900">{r.guestName}</td>
                <td className="px-3 py-2 text-gray-700">{r.sideLabel}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${r.attending ? 'text-primary bg-primary/10' : 'text-gray-400 bg-gray-100'}`}>
                    {r.attending ? '참석' : '불참'}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-700">{r.partySize}명</td>
                <td className="px-3 py-2 text-gray-700">{r.meal === null ? '-' : r.meal ? '식사' : '식사X'}</td>
                <td className="px-3 py-2 text-gray-700">{r.phone ?? '-'}</td>
                <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{r.message ?? '-'}</td>
                <td className="px-3 py-2 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

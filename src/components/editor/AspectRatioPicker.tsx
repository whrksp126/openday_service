'use client'

export const ASPECT_PRESETS = [
  { value: '1/1',  label: '1:1',  w: 1, h: 1 },
  { value: '4/3',  label: '4:3',  w: 4, h: 3 },
  { value: '3/4',  label: '3:4',  w: 3, h: 4 },
  { value: '4/5',  label: '4:5',  w: 4, h: 5 },
  { value: '16/9', label: '16:9', w: 16, h: 9 },
  { value: '9/16', label: '9:16', w: 9, h: 16 },
] as const

export type AspectPresetValue = typeof ASPECT_PRESETS[number]['value']

interface Props {
  value: string
  onChange: (v: string) => void
}

// 5개 비율 버튼 가로 정렬. 각 버튼은 고정 높이에서 실제 비율 미니 박스를 가운데 정렬, 라벨은 항상 하단.
export default function AspectRatioPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 items-stretch">
      {ASPECT_PRESETS.map((p) => {
        const active = value === p.value
        // 미니 프리뷰 크기: 최대 22x22 박스 안에서 실제 비율 유지
        const max = 22
        const mw = p.w >= p.h ? max : Math.round((max * p.w) / p.h)
        const mh = p.h >= p.w ? max : Math.round((max * p.h) / p.w)
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`flex-1 rounded-xl text-[10px] border transition-colors flex flex-col items-center justify-between py-2.5 ${
              active ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="flex-1 flex items-center justify-center w-full">
              <span
                className={`block border ${active ? 'border-white' : 'border-gray-400'}`}
                style={{ width: mw, height: mh }}
              />
            </span>
            <span className="mt-1.5">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}

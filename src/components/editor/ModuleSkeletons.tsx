'use client'

import React from 'react'

export const ACCENT = '#d4b9a8'

export const SkLine = ({ w }: { w: string }) => (
  <div className="bg-gray-200 h-2 rounded-full" style={{ width: w }} />
)

export const SkImg = ({ ratio, rounded = 'lg' }: { ratio: string; rounded?: string }) => (
  <div className={`bg-gray-200 w-full rounded-${rounded}`} style={{ aspectRatio: ratio }} />
)

const SkEn = ({ label }: { label: string }) => (
  <p className="text-[10px] italic text-gray-300 text-center">{label}</p>
)

const SkTitle = ({ label }: { label: string }) => (
  <p className="text-xs font-medium text-center" style={{ color: ACCENT }}>{label}</p>
)

const SkWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="px-5 py-4 space-y-2.5">{children}</div>
)

const SkBtn = ({ label }: { label: string }) => (
  <div className="border border-gray-200 rounded-xl px-4 py-2 flex items-center justify-center">
    <span className="text-[10px] text-gray-400">{label}</span>
  </div>
)

function CoupleNamesSkeleton() {
  return (
    <SkWrap>
      <div className="flex flex-col items-center gap-2.5 py-4">
        <div className="h-4 rounded-full" style={{ width: '38%', backgroundColor: ACCENT, opacity: 0.35 }} />
        <div className="h-2 rounded-full bg-gray-200" style={{ width: '18%' }} />
        <div className="h-4 rounded-full" style={{ width: '38%', backgroundColor: ACCENT, opacity: 0.35 }} />
      </div>
    </SkWrap>
  )
}

function MainSkeleton() {
  return (
    <SkWrap>
      <div className="bg-white p-2 rounded-xl shadow-sm">
        <SkImg ratio="4/5" rounded="lg" />
        <div className="flex flex-col items-center gap-1.5 py-3">
          <SkLine w="55%" />
          <SkLine w="65%" />
        </div>
      </div>
    </SkWrap>
  )
}

function MidphotoSkeleton() {
  return <SkImg ratio="4/3" rounded="none" />
}

function GallerySkeleton() {
  return (
    <SkWrap>
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-200 aspect-square" />
        ))}
      </div>
    </SkWrap>
  )
}

function EndingSkeleton() {
  return (
    <div className="space-y-3">
      <SkImg ratio="3/2" rounded="none" />
      <div className="flex flex-col items-center gap-1.5 pb-3">
        <SkLine w="50%" />
        <SkLine w="40%" />
      </div>
    </div>
  )
}

function GreetingSkeleton() {
  return (
    <SkWrap>
      <div className="flex flex-col items-center gap-1.5">
        <SkLine w="70%" />
      </div>
      <div className="border-t border-gray-100 pt-2 flex flex-col items-center gap-1.5">
        <SkLine w="80%" />
        <SkLine w="75%" />
        <SkLine w="85%" />
        <SkLine w="60%" />
      </div>
      <div className="flex justify-center gap-2 pt-1">
        <SkLine w="25%" />
        <SkLine w="10%" />
        <SkLine w="25%" />
      </div>
    </SkWrap>
  )
}

function DatetimeSkeleton() {
  return (
    <SkWrap>
      <div className="flex flex-col items-center gap-1.5">
        <SkLine w="65%" />
      </div>
      <div className="border border-gray-100 rounded-xl p-2 space-y-1.5">
        <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <div key={d} className="text-[8px] text-gray-300 text-center">{d}</div>
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, r) => (
          <div key={r} className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, c) => {
              const isHighlight = r === 2 && c === 1
              const isBlank = r === 2 && c === 0
              return (
                <div
                  key={c}
                  className={`h-4 rounded-full flex items-center justify-center ${isBlank ? 'opacity-0' : isHighlight ? '' : 'bg-gray-100'}`}
                  style={isHighlight ? { backgroundColor: ACCENT } : {}}
                >
                  {isHighlight && <span className="text-[7px] text-white">18</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </SkWrap>
  )
}

function VenueSkeleton() {
  const navColors = ['#4ade80', '#22d3ee', '#fbbf24']
  return (
    <SkWrap>
      <div className="flex flex-col items-center gap-1">
        <div className="h-3 rounded-full" style={{ width: '40%', backgroundColor: ACCENT, opacity: 0.55 }} />
        <SkLine w="30%" />
        <SkLine w="70%" />
      </div>
      <div className="bg-gray-200 w-full h-24 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: ACCENT }} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {navColors.map((c, i) => (
          <div key={i} className="border border-gray-200 rounded-xl py-1.5 flex items-center justify-center gap-1 bg-white">
            <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: c, opacity: 0.7 }} />
            <SkLine w="50%" />
          </div>
        ))}
      </div>
    </SkWrap>
  )
}

function ProfileSkeleton() {
  return (
    <SkWrap>
      <SkTitle label="프로필" />
      <SkEn label="About" />
      <div className="space-y-2 pt-1">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-2.5 bg-white border border-gray-100 rounded-xl p-2.5 items-stretch">
            <div className="w-1/2">
              <div className="bg-gray-200 w-full aspect-square rounded-lg" />
            </div>
            <div className={`w-1/2 flex flex-col gap-1.5 ${i === 0 ? 'items-start' : 'items-end'} justify-start pt-1`}>
              <div className="bg-gray-200 rounded-full h-3" style={{ width: '40%' }} />
              <div className="bg-gray-100 rounded-full h-2 w-full" />
              <div className="bg-gray-100 rounded-full h-2" style={{ width: '85%' }} />
              <div className="bg-gray-100 rounded-full h-2" style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    </SkWrap>
  )
}

function SoloProfileSkeleton() {
  return (
    <SkWrap>
      <SkTitle label="프로필" />
      <SkEn label="About" />
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-1 flex flex-col items-center gap-2.5">
        <div className="w-24 aspect-square bg-gray-200 rounded-full" />
        <div className="bg-gray-200 rounded-full h-3.5 mt-1" style={{ width: '35%' }} />
        <div className="bg-gray-100 rounded-full h-2" style={{ width: '50%' }} />
        <div className="flex gap-1.5">
          <div className="bg-gray-100 rounded-full h-3" style={{ width: '40px' }} />
          <div className="bg-gray-100 rounded-full h-3" style={{ width: '52px' }} />
        </div>
        <div className="bg-gray-100 rounded-full h-2 w-full mt-1" style={{ width: '70%' }} />
        <div className="bg-gray-100 rounded-full h-2" style={{ width: '50%' }} />
      </div>
    </SkWrap>
  )
}

function TimelineSkeleton() {
  const rows = [0, 1, 2]
  return (
    <SkWrap>
      <SkTitle label="타임라인" />
      <SkEn label="Timeline" />
      <div className="relative pt-2">
        <div className="absolute left-1/2 top-2 bottom-0 w-px -translate-x-1/2" style={{ backgroundColor: ACCENT, opacity: 0.4 }} />
        <div className="space-y-3">
          {rows.map(i => {
            const imageOnLeft = i % 2 === 0
            const imageCell = (
              <div className="bg-gray-200 w-full rounded-md" style={{ aspectRatio: '1/1' }} />
            )
            const dotCell = (
              <div className="flex flex-col items-center pt-2">
                <div className="w-2 h-2 rounded-full border bg-white" style={{ borderColor: ACCENT }} />
              </div>
            )
            const textCell = (
              <div className={`space-y-1 pt-1 ${imageOnLeft ? 'items-start text-left' : 'items-end text-right'} flex flex-col`}>
                <div className="h-3 rounded-full" style={{ width: '55%', backgroundColor: ACCENT, opacity: 0.55 }} />
                <SkLine w="80%" />
                <SkLine w="60%" />
              </div>
            )
            return (
              <div key={i} className="relative grid grid-cols-[1fr_auto_1fr] gap-1.5 items-start">
                {imageOnLeft ? imageCell : textCell}
                {dotCell}
                {imageOnLeft ? textCell : imageCell}
              </div>
            )
          })}
        </div>
      </div>
    </SkWrap>
  )
}

function TimelinePolaroidSkeleton() {
  const rotations = [-3, 2]
  return (
    <SkWrap>
      <SkTitle label="폴라로이드" />
      <SkEn label="Polaroid" />
      <div className="space-y-5 pt-3 pb-1">
        {rotations.map((rot, i) => (
          <div
            key={i}
            className="relative bg-white rounded-sm p-2 pb-3 border border-gray-200 mx-3"
            style={{ transform: `rotate(${rot}deg)` }}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-gray-300/50 rounded-sm" />
            <div className="bg-gray-200 w-full rounded-sm mb-2" style={{ aspectRatio: '1/1' }} />
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 rounded-full" style={{ width: '40%', backgroundColor: ACCENT, opacity: 0.55 }} />
              <SkLine w="70%" />
              <SkLine w="55%" />
            </div>
          </div>
        ))}
      </div>
    </SkWrap>
  )
}

function InterviewSkeleton() {
  const blocks = [
    { qWidth: '70%', answers: [{ name: '50%', lines: ['85%', '70%'] }, { name: '50%', lines: ['80%', '55%'] }] },
    { qWidth: '60%', answers: [{ name: '50%', lines: ['75%', '60%'] }] },
  ]
  return (
    <SkWrap>
      <SkTitle label="인터뷰" />
      <SkEn label="Interview" />
      <div className="space-y-4 pt-2">
        {blocks.map((b, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Q.</span>
              <SkLine w={b.qWidth} />
            </div>
            <div className="pl-3 space-y-2">
              {b.answers.map((a, j) => (
                <div key={j} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    {j === 0 && <span className="text-[10px] text-gray-500">A.</span>}
                    <div className={`h-2 rounded-full bg-gray-300 ${j === 0 ? '' : 'ml-3.5'}`} style={{ width: a.name }} />
                  </div>
                  <div className={j === 0 ? 'pl-3.5 space-y-1' : 'pl-3.5 space-y-1'}>
                    {a.lines.map((w, k) => <SkLine key={k} w={w} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkWrap>
  )
}

function SlideSkeleton() {
  return (
    <SkWrap>
      <div className="flex flex-col items-center gap-1">
        <div className="h-3 rounded-full" style={{ width: '35%', backgroundColor: ACCENT, opacity: 0.55 }} />
        <SkLine w="25%" />
      </div>
      <div className="relative pt-1">
        <SkImg ratio="16/9" rounded="lg" />
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[8px] text-gray-400">‹</div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[8px] text-gray-400">›</div>
      </div>
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <div className="h-2.5 rounded-full bg-gray-300" style={{ width: '45%' }} />
        <SkLine w="80%" />
        <SkLine w="65%" />
      </div>
      <div className="flex justify-center gap-1 pt-1">
        {[0, 1].map(i => (
          <span key={i} className="block w-1 h-1 rounded-full" style={{ backgroundColor: i === 0 ? ACCENT : '#e5e7eb' }} />
        ))}
      </div>
    </SkWrap>
  )
}

function TabSkeleton() {
  return (
    <SkWrap>
      <div className="flex gap-1">
        {['탭 1', '탭 2', '탭 3'].map((label, i) => (
          <div
            key={label}
            className={`flex-1 py-1 rounded-lg text-center text-[9px] ${i === 0 ? 'text-white' : 'border border-gray-200 text-gray-400'}`}
            style={i === 0 ? { backgroundColor: ACCENT } : {}}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <SkLine w="85%" />
        <SkLine w="70%" />
      </div>
    </SkWrap>
  )
}

function AccountSkeleton() {
  return (
    <SkWrap>
      <SkTitle label="계좌 정보" />
      <SkEn label="Account" />
      <div className="flex justify-center pt-1">
        <SkLine w="40%" />
      </div>
      {/* 신랑측 — 펼쳐진 상태 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-2">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <SkLine w="45%" />
          <span className="text-[8px] text-gray-400">▲</span>
        </div>
        {[0, 1].map(i => (
          <div key={i} className={`flex items-center justify-between px-3 py-2 ${i === 0 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex-1 space-y-1">
              <SkLine w="30%" />
              <div className="h-2.5 rounded-full bg-gray-300" style={{ width: '55%' }} />
              <SkLine w="20%" />
            </div>
            <div className="border rounded-lg px-2 py-1" style={{ borderColor: ACCENT }}>
              <span className="text-[8px]" style={{ color: ACCENT }}>복사하기</span>
            </div>
          </div>
        ))}
      </div>
      {/* 신부측 — 접힌 상태 */}
      <div className="bg-white border border-gray-200 rounded-xl mt-2">
        <div className="flex items-center justify-between px-3 py-2">
          <SkLine w="45%" />
          <span className="text-[8px] text-gray-400">▲</span>
        </div>
      </div>
    </SkWrap>
  )
}

function GuestbookSkeleton() {
  return (
    <SkWrap>
      <SkTitle label="방명록" />
      <SkEn label="Guestbook" />
      <div className="border rounded-xl px-4 py-2 flex items-center justify-center mt-1" style={{ borderColor: ACCENT }}>
        <span className="text-[10px]" style={{ color: ACCENT }}>작성하기</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 space-y-2 mt-1">
        <div className="flex items-center justify-between">
          <SkLine w="50%" />
          <span className="text-[10px] text-gray-300">×</span>
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-1">
          <SkLine w="90%" />
          <SkLine w="70%" />
          <div className="flex justify-end">
            <div className="h-1.5 rounded-full bg-gray-200" style={{ width: '30%' }} />
          </div>
        </div>
      </div>
    </SkWrap>
  )
}

function RsvpSkeleton() {
  return (
    <SkWrap>
      <div className="flex flex-col items-center gap-1">
        <div className="h-3 rounded-full" style={{ width: '35%', backgroundColor: ACCENT, opacity: 0.55 }} />
        <SkLine w="20%" />
      </div>
      <div className="border rounded-xl px-4 py-2.5 flex items-center justify-center mt-2" style={{ borderColor: ACCENT }}>
        <span className="text-[10px]" style={{ color: ACCENT }}>전달하기</span>
      </div>
    </SkWrap>
  )
}

function DdaySkeleton() {
  return (
    <SkWrap>
      <div className="flex justify-center"><SkLine w="30%" /></div>
      <div className="flex justify-center py-2">
        <span className="text-3xl font-light" style={{ color: ACCENT }}>D-000</span>
      </div>
    </SkWrap>
  )
}

function BgmSkeleton() {
  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
      <div className="w-4 h-4 bg-gray-200 rounded-full flex-shrink-0" />
      <SkLine w="50%" />
    </div>
  )
}

function VideoSkeleton() {
  return (
    <SkWrap>
      <div className="bg-gray-200 w-full aspect-video rounded-xl" />
    </SkWrap>
  )
}

function GuestalbumSkeleton() {
  return (
    <SkWrap>
      <div className="flex flex-col items-center gap-1.5">
        <SkLine w="70%" />
        <SkLine w="55%" />
      </div>
      <SkBtn label="사진 올리기" />
    </SkWrap>
  )
}

function ContactSkeleton() {
  return (
    <SkWrap>
      <SkTitle label="연락하기" />
      <SkEn label="Contact" />
      <div className="space-y-3 pt-1">
        {[0, 1].map(gi => (
          <div key={gi}>
            <div className="flex items-baseline justify-center gap-1.5 border-b border-gray-200 pb-1 mb-2">
              <div className="h-2.5 rounded-full bg-gray-300" style={{ width: '20%' }} />
              <SkLine w="12%" />
            </div>
            <div className="space-y-1.5">
              {[0, 1, 2].map(i => {
                const opacity = i === 0 ? 1 : 0.35
                return (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between">
                    <SkLine w="35%" />
                    <div className="flex items-center gap-1.5">
                      <span className="block w-3.5 h-3.5 rounded-full" style={{ backgroundColor: ACCENT, opacity }} />
                      <span className="block w-3.5 h-3.5 rounded-full" style={{ backgroundColor: ACCENT, opacity }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </SkWrap>
  )
}

function DefaultSkeleton() {
  return (
    <SkWrap>
      <div className="bg-gray-200 w-full h-20 rounded-xl" />
    </SkWrap>
  )
}

export function ModuleSkeleton({ type }: { type: string }) {
  switch (type) {
    case 'couple_names': return <CoupleNamesSkeleton />
    case 'main':       return <MainSkeleton />
    case 'midphoto':   return <MidphotoSkeleton />
    case 'gallery':    return <GallerySkeleton />
    case 'ending':     return <EndingSkeleton />
    case 'greeting':   return <GreetingSkeleton />
    case 'datetime':   return <DatetimeSkeleton />
    case 'venue':      return <VenueSkeleton />
    case 'profile':    return <ProfileSkeleton />
    case 'solo_profile': return <SoloProfileSkeleton />
    case 'timeline':   return <TimelineSkeleton />
    case 'timeline_polaroid': return <TimelinePolaroidSkeleton />
    case 'interview':  return <InterviewSkeleton />
    case 'contact':    return <ContactSkeleton />
    case 'tab':        return <TabSkeleton />
    case 'slide':      return <SlideSkeleton />
    case 'account':    return <AccountSkeleton />
    case 'guestbook':  return <GuestbookSkeleton />
    case 'rsvp':       return <RsvpSkeleton />
    case 'dday':       return <DdaySkeleton />
    case 'bgm':        return <BgmSkeleton />
    case 'video':      return <VideoSkeleton />
    case 'guestalbum': return <GuestalbumSkeleton />
    default:           return <DefaultSkeleton />
  }
}

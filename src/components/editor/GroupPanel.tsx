'use client'

import { nanoid } from 'nanoid'
import { ChevronRight, Plus } from 'lucide-react'
import { useEditorStore } from '@/store/editor'
import { type NavGroup, type NavModuleItem } from './nav-config'
import { ModuleSkeleton } from './ModuleSkeletons'

interface Props {
  groupId: string
  navGroups: NavGroup[]
  onSelectModule: (id: string, moduleId?: string) => void
}

export default function GroupPanel({ groupId, navGroups, onSelectModule }: Props) {
  const { modules, addModule, setEditingModuleId } = useEditorStore()
  const group = navGroups.find(g => g.id === groupId)
  if (!group) return null

  function handleAdd(item: NavModuleItem) {
    if (!item.moduleType) return
    // 메인 화면(main) 모듈은 한 초대장에 1개만 허용 — 중복 추가 차단
    if (item.moduleType === 'main' && modules.some(m => m.type === 'main')) return
    const id = nanoid()
    addModule({
      id,
      type: item.moduleType,
      order: modules.length + 1,
      config: item.defaultConfig ?? {},
    })
    setEditingModuleId(id)
    onSelectModule(item.id, id)
  }

  // ── 일반 그룹 렌더링 ──────────────────────────────────────────────────────
  if (!group.modules) return null

  const contentItems = group.modules.filter(m => !m.moduleType)
  const moduleItems = group.modules.filter(m => !!m.moduleType)

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{group.label}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* content 기반 항목 (moduleType 없음) */}
        {contentItems.length > 0 && (
          <div>
            {moduleItems.length > 0 && (
              <p className="px-5 pt-4 pb-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">기본 항목</p>
            )}
            {contentItems.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon size={16} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 text-sm text-gray-700">{item.label}</span>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}

        {/* module 기반 항목 — 카탈로그 형식 (인스턴스 목록 없음) */}
        {moduleItems.length > 0 && (
          <div>
            {contentItems.length > 0 && (
              <p className="px-5 pt-4 pb-2 text-[10px] font-medium text-gray-400 uppercase tracking-wider">모듈 항목</p>
            )}
            {moduleItems.map(item => {
              const Icon = item.icon
              return (
                <div key={item.id} className="border-b border-gray-50 last:border-0">
                  {/* 모듈 타입 헤더 */}
                  <div className="flex items-center gap-3 px-5 py-3">
                    <Icon size={15} className="text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="flex-1 text-sm text-gray-700">{item.label}</span>
                    <button
                      onClick={() => handleAdd(item)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex-shrink-0"
                    >
                      <Plus size={10} />
                      추가
                    </button>
                  </div>
                  {/* 시각적 예시 카드 (클릭 불가) */}
                  <div className="px-5 pb-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 pointer-events-none">
                      <ModuleSkeleton type={item.moduleType!} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { findParentGroup, type NavGroup } from './nav-config'

interface Props {
  active: string
  navGroups: NavGroup[]
  onChange: (id: string) => void
}

export default function SideNav({ active, navGroups, onChange }: Props) {
  function getActiveGroupId(): string | null {
    const parent = findParentGroup(navGroups, active)
    return parent ?? (navGroups.some(g => g.id === active) ? active : null)
  }

  const activeGroupId = getActiveGroupId()

  return (
    <nav className="h-full w-[96px] border-r border-gray-100 flex flex-col items-center py-3 gap-1 overflow-y-auto overflow-x-hidden flex-shrink-0">
      {navGroups.map((group) => {
        const Icon = group.icon
        const isActive = activeGroupId === group.id

        return (
          <button
            key={group.id}
            onClick={() => onChange(group.id)}
            title={group.label}
            className="relative w-[82px] h-[72px] flex flex-col items-center justify-center gap-1.5 rounded-xl text-xs transition-colors hover:bg-gray-50 flex-shrink-0"
          >
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-0 bg-primary/10 rounded-xl"
              />
            )}
            <Icon
              size={22}
              className={`relative ${isActive ? 'text-primary' : 'text-gray-400'}`}
              strokeWidth={1.5}
            />
            <span className={`relative text-[11px] leading-tight text-center px-1 ${isActive ? 'text-primary font-medium' : 'text-gray-400'}`}>
              {group.label.length > 5 ? group.label.slice(0, 5) + '…' : group.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

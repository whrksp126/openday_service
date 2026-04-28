'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

interface Props {
  categories: Category[]
  selected?: string
}

export default function CategoryFilter({ categories, selected }: Props) {
  const pathname = usePathname()

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8">
      <Link
        href={pathname}
        className="relative flex-shrink-0"
      >
        <span
          className={`block px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selected
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </span>
        {!selected && (
          <motion.span
            layoutId="category-indicator"
            className="absolute inset-0 bg-primary rounded-full -z-10"
          />
        )}
      </Link>

      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`${pathname}?category=${cat.slug}`}
          className="relative flex-shrink-0"
        >
          <span
            className={`block px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selected === cat.slug
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.icon} {cat.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

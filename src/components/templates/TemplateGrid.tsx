'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface Template {
  id: string
  name: string
  description: string | null
  thumbnail: string | null
  category: { name: string; slug: string }
}

interface Props {
  templates: Template[]
}

export default function TemplateGrid({ templates }: Props) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>해당 카테고리의 템플릿이 준비 중입니다.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {templates.map((template, i) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
        >
          <Link href={`/templates/${template.id}`} className="group block">
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden group-hover:shadow-md transition-shadow">
              {template.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                  미리보기
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900 truncate">{template.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{template.description ?? template.category.name}</p>
              <span className="text-xs text-primary mt-1 inline-block">템플릿 보러 가기 →</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

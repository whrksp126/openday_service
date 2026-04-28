'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  singleLine?: boolean
  defaultAlign?: 'left' | 'center' | 'right'
}

function plainToHtml(text: string, defaultAlign?: string): string {
  if (!text || text.trimStart().startsWith('<')) return text
  // 툴바에 정렬 버튼 활성화 표시를 위해 기본 정렬이 'left' 여도 명시적 스타일을 주입
  const style = defaultAlign ? ` style="text-align: ${defaultAlign}"` : ''
  return text.split('\n\n').map(para => `<p${style}>${para.split('\n').join('<br>')}</p>`).join('')
}

export default function RichTextEditor({ label, value, onChange, placeholder, rows = 4, singleLine = false, defaultAlign }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // singleLine 모드에서는 hardBreak만 허용, paragraph 간 이동 제한
        ...(singleLine ? { heading: false } : {}),
      }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
    ],
    content: plainToHtml(value || '', defaultAlign),
    onUpdate({ editor }) {
      const html = editor.getHTML()
      // <p></p> 빈 단락이면 빈 문자열로
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'outline-none text-xs leading-6 [&>p]:mb-3 [&>p:last-child]:mb-0',
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
      handleKeyDown(_, event) {
        if (singleLine && event.key === 'Enter') {
          event.preventDefault()
          return true
        }
        return false
      },
    },
  })

  // 외부 value 변경 시 에디터 내용 동기화 (모듈 전환 시 등)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const incoming = value || ''
    const normalised = plainToHtml(incoming, defaultAlign)
    if (current !== normalised && !(current === '<p></p>' && normalised === '')) {
      editor.commands.setContent(normalised)
    }
  }, [value, editor])

  if (!editor) return null

  const toolbarBtn = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`p-1 rounded transition-colors ${
        active ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )

  const minHeight = singleLine ? '36px' : `${rows * 24 + 16}px`

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <div className="border border-gray-200 rounded-xl focus-within:border-primary transition-colors overflow-hidden">
        {/* 툴바 */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
          {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold size={13} />)}
          {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic size={13} />)}
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          {toolbarBtn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft size={13} />)}
          {toolbarBtn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter size={13} />)}
          {toolbarBtn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight size={13} />)}
        </div>
        {/* 에디터 영역 */}
        <div
          className="px-3 py-2 overflow-y-auto"
          style={{ minHeight }}
          onClick={() => editor.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

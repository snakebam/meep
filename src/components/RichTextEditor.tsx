import { useRef, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, IndentIncrease, IndentDecrease } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
    isInternalChange.current = false
  }, [value])

  const exec = (command: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, val)
  }

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true
      onChange(editorRef.current.innerHTML)
    }
  }

  const buttons = [
    { icon: <Bold className="w-3.5 h-3.5" />, command: 'bold', title: 'Bold' },
    { icon: <Italic className="w-3.5 h-3.5" />, command: 'italic', title: 'Italic' },
    { icon: <Underline className="w-3.5 h-3.5" />, command: 'underline', title: 'Underline' },
    { icon: <List className="w-3.5 h-3.5" />, command: 'insertUnorderedList', title: 'Bullet list' },
    { icon: <ListOrdered className="w-3.5 h-3.5" />, command: 'insertOrderedList', title: 'Numbered list' },
    { icon: <IndentIncrease className="w-3.5 h-3.5" />, command: 'indent', title: 'Indent' },
    { icon: <IndentDecrease className="w-3.5 h-3.5" />, command: 'outdent', title: 'Outdent' },
  ]

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-surface focus-within:border-primary-300">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border">
        {buttons.map(btn => (
          <button
            key={btn.command}
            onMouseDown={e => {
              e.preventDefault()
              exec(btn.command)
            }}
            title={btn.title}
            className="p-1.5 rounded hover:bg-surface-tertiary text-text-muted hover:text-text-primary transition-colors"
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="flex-1 p-3 outline-none text-sm text-text-primary overflow-y-auto min-h-[300px] [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-text-muted"
      />
    </div>
  )
}

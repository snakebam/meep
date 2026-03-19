import { useState, useRef } from 'react'
import { Plus, Calendar, Tag } from 'lucide-react'
import type { Subject } from '../../types'

interface TaskCreateBarProps {
  subjects: Subject[]
  onAdd: (task: {
    title: string
    due_date?: string | null
    subject_id?: string | null
    note?: string | null
  }) => Promise<unknown>
}

export function TaskCreateBar({ subjects, onAdd }: TaskCreateBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [showDate, setShowDate] = useState(false)
  const [showSubject, setShowSubject] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setTitle('')
    setDueDate('')
    setSubjectId('')
    setShowDate(false)
    setShowSubject(false)
    setExpanded(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    await onAdd({
      title: title.trim(),
      due_date: dueDate || null,
      subject_id: subjectId || null,
    })
    reset()
  }

  if (!expanded) {
    return (
      <button
        onClick={() => {
          setExpanded(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-border text-sm text-text-muted hover:border-primary-300 hover:text-primary-500 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New task
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Task name..."
          autoFocus
          className="flex-1 text-sm outline-none bg-transparent text-text-primary placeholder:text-text-muted"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDate(!showDate)}
            className={`p-1.5 rounded-md transition-colors ${
              showDate || dueDate ? 'bg-primary-100 text-primary-600' : 'text-text-muted hover:bg-surface-tertiary'
            }`}
            title="Deadline"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowSubject(!showSubject)}
            className={`p-1.5 rounded-md transition-colors ${
              showSubject || subjectId ? 'bg-primary-100 text-primary-600' : 'text-text-muted hover:bg-surface-tertiary'
            }`}
            title="Link subject"
          >
            <Tag className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="ml-1 px-3 py-1 bg-primary-600 text-white rounded-md text-xs font-medium hover:bg-primary-700 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
          <button
            onClick={reset}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {(showDate || showSubject) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
          {showDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
              />
            </div>
          )}
          {showSubject && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-text-muted" />
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
              >
                <option value="">Choose subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

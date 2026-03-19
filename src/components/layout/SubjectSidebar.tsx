import { useState } from 'react'
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react'
import { getNextColor } from '../../lib/utils'
import type { Subject } from '../../types'

interface SubjectSidebarProps {
  subjects: Subject[]
  onAdd: (name: string, color: string) => Promise<Subject | null | undefined>
  onUpdate: (id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function SubjectSidebar({ subjects, onAdd, onUpdate, onDelete }: SubjectSidebarProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim()) return
    const color = getNextColor(subjects.map(s => s.color))
    await onAdd(newName.trim(), color)
    setNewName('')
    setIsAdding(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    await onUpdate(id, { name: editName.trim() })
    setEditingId(null)
  }

  return (
    <div className="w-48 border-l border-border bg-surface p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Subjects</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="text-primary-500 hover:text-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <div className="flex items-center gap-1">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Subject name..."
            autoFocus
            className="flex-1 text-sm px-2 py-1 rounded border border-border outline-none focus:border-primary-400 min-w-0"
          />
          <button onClick={handleAdd} className="text-accent-600 hover:text-accent-700">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setIsAdding(false); setNewName('') }} className="text-text-muted hover:text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {subjects.map(subject => (
          <div key={subject.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: subject.color }}
            />
            {editingId === subject.id ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(subject.id)}
                  autoFocus
                  className="flex-1 text-sm px-1 py-0 rounded border border-border outline-none focus:border-primary-400 min-w-0"
                />
                <button onClick={() => handleUpdate(subject.id)} className="text-accent-600">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-text-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-text-primary truncate flex-1">{subject.name}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={() => { setEditingId(subject.id); setEditName(subject.name) }}
                    className="text-text-muted hover:text-text-secondary p-0.5"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDelete(subject.id)}
                    className="text-text-muted hover:text-danger p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {subjects.length === 0 && !isAdding && (
          <p className="text-xs text-text-muted text-center py-2">No subjects yet</p>
        )}
      </div>
    </div>
  )
}

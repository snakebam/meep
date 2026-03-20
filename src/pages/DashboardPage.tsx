import { useState, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Check, ChevronRight, Trash2, Plus, AlertTriangle, Pencil, X, Calendar } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { formatDueDate, getNextColor } from '../lib/utils'
import type { Subject, Task } from '../types'

interface OutletContext {
  subjects: Subject[]
  addSubject: (name: string, color: string) => Promise<Subject | null | undefined>
  updateSubject: (id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
}

function getDueColor(dateStr: string): { color: string; showWarning: boolean } {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 1) return { color: 'text-red-500', showWarning: true }
  if (diff <= 3) return { color: 'text-orange-500', showWarning: true }
  return { color: 'text-accent-600', showWarning: false }
}

function MiniTaskCard({ task, onToggleDone, onDelete }: { task: Task; onToggleDone: (id: string) => void; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const due = task.due_date ? formatDueDate(task.due_date) : null
  const dueColor = task.due_date ? getDueColor(task.due_date) : null

  return (
    <div
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
        task.is_done
          ? 'border-border bg-white/60 opacity-50'
          : 'border-white/40 bg-white/60 hover:bg-white/80'
      }`}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <button
        onClick={e => { e.stopPropagation(); onToggleDone(task.id) }}
        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          task.is_done
            ? 'bg-accent-500 border-accent-500 text-white'
            : 'border-border hover:border-primary-400'
        }`}
      >
        {task.is_done && <Check className="w-2.5 h-2.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-xs ${task.is_done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {task.title}
        </span>
      </div>

      {due && dueColor && !task.is_done && (
        <span className={`flex items-center gap-0.5 text-[10px] shrink-0 font-medium ${dueColor.color}`}>
          {dueColor.showWarning && <AlertTriangle className="w-2.5 h-2.5" />}
          {due.label}
        </span>
      )}

      <button
        onClick={e => { e.stopPropagation(); onDelete(task.id) }}
        className="hidden group-hover:block shrink-0 text-text-muted hover:text-danger transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
    </div>
  )
}

/** Inline quick-add task for a specific subject */
function InlineAddTask({ subjectId, onAdd }: { subjectId: string | null; onAdd: (task: { title: string; due_date?: string | null; subject_id?: string | null }) => Promise<unknown> }) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showDate, setShowDate] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => { setTitle(''); setDueDate(''); setShowDate(false); setExpanded(false) }

  const handleSubmit = async () => {
    if (!title.trim()) return
    await onAdd({ title: title.trim(), due_date: dueDate || null, subject_id: subjectId })
    reset()
  }

  if (!expanded) {
    return (
      <button
        onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-1 w-full px-2 py-1.5 rounded-lg text-[10px] text-text-muted hover:text-primary-500 hover:bg-white/50 transition-colors"
      >
        <Plus className="w-3 h-3" />
        New task
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-primary-200 bg-white/80 p-2">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') reset() }}
          placeholder="Task name..."
          autoFocus
          className="flex-1 text-xs outline-none bg-transparent text-text-primary placeholder:text-text-muted min-w-0"
        />
        <button
          onClick={() => setShowDate(!showDate)}
          className={`p-1 rounded transition-colors ${showDate || dueDate ? 'bg-primary-100 text-primary-600' : 'text-text-muted hover:bg-surface-tertiary'}`}
        >
          <Calendar className="w-3 h-3" />
        </button>
        <button onClick={handleSubmit} disabled={!title.trim()} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[10px] font-medium disabled:opacity-40">Add</button>
        <button onClick={reset} className="text-[10px] text-text-muted px-1">Cancel</button>
      </div>
      {showDate && (
        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border">
          <Calendar className="w-3 h-3 text-text-muted" />
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-[10px] px-1.5 py-0.5 rounded border border-border outline-none focus:border-primary-400" />
        </div>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useOutletContext<OutletContext>()
  const { tasks, addTask, toggleDone, deleteTask } = useTasks()

  const [addingSubject, setAddingSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editSubjectName, setEditSubjectName] = useState('')

  const activeTasks = tasks
    .filter(t => !t.is_done)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })

  const subjectGroups: { subject: Subject | null; tasks: Task[] }[] = []
  for (const subject of subjects) {
    subjectGroups.push({ subject, tasks: activeTasks.filter(t => t.subject_id === subject.id) })
  }
  const unassigned = activeTasks.filter(t => !t.subject_id)
  if (unassigned.length > 0) {
    subjectGroups.push({ subject: null, tasks: unassigned })
  }

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return
    await addSubject(newSubjectName.trim(), getNextColor(subjects.map(s => s.color)))
    setNewSubjectName('')
    setAddingSubject(false)
  }

  const handleUpdateSubject = async (id: string) => {
    if (!editSubjectName.trim()) return
    await updateSubject(id, { name: editSubjectName.trim() })
    setEditingSubjectId(null)
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-primary">Up next...</h2>

      {subjectGroups.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">No subjects yet. Add one below!</p>
      )}

      {/* Subject columns */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {subjectGroups.map(group => {
          const color = group.subject?.color ?? '#94a3b8'
          return (
            <div
              key={group.subject?.id ?? '__none__'}
              className="rounded-xl border overflow-hidden h-[280px] flex flex-col relative"
              style={{ borderColor: color + '30', backgroundColor: color + '08' }}
            >
              {/* Color tab right */}
              {group.subject && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-1.5 rounded-l-sm"
                  style={{ backgroundColor: color }}
                />
              )}

              {/* Header */}
              <div
                className="group flex items-center gap-2 px-3 py-2 shrink-0 pr-4"
                style={{ borderBottom: `1px solid ${color}20` }}
              >

                {editingSubjectId === group.subject?.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <input
                      value={editSubjectName}
                      onChange={e => setEditSubjectName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateSubject(group.subject!.id)}
                      autoFocus
                      className="flex-1 text-xs px-1 py-0 rounded border border-border outline-none focus:border-primary-400 min-w-0 bg-white"
                    />
                    <button onClick={() => handleUpdateSubject(group.subject!.id)} className="text-accent-600"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditingSubjectId(null)} className="text-text-muted"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <>
                    <span
                      className="text-xs font-semibold text-text-secondary uppercase tracking-wide cursor-pointer hover:text-primary-600 transition-colors"
                      onClick={() => group.subject && window.location.assign(`/subjects/${group.subject.id}`)}
                    >
                      {group.subject?.name ?? 'No subject'}
                    </span>
                    <span className="text-[10px] text-text-muted">({group.tasks.length})</span>
                    {group.subject && (
                      <div className="hidden group-hover:flex items-center gap-0.5 ml-auto">
                        <button onClick={() => { setEditingSubjectId(group.subject!.id); setEditSubjectName(group.subject!.name) }} className="text-text-muted hover:text-text-secondary p-0.5">
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button onClick={() => deleteSubject(group.subject!.id)} className="text-text-muted hover:text-danger p-0.5">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Task list - scrollable */}
              <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
                {group.tasks.map(task => (
                  <MiniTaskCard key={task.id} task={task} onToggleDone={toggleDone} onDelete={deleteTask} />
                ))}

                {group.tasks.length === 0 && (
                  <p className="text-[10px] text-text-muted/50 text-center py-4">No tasks yet</p>
                )}
              </div>

              {/* Inline add task */}
              <div className="px-2 pb-2 shrink-0">
                <div className="flex items-center gap-1">
                  <InlineAddTask subjectId={group.subject?.id ?? null} onAdd={addTask} />
                  <button
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-text-muted hover:text-primary-500 hover:bg-white/50 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3 h-3" />
                    Becijferde opdracht
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add subject */}
      <div className="flex justify-start mt-1">
        {addingSubject ? (
          <div className="flex items-center gap-1.5">
            <input
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
              placeholder="Subject name..."
              autoFocus
              className="text-xs px-2 py-1 rounded-lg border border-border outline-none focus:border-primary-400 w-32 bg-surface"
            />
            <button onClick={handleAddSubject} className="text-xs px-2 py-1 bg-primary-600 text-white rounded-lg">OK</button>
            <button onClick={() => { setAddingSubject(false); setNewSubjectName('') }} className="text-xs px-2 py-1 text-text-muted">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAddingSubject(true)} className="flex items-center gap-1 text-xs text-text-muted hover:text-primary-500 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add subject
          </button>
        )}
      </div>

      {/* Completed tasks */}
      {tasks.filter(t => t.is_done).length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5 px-1">
            Completed ({tasks.filter(t => t.is_done).length})
          </p>
          <div className="flex flex-col gap-1">
            {tasks.filter(t => t.is_done).map(task => (
              <MiniTaskCard key={task.id} task={task} onToggleDone={toggleDone} onDelete={deleteTask} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

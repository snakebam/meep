import { useState, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, Check, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { formatDueDate } from '../lib/utils'
import type { Subject, Task } from '../types'

interface OutletContext {
  subjects: Subject[]
}

function getDueColor(dateStr: string): { color: string; showWarning: boolean } {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 1) return { color: 'text-danger', showWarning: true }
  if (diff <= 3) return { color: 'text-warning', showWarning: true }
  return { color: 'text-accent-600', showWarning: false }
}

function TaskRow({ task, onToggleDone, onDelete }: { task: Task; onToggleDone: (id: string) => void; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const due = task.due_date ? formatDueDate(task.due_date) : null
  const dueColor = task.due_date ? getDueColor(task.due_date) : null

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
        task.is_done
          ? 'border-border bg-surface-tertiary opacity-60'
          : 'border-border bg-surface hover:border-primary-200'
      }`}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <button
        onClick={e => { e.stopPropagation(); onToggleDone(task.id) }}
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          task.is_done
            ? 'bg-accent-500 border-accent-500 text-white'
            : 'border-border hover:border-primary-400'
        }`}
      >
        {task.is_done && <Check className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-sm ${task.is_done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {task.title}
        </span>
      </div>

      {due && dueColor && !task.is_done && (
        <span className={`flex items-center gap-0.5 text-xs shrink-0 font-medium ${dueColor.color}`}>
          {dueColor.showWarning && <AlertTriangle className="w-3 h-3" />}
          {due.label}
        </span>
      )}

      <button
        onClick={e => { e.stopPropagation(); onDelete(task.id) }}
        className="hidden group-hover:block shrink-0 text-text-muted hover:text-danger transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
    </div>
  )
}

export function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { subjects } = useOutletContext<OutletContext>()
  const { tasks, addTask, toggleDone, deleteTask } = useTasks()

  const subject = subjects.find(s => s.id === subjectId)

  // Quick add state
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [showDate, setShowDate] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const subjectTasks = tasks
    .filter(t => t.subject_id === subjectId)
    .sort((a, b) => {
      // Active first, then by due date
      if (a.is_done !== b.is_done) return a.is_done ? 1 : -1
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })

  const activeTasks = subjectTasks.filter(t => !t.is_done)
  const doneTasks = subjectTasks.filter(t => t.is_done)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await addTask({
      title: newTitle.trim(),
      due_date: newDueDate || null,
      subject_id: subjectId!,
    })
    setNewTitle('')
    setNewDueDate('')
    setAdding(false)
    setShowDate(false)
  }

  if (!subject) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <span className="text-sm text-text-muted">Subject not found</span>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="relative flex items-center gap-2 pl-3">
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
            style={{ backgroundColor: subject.color }}
          />
          <h2 className="text-lg font-semibold text-text-primary">{subject.name}</h2>
        </div>

        <span className="text-sm text-text-muted">
          {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add task */}
      {adding ? (
        <div className="rounded-xl border border-primary-200 bg-surface p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Task name..."
              autoFocus
              className="flex-1 text-sm outline-none bg-transparent text-text-primary placeholder:text-text-muted"
            />
            <button
              onClick={() => setShowDate(!showDate)}
              className={`p-1.5 rounded-md transition-colors ${
                showDate || newDueDate ? 'bg-primary-100 text-primary-600' : 'text-text-muted hover:bg-surface-tertiary'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="px-3 py-1 bg-primary-600 text-white rounded-md text-xs font-medium hover:bg-primary-700 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewTitle(''); setNewDueDate(''); setShowDate(false) }}
              className="px-2 py-1 text-xs text-text-muted"
            >
              Cancel
            </button>
          </div>
          {showDate && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
              />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            setAdding(true)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-border text-sm text-text-muted hover:border-primary-300 hover:text-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New task in {subject.name}
        </button>
      )}

      {/* Task list - full width */}
      {activeTasks.length === 0 && doneTasks.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">
          No tasks for {subject.name} yet.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {activeTasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onToggleDone={toggleDone}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {doneTasks.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5 px-1">
            Completed ({doneTasks.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {doneTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleDone={toggleDone}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

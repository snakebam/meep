import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Trash2 } from 'lucide-react'
import { formatDueDate } from '../../lib/utils'
import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggleDone, onDelete }: TaskCardProps) {
  const navigate = useNavigate()
  const due = task.due_date ? formatDueDate(task.due_date) : null

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

      {task.subject && (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
          style={{
            backgroundColor: task.subject.color + '20',
            color: task.subject.color,
          }}
        >
          {task.subject.name}
        </span>
      )}

      {due && (
        <span className={`text-xs shrink-0 ${due.urgent ? 'text-danger font-medium' : 'text-text-muted'}`}>
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

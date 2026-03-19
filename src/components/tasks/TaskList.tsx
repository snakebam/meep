import { TaskCard } from './TaskCard'
import { TaskCreateBar } from './TaskCreateBar'
import type { Task, Subject } from '../../types'

interface TaskListProps {
  tasks: Task[]
  subjects: Subject[]
  onAdd: (task: {
    title: string
    due_date?: string | null
    subject_id?: string | null
    note?: string | null
  }) => Promise<unknown>
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, subjects, onAdd, onToggleDone, onDelete }: TaskListProps) {
  const activeTasks = tasks.filter(t => !t.is_done)
  const doneTasks = tasks.filter(t => t.is_done)

  return (
    <div className="flex flex-col gap-2">
      <TaskCreateBar subjects={subjects} onAdd={onAdd} />

      {activeTasks.length === 0 && doneTasks.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">
          No tasks yet. Create your first task!
        </p>
      )}

      {activeTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleDone={onToggleDone}
          onDelete={onDelete}
        />
      ))}

      {doneTasks.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5 px-1">
            Completed ({doneTasks.length})
          </p>
          {doneTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

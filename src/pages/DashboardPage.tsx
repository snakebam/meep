import { useOutletContext } from 'react-router-dom'
import { TaskList } from '../components/tasks/TaskList'
import { useTasks } from '../hooks/useTasks'
import type { Subject } from '../types'

interface OutletContext {
  subjects: Subject[]
}

export function DashboardPage() {
  const { subjects } = useOutletContext<OutletContext>()
  const { tasks, addTask, toggleDone, deleteTask } = useTasks()

  return (
    <div className="p-4 flex flex-col gap-4">
      <TaskList
        tasks={tasks}
        subjects={subjects}
        onAdd={addTask}
        onToggleDone={toggleDone}
        onDelete={deleteTask}
      />
    </div>
  )
}

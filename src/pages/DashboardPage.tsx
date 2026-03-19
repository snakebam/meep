import { useOutletContext } from 'react-router-dom'
import { TaskList } from '../components/tasks/TaskList'
import { Heatmap } from '../components/charts/Heatmap'
import { GrowthChart } from '../components/charts/GrowthChart'
import { useTasks } from '../hooks/useTasks'
import type { Subject } from '../types'

interface OutletContext {
  subjects: Subject[]
  stats: {
    heatmapData: { day: string; count: number }[]
    weeklyData: { day: string; count: number }[]
  }
}

export function DashboardPage() {
  const { subjects, stats } = useOutletContext<OutletContext>()
  const { tasks, addTask, toggleDone, deleteTask } = useTasks()

  return (
    <div className="p-4 flex flex-col gap-6 max-w-2xl">
      <TaskList
        tasks={tasks}
        subjects={subjects}
        onAdd={addTask}
        onToggleDone={toggleDone}
        onDelete={deleteTask}
      />

      <div className="grid grid-cols-2 gap-4">
        <Heatmap data={stats.heatmapData} />
        <GrowthChart data={stats.weeklyData} />
      </div>
    </div>
  )
}

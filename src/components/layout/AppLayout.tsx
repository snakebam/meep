import { Outlet } from 'react-router-dom'
import { TopStatsBar } from './TopStatsBar'
import { PomodoroTimer } from '../timer/PomodoroTimer'
import { Heatmap } from '../charts/Heatmap'
import { GrowthChart } from '../charts/GrowthChart'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useSubjects } from '../../hooks/useSubjects'
import { useStats } from '../../hooks/useStats'

export function AppLayout() {
  const pomodoro = usePomodoro()
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects()
  const stats = useStats()

  return (
    <div className="min-h-screen flex flex-col">
      <TopStatsBar streak={stats.streak} pomosToday={stats.pomosToday} />

      <div className="flex flex-1">
        {/* Left: Timer + Heatmap + Growth */}
        <div className="w-64 border-r border-border bg-surface p-4 flex flex-col items-center pt-6 gap-6 overflow-auto shrink-0">
          <PomodoroTimer
            remaining={pomodoro.remaining}
            timerState={pomodoro.timerState}
            progress={pomodoro.progress}
            subjectId={pomodoro.subjectId}
            subjects={subjects}
            onSubjectChange={pomodoro.setSubjectId}
            onStart={pomodoro.start}
            onStop={pomodoro.stop}
            onComplete={pomodoro.justCompleted}
          />

          <div className="w-full border-t border-border pt-4">
            <Heatmap data={stats.heatmapData} />
          </div>

          <div className="w-full border-t border-border pt-4">
            <GrowthChart data={stats.weeklyData} />
          </div>
        </div>

        {/* Center: Main content - full width, no right sidebar */}
        <div className="flex-1 overflow-auto">
          <Outlet context={{ subjects, addSubject, updateSubject, deleteSubject, stats }} />
        </div>
      </div>
    </div>
  )
}

import { Outlet } from 'react-router-dom'
import { PomodoroTimer } from '../timer/PomodoroTimer'
import { Heatmap } from '../charts/Heatmap'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useSubjects } from '../../hooks/useSubjects'
import { useStats } from '../../hooks/useStats'

export function AppLayout() {
  const pomodoro = usePomodoro()
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects()
  const stats = useStats()

  return (
    <div className="min-h-screen flex">
      {/* Left: Timer + Heatmap */}
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
          streak={stats.streak}
          pomosToday={stats.pomosToday}
        />

        <div className="w-full border-t border-border pt-4 flex-1 min-h-0">
          <Heatmap data={stats.heatmapData} onSetDayCount={stats.setDayCount} />
        </div>
      </div>

      {/* Center: Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet context={{ subjects, addSubject, updateSubject, deleteSubject, stats }} />
      </div>
    </div>
  )
}

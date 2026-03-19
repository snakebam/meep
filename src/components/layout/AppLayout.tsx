import { Outlet } from 'react-router-dom'
import { TopStatsBar } from './TopStatsBar'
import { SubjectSidebar } from './SubjectSidebar'
import { PomodoroTimer } from '../timer/PomodoroTimer'
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
        {/* Left: Timer */}
        <div className="w-56 border-r border-border bg-surface p-4 flex flex-col items-center pt-6">
          <PomodoroTimer
            remaining={pomodoro.remaining}
            timerState={pomodoro.timerState}
            progress={pomodoro.progress}
            subjectId={pomodoro.subjectId}
            subjects={subjects}
            onSubjectChange={pomodoro.setSubjectId}
            onStart={() => {
              pomodoro.start()
              // Refresh stats after a pomo completes (handled in timer)
            }}
            onStop={pomodoro.stop}
          />
        </div>

        {/* Center: Main content */}
        <div className="flex-1 overflow-auto">
          <Outlet context={{ subjects, stats }} />
        </div>

        {/* Right: Subject sidebar */}
        <SubjectSidebar
          subjects={subjects}
          onAdd={addSubject}
          onUpdate={updateSubject}
          onDelete={deleteSubject}
        />
      </div>
    </div>
  )
}

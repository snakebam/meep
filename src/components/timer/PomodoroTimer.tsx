import { Play, Square } from 'lucide-react'
import { TimerCircle } from './TimerCircle'
import { formatTime } from '../../lib/utils'
import type { Subject, TimerState } from '../../types'

interface PomodoroTimerProps {
  remaining: number
  timerState: TimerState
  progress: number
  subjectId: string | null
  subjects: Subject[]
  onSubjectChange: (id: string | null) => void
  onStart: () => void
  onStop: () => void
}

export function PomodoroTimer({
  remaining,
  timerState,
  progress,
  subjectId,
  subjects,
  onSubjectChange,
  onStart,
  onStop,
}: PomodoroTimerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <TimerCircle progress={progress} size={140}>
        <span className="text-3xl font-mono font-semibold text-text-primary">
          {formatTime(remaining)}
        </span>
        {timerState === 'completed' && (
          <span className="text-xs text-accent-600 font-medium">Done!</span>
        )}
      </TimerCircle>

      <div className="flex items-center gap-2">
        {timerState === 'idle' ? (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        ) : timerState === 'running' ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        ) : null}
      </div>

      {timerState === 'idle' && (
        <select
          value={subjectId ?? ''}
          onChange={e => onSubjectChange(e.target.value || null)}
          className="text-xs px-2 py-1 rounded border border-border bg-surface text-text-secondary outline-none"
        >
          <option value="">No subject</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {timerState === 'running' && subjectId && (
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: subjects.find(s => s.id === subjectId)?.color + '20',
            color: subjects.find(s => s.id === subjectId)?.color,
          }}
        >
          {subjects.find(s => s.id === subjectId)?.name}
        </span>
      )}

      <span className="text-xs text-text-muted">This week</span>
    </div>
  )
}

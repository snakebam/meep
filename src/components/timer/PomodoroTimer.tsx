import { Play, Square, Flame, Timer } from 'lucide-react'
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
  onComplete?: boolean
  streak: number
  pomosToday: number
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
  onComplete,
  streak,
  pomosToday,
}: PomodoroTimerProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <TimerCircle progress={progress} size={140}>
        <span className="text-3xl font-mono font-semibold text-text-primary">
          {formatTime(remaining)}
        </span>
        {timerState === 'completed' && (
          <span className="text-xs text-accent-600 font-medium">Done!</span>
        )}
      </TimerCircle>

      {/* YIPEEE notification */}
      {onComplete && (
        <div className="px-4 py-2 bg-accent-100 border border-accent-300 rounded-xl text-center animate-bounce">
          <span className="text-sm font-bold text-accent-700">YIPEEE!</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {timerState === 'idle' ? (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            LOCK IN
          </button>
        ) : timerState === 'running' ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-danger text-white rounded-lg text-sm font-bold hover:bg-danger/80 transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            LOCK OUT
          </button>
        ) : null}
      </div>

      {timerState === 'idle' && (
        <select
          value={subjectId ?? ''}
          onChange={e => onSubjectChange(e.target.value || null)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-secondary outline-none focus:border-primary-400 cursor-pointer"
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

      {/* Streak & Pomos today */}
      <div className="w-full flex items-center justify-center gap-3 px-2 py-2 rounded-lg bg-surface-tertiary">
        <div className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-warning" />
          <span className="text-[11px] font-semibold text-text-primary">{streak}</span>
          <span className="text-[10px] text-text-muted">day{streak !== 1 ? 's' : ''}</span>
        </div>
        <div className="w-px h-3.5 bg-border" />
        <div className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-[11px] font-semibold text-text-primary">{pomosToday}</span>
          <span className="text-[10px] text-text-muted">today</span>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TimerState } from '../types'

const POMODORO_DURATION = 25 * 60 // 25 minutes in seconds
const STORAGE_KEY = 'meep_timer'

interface TimerStorage {
  remaining: number
  subjectId: string | null
  startedAt: string
  state: TimerState
}

function loadTimerState(): TimerStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as TimerStorage
    if (data.state !== 'running') return null
    // Calculate how much time has elapsed since we saved
    const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000)
    const totalElapsed = POMODORO_DURATION - data.remaining + elapsed
    const newRemaining = POMODORO_DURATION - totalElapsed
    if (newRemaining <= 0) return null // Timer would have finished
    return { ...data, remaining: newRemaining }
  } catch {
    return null
  }
}

function saveTimerState(state: TimerStorage | null) {
  if (state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function usePomodoro() {
  const saved = useRef(loadTimerState())
  const [remaining, setRemaining] = useState(saved.current?.remaining ?? POMODORO_DURATION)
  const [timerState, setTimerState] = useState<TimerState>(saved.current?.state ?? 'idle')
  const [subjectId, setSubjectId] = useState<string | null>(saved.current?.subjectId ?? null)
  const [startedAt, setStartedAt] = useState<string | null>(saved.current?.startedAt ?? null)
  const [justCompleted, setJustCompleted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const complete = useCallback(async () => {
    clearTimer()
    setTimerState('completed')
    setRemaining(0)
    setJustCompleted(true)
    saveTimerState(null)

    // Record the pomodoro
    if (startedAt) {
      await supabase.from('pomodoros').insert({
        subject_id: subjectId,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        duration: POMODORO_DURATION,
        completed: true,
      })
    }

    // Play completion sound
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.3
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      osc.stop(ctx.currentTime + 0.5)
    } catch {
      // Audio not available
    }

    // Reset after showing YIPEEE
    setTimeout(() => {
      setTimerState('idle')
      setRemaining(POMODORO_DURATION)
      setSubjectId(null)
      setStartedAt(null)
      setJustCompleted(false)
    }, 3000)
  }, [clearTimer, startedAt, subjectId])

  const start = useCallback(() => {
    const now = new Date().toISOString()
    setTimerState('running')
    setStartedAt(now)
    setRemaining(POMODORO_DURATION)
    saveTimerState({
      remaining: POMODORO_DURATION,
      subjectId,
      startedAt: now,
      state: 'running',
    })
  }, [subjectId])

  const stop = useCallback(() => {
    clearTimer()
    setTimerState('idle')
    setRemaining(POMODORO_DURATION)
    setSubjectId(null)
    setStartedAt(null)
    saveTimerState(null)
  }, [clearTimer])

  // Tick effect
  useEffect(() => {
    if (timerState !== 'running') return

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1
        if (next <= 0) {
          complete()
          return 0
        }
        // Save state periodically (every 5 seconds)
        if (next % 5 === 0 && startedAt) {
          saveTimerState({ remaining: next, subjectId, startedAt, state: 'running' })
        }
        return next
      })
    }, 1000)

    return () => clearTimer()
  }, [timerState, clearTimer, complete, subjectId, startedAt])

  const progress = 1 - remaining / POMODORO_DURATION

  return {
    remaining,
    timerState,
    subjectId,
    setSubjectId,
    start,
    stop,
    progress,
    totalDuration: POMODORO_DURATION,
    justCompleted,
  }
}

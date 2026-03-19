import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { HeatmapDay } from '../types'

export function useStats() {
  const [streak, setStreak] = useState(0)
  const [pomosToday, setPomosToday] = useState(0)
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([])
  const [weeklyData, setWeeklyData] = useState<{ day: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    // Get all completed pomodoros
    const { data: pomodoros } = await supabase
      .from('pomodoros')
      .select('started_at')
      .eq('completed', true)
      .order('started_at', { ascending: false })

    if (!pomodoros) {
      setLoading(false)
      return
    }

    // Calculate pomos today
    const today = new Date().toISOString().split('T')[0]
    const todayCount = pomodoros.filter(p => p.started_at.startsWith(today)).length
    setPomosToday(todayCount)

    // Group by day
    const dayMap = new Map<string, number>()
    for (const p of pomodoros) {
      const day = p.started_at.split('T')[0]
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
    }

    // Calculate streak
    let currentStreak = 0
    const d = new Date()
    // If no pomos today, check if yesterday was the last day
    if (!dayMap.has(today)) {
      d.setDate(d.getDate() - 1)
    }
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (dayMap.has(key)) {
        currentStreak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    setStreak(currentStreak)

    // Heatmap: last 35 days
    const heatmap: HeatmapDay[] = []
    for (let i = 34; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      heatmap.push({ day: key, count: dayMap.get(key) ?? 0 })
    }
    setHeatmapData(heatmap)

    // Weekly: last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekly: { day: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      weekly.push({ day: dayNames[date.getDay()], count: dayMap.get(key) ?? 0 })
    }
    setWeeklyData(weekly)

    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { streak, pomosToday, heatmapData, weeklyData, loading, refetch: fetch }
}

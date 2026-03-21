import { useState } from 'react'
import type { HeatmapDay } from '../../types'

interface HeatmapProps {
  data: HeatmapDay[]
  onSetDayCount?: (day: string, count: number) => void
}

function getColor(count: number): string {
  if (count === 0) return 'var(--color-surface-tertiary)'
  if (count === 1) return '#3d3520'
  if (count <= 2) return '#5c4f2e'
  if (count <= 3) return '#8a6d20'
  if (count <= 5) return '#b8912a'
  if (count <= 8) return '#c9a030'
  return '#D4A934'
}

export function Heatmap({ data, onSetDayCount }: HeatmapProps) {
  const [editingDay, setEditingDay] = useState<{ day: string; count: number } | null>(null)

  const months: {
    name: string
    weeks: { day: string; count: number; dayNum: number; isToday: boolean }[][]
  }[] = []

  if (data.length > 0) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const today = new Date().toISOString().split('T')[0]

    const dayMap = new Map<string, number>()
    for (const d of data) dayMap.set(d.day, d.count)

    const firstDate = new Date(data[0].day + 'T00:00:00')
    const lastDate = new Date(data[data.length - 1].day + 'T00:00:00')

    // Only show the current month
    const now = new Date()
    let current = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    while (current <= end) {
      const year = current.getFullYear()
      const month = current.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const firstDow = (new Date(year, month, 1).getDay() + 6) % 7

      const weeks: { day: string; count: number; dayNum: number; isToday: boolean }[][] = []
      let week: typeof weeks[0] = []

      for (let i = 0; i < firstDow; i++) {
        week.push({ day: '', count: 0, dayNum: 0, isToday: false })
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        week.push({ day: dateStr, count: dayMap.get(dateStr) ?? 0, dayNum: d, isToday: dateStr === today })
        if (week.length === 7) { weeks.push(week); week = [] }
      }
      if (week.length > 0) {
        while (week.length < 7) week.push({ day: '', count: 0, dayNum: 0, isToday: false })
        weeks.push(week)
      }

      months.push({ name: monthNames[month], weeks })
      current = new Date(year, month + 1, 1)
    }
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const handleCellClick = (cell: { day: string; count: number; dayNum: number }) => {
    if (!cell.day || !onSetDayCount) return
    setEditingDay({ day: cell.day, count: cell.count })
  }

  const handleCountSubmit = () => {
    if (!editingDay || !onSetDayCount) return
    onSetDayCount(editingDay.day, editingDay.count)
    setEditingDay(null)
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Activity</h3>

      {/* Edit popover */}
      {editingDay && (
        <div className="mb-2 p-2 rounded-lg border border-border bg-surface flex items-center gap-2">
          <span className="text-[10px] text-text-muted">{editingDay.day}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditingDay({ ...editingDay, count: Math.max(0, editingDay.count - 1) })}
              className="w-5 h-5 rounded bg-surface-tertiary text-text-secondary text-xs font-bold flex items-center justify-center hover:bg-surface-secondary"
            >
              −
            </button>
            <span className="text-xs font-semibold text-text-primary w-4 text-center">{editingDay.count}</span>
            <button
              onClick={() => setEditingDay({ ...editingDay, count: editingDay.count + 1 })}
              className="w-5 h-5 rounded bg-surface-tertiary text-text-secondary text-xs font-bold flex items-center justify-center hover:bg-surface-secondary"
            >
              +
            </button>
          </div>
          <button onClick={handleCountSubmit} className="text-[10px] px-1.5 py-0.5 bg-primary-600 text-white rounded font-medium">OK</button>
          <button onClick={() => setEditingDay(null)} className="text-[10px] text-text-muted">✕</button>
        </div>
      )}

      <div className="overflow-y-auto flex-1">
        <div className="flex flex-col gap-4">
          {months.map((month, mi) => (
            <div key={mi}>
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5 text-center">
                {month.name}
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {dayLabels.map((label, i) => (
                      <th key={i} className="pb-1">
                        <span className="text-[8px] font-medium text-text-muted">{label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {month.weeks.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((cell, ci) => (
                        <td key={ci} className="p-[1.5px] text-center">
                          {cell.dayNum > 0 ? (
                            <div
                              className={`aspect-square rounded-[4px] flex items-center justify-center ${
                                cell.isToday ? 'ring-1 ring-primary-400' : ''
                              } ${cell.day && onSetDayCount ? 'cursor-pointer hover:ring-1 hover:ring-primary-300' : ''} ${
                                editingDay?.day === cell.day ? 'ring-2 ring-primary-500' : ''
                              }`}
                              style={{ backgroundColor: getColor(cell.count) }}
                              title={`${cell.day}: ${cell.count} pomodoros`}
                              onClick={() => handleCellClick(cell)}
                            >
                              <span className={`text-[8px] font-medium leading-none ${cell.count > 0 ? 'text-white' : 'text-text-muted'}`}>
                                {cell.dayNum}
                              </span>
                            </div>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

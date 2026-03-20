import type { HeatmapDay } from '../../types'

interface HeatmapProps {
  data: HeatmapDay[]
}

function getColor(count: number): string {
  if (count === 0) return 'var(--color-surface-tertiary)'
  if (count === 1) return '#bbf7d0'
  if (count <= 2) return '#86efac'
  if (count <= 3) return '#4ade80'
  if (count <= 5) return '#22c55e'
  if (count <= 8) return '#16a34a'
  return '#15803d'
}

export function Heatmap({ data }: HeatmapProps) {
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

    let current = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
    const end = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0)

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

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Activity</h3>

      <div className="overflow-y-auto max-h-[280px]">
        <div className="flex flex-col gap-3">
          {months.map((month, mi) => (
            <div key={mi} className="shrink-0">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1 text-center">
                {month.name}
              </div>
              <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
                {dayLabels.map((label, i) => (
                  <div key={i} className="w-[18px] h-[12px] flex items-center justify-center">
                    <span className="text-[7px] text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
              {month.weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-[2px]">
                  {week.map((cell, ci) => (
                    <div
                      key={ci}
                      className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center ${
                        cell.isToday ? 'ring-1 ring-primary-400' : ''
                      }`}
                      style={{ backgroundColor: cell.day ? getColor(cell.count) : 'transparent' }}
                      title={cell.day ? `${cell.day}: ${cell.count} pomodoros` : ''}
                    >
                      {cell.dayNum > 0 && (
                        <span className={`text-[7px] font-medium ${cell.count > 0 ? 'text-white' : 'text-text-muted'}`}>
                          {cell.dayNum}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

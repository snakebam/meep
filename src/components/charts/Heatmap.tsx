import type { HeatmapDay } from '../../types'

interface HeatmapProps {
  data: HeatmapDay[]
}

function getColor(count: number): string {
  if (count === 0) return 'var(--color-surface-tertiary)'
  if (count === 1) return 'var(--color-accent-200)'
  if (count <= 3) return 'var(--color-accent-400)'
  if (count <= 5) return 'var(--color-accent-500)'
  return 'var(--color-accent-700)'
}

export function Heatmap({ data }: HeatmapProps) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Organize data into a grid: 7 rows (days) × N columns (weeks)
  // We need to figure out which day-of-week each data point falls on
  const cells: { day: string; count: number; dayOfWeek: number; weekIndex: number }[] = []

  if (data.length > 0) {
    const firstDate = new Date(data[0].day + 'T00:00:00')
    // JS getDay(): 0=Sun, we want 0=Mon
    const toDow = (d: Date) => (d.getDay() + 6) % 7

    let weekIndex = 0
    let lastDow = toDow(firstDate)

    for (const item of data) {
      const date = new Date(item.day + 'T00:00:00')
      const dow = toDow(date)
      if (dow < lastDow) weekIndex++
      lastDow = dow
      cells.push({ ...item, dayOfWeek: dow, weekIndex })
    }
  }

  const numWeeks = cells.length > 0 ? cells[cells.length - 1].weekIndex + 1 : 5

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Month</h3>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map(label => (
            <div key={label} className="w-4 h-4 flex items-center justify-end">
              <span className="text-[10px] text-text-muted">{label}</span>
            </div>
          ))}
        </div>
        {Array.from({ length: numWeeks }, (_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, dayIdx) => {
              const cell = cells.find(c => c.weekIndex === weekIdx && c.dayOfWeek === dayIdx)
              return (
                <div
                  key={dayIdx}
                  className="w-4 h-4 rounded-sm transition-colors"
                  style={{ backgroundColor: getColor(cell?.count ?? 0) }}
                  title={cell ? `${cell.day}: ${cell.count} pomodoros` : ''}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[10px] text-text-muted">Less</span>
        {[0, 1, 2, 4, 6].map(n => (
          <div
            key={n}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(n) }}
          />
        ))}
        <span className="text-[10px] text-text-muted">More</span>
      </div>
    </div>
  )
}

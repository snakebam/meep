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
  const cells: { day: string; count: number; dayOfWeek: number; weekIndex: number }[] = []

  if (data.length > 0) {
    const firstDate = new Date(data[0].day + 'T00:00:00')
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
  const shortLabels = ['M', '', 'W', '', 'F', '', 'S']

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">Activity</h3>
      </div>

      <div className="flex gap-[3px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] shrink-0 mr-0.5">
          {shortLabels.map((label, i) => (
            <div key={i} className="h-[14px] flex items-center justify-end">
              <span className="text-[9px] text-text-muted leading-none">{label}</span>
            </div>
          ))}
        </div>

        {/* Week columns - stretch to fill sidebar width */}
        {Array.from({ length: numWeeks }, (_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px] flex-1 min-w-0">
            {Array.from({ length: 7 }, (_, dayIdx) => {
              const cell = cells.find(c => c.weekIndex === weekIdx && c.dayOfWeek === dayIdx)
              return (
                <div
                  key={dayIdx}
                  className="h-[14px] rounded-[3px] transition-colors"
                  style={{ backgroundColor: getColor(cell?.count ?? 0) }}
                  title={cell ? `${cell.day}: ${cell.count} pomodoros` : ''}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[9px] text-text-muted">Less</span>
        {[0, 1, 2, 4, 6].map(n => (
          <div
            key={n}
            className="w-[10px] h-[10px] rounded-[2px]"
            style={{ backgroundColor: getColor(n) }}
          />
        ))}
        <span className="text-[9px] text-text-muted">More</span>
      </div>
    </div>
  )
}

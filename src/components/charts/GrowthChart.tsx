import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface GrowthChartProps {
  data: { day: string; count: number }[]
}

// 12 shades of green for 1-12 pomos
const GREEN_SHADES = [
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac',
  '#4ade80', '#22c55e', '#16a34a', '#15803d',
  '#166534', '#14532d', '#052e16', '#022c22',
]

function getGreenForCount(count: number): string {
  if (count <= 0) return GREEN_SHADES[0]
  return GREEN_SHADES[Math.min(count - 1, 11)]
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Profile growth</h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={20}
              domain={[0, 12]}
              ticks={[0, 3, 6, 9, 12]}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
              formatter={(value) => [`${value} pomodoros`, '']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--color-accent-500)"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => (
                <circle
                  key={payload.day}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={getGreenForCount(payload.count)}
                  stroke="var(--color-accent-600)"
                  strokeWidth={1}
                />
              )}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

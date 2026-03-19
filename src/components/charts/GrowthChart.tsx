import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface GrowthChartProps {
  data: { day: string; count: number }[]
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
              stroke="var(--color-primary-500)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-primary-500)', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

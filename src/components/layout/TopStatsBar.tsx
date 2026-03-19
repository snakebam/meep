import { Flame, Timer } from 'lucide-react'

interface TopStatsBarProps {
  streak: number
  pomosToday: number
}

export function TopStatsBar({ streak, pomosToday }: TopStatsBarProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface border-b border-border">
      <div className="flex items-center gap-1.5 text-sm">
        <Flame className="w-4 h-4 text-warning" />
        <span className="font-medium text-text-primary">Streak</span>
        <span className="text-text-secondary">{streak} {streak === 1 ? 'day' : 'days'}</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-1.5 text-sm">
        <Timer className="w-4 h-4 text-primary-500" />
        <span className="font-medium text-text-primary">Pomos today</span>
        <span className="text-text-secondary">{pomosToday}</span>
      </div>
    </div>
  )
}

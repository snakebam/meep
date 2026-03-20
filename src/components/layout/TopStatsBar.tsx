import { useNavigate, useLocation } from 'react-router-dom'
import { Flame, Timer, Home, ChevronLeft, ChevronRight } from 'lucide-react'

interface TopStatsBarProps {
  streak: number
  pomosToday: number
}

export function TopStatsBar({ streak, pomosToday }: TopStatsBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface border-b border-border">
      {/* Nav buttons: back, home, forward */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded-md text-text-muted hover:bg-surface-tertiary hover:text-text-primary transition-colors"
          title="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/')}
          className={`p-1 rounded-md transition-colors ${
            isHome ? 'text-primary-500' : 'text-text-muted hover:bg-surface-tertiary hover:text-text-primary'
          }`}
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate(1)}
          className="p-1 rounded-md text-text-muted hover:bg-surface-tertiary hover:text-text-primary transition-colors"
          title="Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-4 bg-border" />

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

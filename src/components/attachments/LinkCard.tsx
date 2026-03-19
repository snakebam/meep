import { ExternalLink, Trash2 } from 'lucide-react'

interface LinkCardProps {
  url: string
  title: string
  onDelete?: () => void
}

export function LinkCard({ url, title, onDelete }: LinkCardProps) {
  return (
    <div className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary-200 transition-colors">
      <ExternalLink className="w-3.5 h-3.5 text-primary-500 shrink-0" />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary-600 hover:underline truncate flex-1"
      >
        {title}
      </a>
      {onDelete && (
        <button
          onClick={onDelete}
          className="hidden group-hover:block text-text-muted hover:text-danger shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

import { extractYoutubeId } from '../../lib/utils'

interface YoutubeEmbedProps {
  url: string
  title?: string
}

export function YoutubeEmbed({ url, title }: YoutubeEmbedProps) {
  const videoId = extractYoutubeId(url)
  if (!videoId) return <p className="text-xs text-text-muted">Invalid YouTube URL</p>

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-black aspect-video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title ?? 'YouTube video'}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

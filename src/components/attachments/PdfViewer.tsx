interface PdfViewerProps {
  url: string
  title?: string
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-surface">
      <iframe
        src={url}
        title={title ?? 'PDF'}
        className="w-full h-96 border-0"
      />
    </div>
  )
}

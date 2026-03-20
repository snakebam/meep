import { useState, useRef } from 'react'
import { Folder, Trash2, Link, Youtube, FileText, Image, X, Upload } from 'lucide-react'
import { YoutubeEmbed } from './YoutubeEmbed'
import { LinkCard } from './LinkCard'
import { detectLinkType, toEmbedUrl, toDriveImageUrl } from '../../lib/utils'
import type { Attachment, TaskFolder, DetectedLinkType } from '../../types'

interface FolderColumnProps {
  folder: TaskFolder
  attachments: Attachment[]
  onAddAttachment: (folderId: string, url: string, title: string, type: DetectedLinkType) => Promise<unknown>
  onUploadFile: (folderId: string, file: File) => Promise<unknown>
  onDeleteAttachment: (attachment: Attachment) => Promise<void>
  onDeleteFolder?: () => Promise<void>
  onOpenPdf?: (url: string, title: string) => void
}

export function FolderColumn({
  folder,
  attachments,
  onAddAttachment,
  onUploadFile,
  onDeleteAttachment,
  onDeleteFolder,
  onOpenPdf,
}: FolderColumnProps) {
  const [showAddLink, setShowAddLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkType, setLinkType] = useState<DetectedLinkType>('link')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlChange = (url: string) => {
    setLinkUrl(url)
    if (url.trim()) {
      setLinkType(detectLinkType(url.trim()))
    }
  }

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return
    await onAddAttachment(folder.id, linkUrl.trim(), linkTitle.trim() || linkUrl.trim(), linkType)
    setLinkUrl('')
    setLinkTitle('')
    setShowAddLink(false)
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await onUploadFile(folder.id, file)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(false)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          setUploading(true)
          try {
            // Give pasted images a name with timestamp
            const ext = file.type.split('/')[1] || 'png'
            const namedFile = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type })
            await onUploadFile(folder.id, namedFile)
          } catch (err) {
            console.error('Paste upload failed:', err)
          }
          setUploading(false)
        }
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    await handleFileUpload(e.dataTransfer.files)
  }

  const getAccept = () => {
    return '.pdf,image/*,.doc,.docx,.txt,.pptx,.xlsx'
  }

  const typeOptions: { value: DetectedLinkType; icon: React.ReactNode; label: string }[] = [
    { value: 'link', icon: <Link className="w-3 h-3" />, label: 'Link' },
    { value: 'pdf', icon: <FileText className="w-3 h-3" />, label: 'PDF' },
    { value: 'image', icon: <Image className="w-3 h-3" />, label: 'Image' },
    { value: 'youtube', icon: <Youtube className="w-3 h-3" />, label: 'YouTube' },
  ]

  return (
    <div
      className="bg-surface-secondary rounded-xl p-3 flex flex-col gap-2 break-inside-avoid mb-3"
      onPaste={handlePaste}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      tabIndex={0}
    >
      <div className="flex items-center gap-2 mb-1">
        <Folder className="w-4 h-4 text-text-muted" />
        <h4 className="text-sm font-medium text-text-primary flex-1">{folder.name}</h4>
        <div className="flex items-center gap-1">
          {/* Upload file button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-text-muted hover:text-primary-500 transition-colors"
            title="Upload file"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          {/* Add link button */}
          <button
            onClick={() => setShowAddLink(true)}
            className="text-text-muted hover:text-primary-500 transition-colors"
            title="Add link"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          {!folder.is_default && onDeleteFolder && (
            <button
              onClick={onDeleteFolder}
              className="text-text-muted hover:text-danger transition-colors"
              title="Delete folder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAccept()}
        multiple
        className="hidden"
        onChange={e => handleFileUpload(e.target.files)}
      />

      {/* Upload drop zone */}
      {uploading && (
        <div className="flex items-center justify-center p-2 rounded-lg border border-primary-300 bg-primary-50">
          <span className="text-xs text-primary-600 animate-pulse">Uploading...</span>
        </div>
      )}

      {/* Drag & paste hint - clickable to open file picker */}
      {attachments.length === 0 && !showAddLink && (
        <div
          className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed border-border text-text-muted cursor-pointer hover:border-primary-300 hover:text-primary-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          <span className="text-[10px] text-center">Drop files, paste images, or click to upload</span>
        </div>
      )}

      {/* Add link form */}
      {showAddLink && (
        <div className="flex flex-col gap-1.5 p-2 bg-surface rounded-lg border border-border">
          <p className="text-[10px] text-text-muted">Paste a link (Google Drive, OneDrive, YouTube, or other URL)</p>
          <input
            value={linkUrl}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="Paste URL..."
            autoFocus
            className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
          />
          <input
            value={linkTitle}
            onChange={e => setLinkTitle(e.target.value)}
            placeholder="Title (optional)"
            onKeyDown={e => e.key === 'Enter' && handleAddLink()}
            className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
          />
          <div className="flex gap-1 flex-wrap">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLinkType(opt.value)}
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  linkType === opt.value ? 'bg-primary-100 text-primary-600' : 'text-text-muted hover:bg-surface-tertiary'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={handleAddLink} className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
              Add
            </button>
            <button onClick={() => { setShowAddLink(false); setLinkUrl(''); setLinkTitle('') }} className="text-xs px-2 py-1 text-text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Attachment list */}
      <div className="flex flex-col gap-1.5">
        {attachments.map(attachment => (
          <div key={attachment.id} className="group relative mb-1.5 break-inside-avoid">
            {attachment.type === 'youtube' && attachment.url && (
              <YoutubeEmbed url={attachment.url} title={attachment.title ?? undefined} />
            )}

            {attachment.type === 'image' && attachment.url && (
              <div>
                <img
                  src={attachment.storage_path ? attachment.url : toDriveImageUrl(attachment.url)}
                  alt={attachment.title ?? ''}
                  className="rounded-lg border border-border w-full object-cover cursor-pointer"
                  onClick={() => setExpanded(expanded === attachment.id ? null : attachment.id)}
                />
                {expanded === attachment.id && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-pointer"
                    onClick={() => setExpanded(null)}
                  >
                    <img
                      src={attachment.storage_path ? attachment.url : toDriveImageUrl(attachment.url)}
                      alt={attachment.title ?? ''}
                      className="max-w-[90vw] max-h-[90vh] rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {attachment.type === 'pdf' && attachment.url && (
              <button
                onClick={() => {
                  const url = attachment.url!
                  const pdfUrl = attachment.storage_path ? url : toEmbedUrl(url)
                  if (onOpenPdf) {
                    onOpenPdf(pdfUrl, attachment.title ?? 'PDF')
                  } else {
                    setExpanded(expanded === attachment.id ? null : attachment.id)
                  }
                }}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg border border-border hover:border-primary-200 text-left transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-danger shrink-0" />
                <span className="text-xs text-text-primary truncate">{attachment.title}</span>
              </button>
            )}

            {attachment.type === 'link' && attachment.url && (
              <LinkCard
                url={attachment.url}
                title={attachment.title ?? attachment.url}
                onDelete={() => onDeleteAttachment(attachment)}
              />
            )}

            {/* Delete button (except for links which have their own) */}
            {attachment.type !== 'link' && (
              <button
                onClick={() => onDeleteAttachment(attachment)}
                className="absolute top-1 right-1 hidden group-hover:flex w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

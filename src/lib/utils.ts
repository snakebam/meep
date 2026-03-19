import { formatDistanceToNow, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'

export function formatDueDate(dateStr: string): { label: string; urgent: boolean } {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()

  if (isToday(date)) {
    return { label: 'today', urgent: true }
  }
  if (isTomorrow(date)) {
    return { label: 'tomorrow', urgent: false }
  }
  if (isPast(date)) {
    return { label: 'overdue', urgent: true }
  }

  const days = differenceInDays(date, now)
  if (days <= 7) {
    return { label: `in ${days} days`, urgent: days <= 2 }
  }

  return {
    label: formatDistanceToNow(date, { addSuffix: true }),
    urgent: false,
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// --- Google Drive / OneDrive URL helpers ---

export type DetectedLinkType = 'image' | 'pdf' | 'youtube' | 'link'

/** Extract the Google Drive file ID from various share URL formats */
function extractGoogleDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/** Extract OneDrive embed URL from a share link */
function extractOnedriveEmbedUrl(url: string): string | null {
  // OneDrive share links like https://1drv.ms/... or onedrive.live.com/...
  if (url.includes('1drv.ms') || url.includes('onedrive.live.com') || url.includes('sharepoint.com')) {
    // For OneDrive, the share link itself can be used in an iframe with /embed
    // Or we can convert to an embed URL
    if (url.includes('/embed')) return url
    // Try to convert share links to embed format
    return url.replace('/view', '/embed').replace('?view', '?embed')
  }
  return null
}

/** Convert a Google Drive share link to an embeddable URL */
export function toEmbedUrl(url: string): string {
  const driveId = extractGoogleDriveId(url)
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`
  }
  const onedriveUrl = extractOnedriveEmbedUrl(url)
  if (onedriveUrl) return onedriveUrl
  return url
}

/** Convert a Google Drive share link to a direct image URL */
export function toDriveImageUrl(url: string): string {
  const driveId = extractGoogleDriveId(url)
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`
  }
  return url
}

/** Auto-detect what type of content a URL points to */
export function detectLinkType(url: string): DetectedLinkType {
  // YouTube
  if (extractYoutubeId(url)) return 'youtube'

  // Image URLs (direct or Drive)
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']
  const lower = url.toLowerCase()
  if (imageExts.some(ext => lower.includes(ext))) return 'image'

  // PDF URLs
  if (lower.includes('.pdf')) return 'pdf'

  // Google Drive — try to guess from context
  const driveId = extractGoogleDriveId(url)
  if (driveId) {
    // Can't always tell from the URL, default to PDF for Drive links
    // User can override via type selector
    return 'pdf'
  }

  return 'link'
}

/** Check if a URL is from Google Drive or OneDrive */
export function isCloudStorageUrl(url: string): boolean {
  return !!extractGoogleDriveId(url) || !!extractOnedriveEmbedUrl(url)
}

const SUBJECT_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
]

export function getNextColor(usedColors: string[]): string {
  const available = SUBJECT_COLORS.filter(c => !usedColors.includes(c))
  return available[0] ?? SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]
}

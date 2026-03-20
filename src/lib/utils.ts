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

/** Check if a URL is a OneDrive/SharePoint link */
export function isOnedriveUrl(url: string): boolean {
  return /1drv\.ms|onedrive\.live\.com|sharepoint\.com|onedrive\.com/i.test(url)
}

/** Convert a OneDrive/SharePoint share link to an embeddable URL */
function toOnedriveEmbedUrl(url: string): string | null {
  if (!isOnedriveUrl(url)) return null

  // Already an embed URL
  if (url.includes('/embed')) return url

  // SharePoint links: convert to embed.aspx
  if (url.includes('sharepoint.com')) {
    // Pattern: https://xxx.sharepoint.com/:x:/g/personal/...
    // Convert to: https://xxx.sharepoint.com/personal/.../_layouts/15/Doc.aspx?sourcedoc=...&action=embedview
    // For simple share links, we can use the iframe approach
    const spMatch = url.match(/(https:\/\/[^/]+\.sharepoint\.com)\/:(\w):\//)
    if (spMatch) {
      // Use Office Online embed: wrap the share URL
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
    }
    // Direct file links on SharePoint
    if (url.includes('/_layouts/')) {
      return url.replace('action=view', 'action=embedview')
    }
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
  }

  // 1drv.ms short links - convert to embed
  if (url.includes('1drv.ms')) {
    // Encode the share URL for Office Online viewer
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
  }

  // onedrive.live.com links
  if (url.includes('onedrive.live.com') || url.includes('onedrive.com')) {
    // Try the embed query param approach
    const u = new URL(url)
    u.searchParams.set('embed', '1')
    return u.toString()
  }

  return url
}

/** Convert a Google Drive or OneDrive share link to an embeddable URL */
export function toEmbedUrl(url: string): string {
  const driveId = extractGoogleDriveId(url)
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`
  }
  const onedriveUrl = toOnedriveEmbedUrl(url)
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
    return 'pdf'
  }

  // OneDrive / SharePoint — embeddable documents
  if (isOnedriveUrl(url)) return 'pdf'

  return 'link'
}

/** Check if a URL is from Google Drive or OneDrive */
export function isCloudStorageUrl(url: string): boolean {
  return !!extractGoogleDriveId(url) || isOnedriveUrl(url)
}

const SUBJECT_COLORS = [
  '#2B2D5E', '#326B50', '#D4A934', '#E08B3A', '#CD5050',
  '#4a4d8a', '#458a6a', '#b8912a', '#c47030', '#a83e3e',
]

export function getNextColor(usedColors: string[]): string {
  const available = SUBJECT_COLORS.filter(c => !usedColors.includes(c))
  return available[0] ?? SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]
}

/** Map old bright colors to new palette colors */
const OLD_TO_NEW_COLOR: Record<string, string> = {
  '#3b82f6': '#2B2D5E',
  '#ef4444': '#CD5050',
  '#22c55e': '#326B50',
  '#f59e0b': '#D4A934',
  '#8b5cf6': '#4a4d8a',
  '#ec4899': '#a83e3e',
  '#06b6d4': '#458a6a',
  '#f97316': '#E08B3A',
  '#14b8a6': '#326B50',
  '#6366f1': '#2B2D5E',
}

export function migrateColor(color: string): string | null {
  const newColor = OLD_TO_NEW_COLOR[color.toLowerCase()]
  return newColor && newColor.toLowerCase() !== color.toLowerCase() ? newColor : null
}

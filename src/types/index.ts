export interface Subject {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface Task {
  id: string
  title: string
  note: string | null
  due_date: string | null
  subject_id: string | null
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
  subject?: Subject | null
}

export interface TaskFolder {
  id: string
  task_id: string
  name: string
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface Attachment {
  id: string
  folder_id: string
  type: 'image' | 'pdf' | 'youtube' | 'link'
  title: string | null
  url: string | null
  storage_path: string | null
  created_at: string
}

export type { DetectedLinkType } from '../lib/utils'

export interface Pomodoro {
  id: string
  subject_id: string | null
  started_at: string
  ended_at: string | null
  duration: number
  completed: boolean
  created_at: string
}

export interface HeatmapDay {
  day: string
  count: number
}

export type TimerState = 'idle' | 'running' | 'completed'

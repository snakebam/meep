import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Calendar, Save, Plus, X, Trash2, Link2, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAttachments } from '../hooks/useAttachments'
import { FolderColumn } from '../components/attachments/FolderColumn'
import { RichTextEditor } from '../components/RichTextEditor'
import PdfViewer from '../components/PdfViewer'
import type { Assignment, Task, Subject } from '../types'

interface OutletContext {
  subjects: Subject[]
}

function Countdown({ dueDate }: { dueDate: string }) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let label: string
  let colorClass: string

  if (diffDays < 0) {
    label = `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`
    colorClass = 'bg-danger/20 text-danger border-danger/30'
  } else if (diffDays === 0) {
    label = 'Due today!'
    colorClass = 'bg-danger/20 text-danger border-danger/30'
  } else if (diffDays === 1) {
    label = 'Due tomorrow'
    colorClass = 'bg-warning/20 text-warning border-warning/30'
  } else if (diffDays <= 3) {
    label = `${diffDays} days left`
    colorClass = 'bg-warning/20 text-warning border-warning/30'
  } else if (diffDays <= 7) {
    label = `${diffDays} days left`
    colorClass = 'bg-primary-500/20 text-primary-500 border-primary-500/30'
  } else {
    const weeks = Math.floor(diffDays / 7)
    const remainDays = diffDays % 7
    label = weeks > 0 && remainDays > 0
      ? `${weeks}w ${remainDays}d left`
      : weeks > 0
        ? `${weeks} week${weeks !== 1 ? 's' : ''} left`
        : `${diffDays} days left`
    colorClass = 'bg-accent-100 text-accent-700 border-accent-200'
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClass}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs opacity-70">
        ({due.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })})
      </span>
    </div>
  )
}

export function AssignmentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { subjects } = useOutletContext<OutletContext>()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [note, setNote] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null)

  // Linked tasks
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [showLinkPicker, setShowLinkPicker] = useState(false)

  const {
    folders,
    attachments,
    addFolder,
    deleteFolder,
    addAttachment,
    uploadFile,
    deleteAttachment,
  } = useAttachments(id!, 'assignment_id')

  // Fetch assignment
  useEffect(() => {
    if (!id) return
    supabase
      .from('assignments')
      .select('*, subject:subjects(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setAssignment(data)
          setNote(data.note ?? '')
          setTitle(data.title)
          setDueDate(data.due_date ?? '')
        }
      })
  }, [id])

  // Fetch linked tasks
  useEffect(() => {
    if (!id) return
    supabase
      .from('assignment_tasks')
      .select('*, task:tasks(*)')
      .eq('assignment_id', id)
      .then(({ data }) => {
        if (data) {
          setLinkedTasks(data.map((at: { task: Task }) => at.task).filter(Boolean))
        }
      })
  }, [id])

  // Fetch available tasks for linking
  useEffect(() => {
    if (!showLinkPicker || !assignment) return
    supabase
      .from('tasks')
      .select('*')
      .eq('subject_id', assignment.subject_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const linkedIds = new Set(linkedTasks.map(t => t.id))
          setAvailableTasks(data.filter(t => !linkedIds.has(t.id)))
        }
      })
  }, [showLinkPicker, assignment, linkedTasks])

  const saveAssignment = async () => {
    if (!id) return
    setSaving(true)
    await supabase
      .from('assignments')
      .update({
        note,
        title,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!id) return
    await supabase.from('assignments').delete().eq('id', id)
    navigate('/')
  }

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return
    await addFolder(newFolderName.trim())
    setNewFolderName('')
    setAddingFolder(false)
  }

  const linkTask = async (taskId: string) => {
    if (!id) return
    await supabase.from('assignment_tasks').insert({ assignment_id: id, task_id: taskId })
    const task = availableTasks.find(t => t.id === taskId)
    if (task) {
      setLinkedTasks(prev => [...prev, task])
      setAvailableTasks(prev => prev.filter(t => t.id !== taskId))
    }
  }

  const unlinkTask = async (taskId: string) => {
    if (!id) return
    await supabase.from('assignment_tasks').delete().eq('assignment_id', id).eq('task_id', taskId)
    const task = linkedTasks.find(t => t.id === taskId)
    if (task) {
      setLinkedTasks(prev => prev.filter(t => t.id !== taskId))
    }
  }

  if (!assignment) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    )
  }

  const subjectColor = assignment.subject?.color ?? '#6366f1'

  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ backgroundColor: subjectColor + '20', color: subjectColor }}
        >
          Becijferde opdracht
        </span>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-lg font-semibold text-text-primary bg-transparent outline-none flex-1"
        />

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
          title="Delete assignment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown + metadata */}
      <div className="flex items-center gap-3 flex-wrap">
        {dueDate && <Countdown dueDate={dueDate} />}

        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-text-muted" />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
          />
        </div>

        <button
          onClick={saveAssignment}
          disabled={saving}
          className="ml-auto flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-3 h-3" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Linked tasks */}
      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Linked tasks
          </h3>
          <button
            onClick={() => setShowLinkPicker(!showLinkPicker)}
            className="flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-3 h-3" />
            Link task
          </button>
        </div>

        {linkedTasks.length === 0 && !showLinkPicker && (
          <p className="text-[10px] text-text-muted/50 text-center py-2">No linked tasks yet</p>
        )}

        <div className="flex flex-col gap-1">
          {linkedTasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-tertiary group"
            >
              <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${task.is_done ? 'text-accent-500' : 'text-border'}`} />
              <span
                className={`text-xs flex-1 cursor-pointer hover:text-primary-600 ${task.is_done ? 'line-through text-text-muted' : 'text-text-primary'}`}
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                {task.title}
              </span>
              <button
                onClick={() => unlinkTask(task.id)}
                className="hidden group-hover:block text-text-muted hover:text-danger"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Task picker */}
        {showLinkPicker && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[10px] text-text-muted mb-1">Select a task to link:</p>
            <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
              {availableTasks.length === 0 && (
                <p className="text-[10px] text-text-muted/50 text-center py-2">No available tasks</p>
              )}
              {availableTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => linkTask(task.id)}
                  className="flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-primary-50/10 transition-colors"
                >
                  <Plus className="w-2.5 h-2.5 text-primary-500" />
                  <span className="text-xs text-text-primary">{task.title}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLinkPicker(false)}
              className="mt-1 text-[10px] text-text-muted"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Content: Note + Folders */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Note */}
        <div className={activePdf ? 'w-1/2 min-w-0 flex flex-col' : 'flex-1 min-w-0 flex flex-col'}>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder="Write your notes here..."
          />
        </div>

        {/* Right: PDF viewer or Folders */}
        {activePdf ? (
          <div className="w-1/2 min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary truncate">{activePdf.title}</span>
              <div className="flex items-center gap-1">
                <a
                  href={activePdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Open in tab
                </a>
                <button
                  onClick={() => setActivePdf(null)}
                  className="p-1 rounded-lg hover:bg-surface-tertiary transition-colors text-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-xl border border-border overflow-hidden bg-surface" style={{ minHeight: '500px' }}>
              <PdfViewer url={activePdf.url} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-w-0 overflow-auto">
            <div className="columns-[220px] gap-3 pb-2 flex-1">
              {folders.map(folder => (
                <FolderColumn
                  key={folder.id}
                  folder={folder}
                  attachments={attachments.get(folder.id) ?? []}
                  onAddAttachment={addAttachment}
                  onUploadFile={uploadFile}
                  onDeleteAttachment={deleteAttachment}
                  onDeleteFolder={folder.is_default ? undefined : () => deleteFolder(folder.id)}
                  onOpenPdf={(url, pdfTitle) => setActivePdf({ url, title: pdfTitle })}
                />
              ))}
            </div>

            <div className="flex justify-end mt-1">
              {addingFolder ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddFolder()}
                    placeholder="Folder name..."
                    autoFocus
                    className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400 w-24"
                  />
                  <button onClick={handleAddFolder} className="text-xs px-2 py-1 bg-primary-600 text-white rounded">
                    OK
                  </button>
                  <button onClick={() => setAddingFolder(false)} className="text-xs px-2 py-1 text-text-muted">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingFolder(true)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add folder
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

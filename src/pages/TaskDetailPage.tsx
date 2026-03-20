import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Calendar, Tag, Save, Plus, X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDueDate } from '../lib/utils'
import { useAttachments } from '../hooks/useAttachments'
import { FolderColumn } from '../components/attachments/FolderColumn'
import { RichTextEditor } from '../components/RichTextEditor'
import PdfViewer from '../components/PdfViewer'
import type { Task, Subject } from '../types'

interface OutletContext {
  subjects: Subject[]
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { subjects } = useOutletContext<OutletContext>()
  const [task, setTask] = useState<Task | null>(null)
  const [note, setNote] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null)

  const {
    folders,
    attachments,
    addFolder,
    deleteFolder,
    addAttachment,
    uploadFile,
    deleteAttachment,
  } = useAttachments(id!)

  useEffect(() => {
    if (!id) return
    supabase
      .from('tasks')
      .select('*, subject:subjects(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setTask(data)
          setNote(data.note ?? '')
          setTitle(data.title)
          setDueDate(data.due_date ?? '')
          setSubjectId(data.subject_id ?? '')
        }
      })
  }, [id])

  const saveNote = async () => {
    if (!id) return
    setSaving(true)
    await supabase
      .from('tasks')
      .update({
        note,
        title,
        due_date: dueDate || null,
        subject_id: subjectId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!id) return
    await supabase.from('tasks').delete().eq('id', id)
    navigate('/')
  }

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return
    await addFolder(newFolderName.trim())
    setNewFolderName('')
    setAddingFolder(false)
  }

  if (!task) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    )
  }

  const due = task.due_date ? formatDueDate(task.due_date) : null

  return (
    <div className="p-4 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-lg font-semibold text-text-primary bg-transparent outline-none flex-1"
        />

        {due && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            due.urgent ? 'bg-danger/20 text-danger' : 'bg-surface-tertiary text-text-muted'
          }`}>
            {due.label}
          </span>
        )}

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata bar */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-text-muted" />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-text-muted" />
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-border outline-none focus:border-primary-400"
          >
            <option value="">No subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={saveNote}
          disabled={saving}
          className="ml-auto flex items-center gap-1 px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-3 h-3" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Content: Note + Folders (or Note + PDF when viewing) */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Note */}
        <div className={activePdf ? 'w-1/2 min-w-0 flex flex-col' : 'flex-1 min-w-0 flex flex-col'}>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder="Write your notes here..."
          />
        </div>

        {/* Right: PDF viewer (50/50 split) or Folders */}
        {activePdf ? (
          <div className="w-1/2 min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary truncate">{activePdf.title}</span>
              <button
                onClick={() => setActivePdf(null)}
                className="p-1 rounded-lg hover:bg-surface-tertiary transition-colors text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
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

            {/* Add folder - compact bottom right */}
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

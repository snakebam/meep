import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Check, ChevronRight, ChevronDown, Trash2, Plus, AlertTriangle, Pencil, X, Calendar, FileText } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { formatDueDate, getNextColor } from '../lib/utils'
import type { Subject, Task, Assignment } from '../types'

/** Returns 'white' or 'black' depending on which contrasts better with the given hex color */
function contrastText(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#000000' : '#ffffff'
}

interface OutletContext {
  subjects: Subject[]
  addSubject: (name: string, color: string) => Promise<Subject | null | undefined>
  updateSubject: (id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
}

function getDueColor(dateStr: string): { color: string; showWarning: boolean } {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 1) return { color: 'text-red-500', showWarning: true }
  if (diff <= 3) return { color: 'text-orange-500', showWarning: true }
  return { color: 'text-accent-600', showWarning: false }
}

function MiniTaskCard({ task, onToggleDone, onDelete }: { task: Task; onToggleDone: (id: string) => void; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const due = task.due_date ? formatDueDate(task.due_date) : null
  const dueColor = task.due_date ? getDueColor(task.due_date) : null

  return (
    <div
      className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
        task.is_done
          ? 'border-border bg-white/60 opacity-50'
          : 'border-white/40 bg-white/60 hover:bg-white/80'
      }`}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <button
        onClick={e => { e.stopPropagation(); onToggleDone(task.id) }}
        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          task.is_done
            ? 'bg-accent-500 border-accent-500 text-white'
            : 'border-border hover:border-primary-400'
        }`}
      >
        {task.is_done && <Check className="w-2.5 h-2.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-xs ${task.is_done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {task.title}
        </span>
      </div>

      {due && dueColor && !task.is_done && (
        <span className={`flex items-center gap-0.5 text-[10px] shrink-0 font-medium ${dueColor.color}`}>
          {dueColor.showWarning && <AlertTriangle className="w-2.5 h-2.5" />}
          {due.label}
        </span>
      )}

      <button
        onClick={e => { e.stopPropagation(); onDelete(task.id) }}
        className="hidden group-hover:block shrink-0 text-text-muted hover:text-danger transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
    </div>
  )
}

/** Inline quick-add task for a specific subject — always visible */
function InlineAddTask({ subjectId, onAdd }: { subjectId: string | null; onAdd: (task: { title: string; due_date?: string | null; subject_id?: string | null }) => Promise<unknown> }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showDate, setShowDate] = useState(false)

  const reset = () => { setTitle(''); setDueDate(''); setShowDate(false) }

  const handleSubmit = async () => {
    if (!title.trim()) return
    await onAdd({ title: title.trim(), due_date: dueDate || null, subject_id: subjectId })
    reset()
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') reset() }}
          placeholder="New task..."
          className="flex-1 text-xs outline-none bg-transparent text-text-primary placeholder:text-text-muted/50 min-w-0"
        />
        <button
          onClick={() => setShowDate(!showDate)}
          className={`p-1 rounded transition-colors ${showDate || dueDate ? 'bg-primary-100 text-primary-600' : 'text-text-muted hover:bg-surface-tertiary'}`}
        >
          <Calendar className="w-3 h-3" />
        </button>
        <button onClick={handleSubmit} disabled={!title.trim()} className="px-2 py-0.5 bg-primary-600 text-white rounded text-[10px] font-medium disabled:opacity-40">Add</button>
      </div>
      {showDate && (
        <div className="flex items-center gap-1 pt-1 border-t border-border">
          <Calendar className="w-3 h-3 text-text-muted" />
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="text-[10px] px-1.5 py-0.5 rounded border border-border outline-none focus:border-primary-400" />
        </div>
      )}
    </div>
  )
}

interface AssignmentWithTasks extends Assignment {
  linkedTaskIds: Set<string>
}

export function DashboardPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useOutletContext<OutletContext>()
  const { tasks, addTask, toggleDone, deleteTask } = useTasks()
  const navigate = useNavigate()

  const [addingSubject, setAddingSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editSubjectName, setEditSubjectName] = useState('')
  const [collapsedAssignments, setCollapsedAssignments] = useState<Set<string>>(new Set())

  const toggleCollapse = (assignmentId: string) => {
    setCollapsedAssignments(prev => {
      const next = new Set(prev)
      if (next.has(assignmentId)) next.delete(assignmentId)
      else next.add(assignmentId)
      return next
    })
  }

  // Fetch assignments and their linked task IDs
  const [assignments, setAssignments] = useState<AssignmentWithTasks[]>([])
  useEffect(() => {
    const fetchAssignments = async () => {
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*, assignment_tasks(task_id)')
        .order('sort_order', { ascending: true })
      if (assignmentData) {
        setAssignments(assignmentData.map((a: Assignment & { assignment_tasks: { task_id: string }[] }) => ({
          ...a,
          linkedTaskIds: new Set(a.assignment_tasks?.map((at: { task_id: string }) => at.task_id) ?? [])
        })))
      }
    }
    fetchAssignments()

    // Re-fetch when navigating back to dashboard
    const channel = supabase
      .channel('assignments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, fetchAssignments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_tasks' }, fetchAssignments)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const activeTasks = tasks
    .filter(t => !t.is_done)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })

  // Build a set of all task IDs that are linked to any assignment
  const allLinkedTaskIds = new Set<string>()
  for (const a of assignments) {
    for (const id of a.linkedTaskIds) allLinkedTaskIds.add(id)
  }

  const subjectGroups: { subject: Subject | null; tasks: Task[]; assignments: AssignmentWithTasks[] }[] = []
  for (const subject of subjects) {
    subjectGroups.push({
      subject,
      tasks: activeTasks.filter(t => t.subject_id === subject.id),
      assignments: assignments.filter(a => a.subject_id === subject.id),
    })
  }
  const unassigned = activeTasks.filter(t => !t.subject_id)
  if (unassigned.length > 0) {
    subjectGroups.push({ subject: null, tasks: unassigned, assignments: [] })
  }

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return
    await addSubject(newSubjectName.trim(), getNextColor(subjects.map(s => s.color)))
    setNewSubjectName('')
    setAddingSubject(false)
  }

  const handleUpdateSubject = async (id: string) => {
    if (!editSubjectName.trim()) return
    await updateSubject(id, { name: editSubjectName.trim() })
    setEditingSubjectId(null)
  }

  const handleCreateAssignment = async (subjectId: string) => {
    const { data, error } = await supabase
      .from('assignments')
      .insert({ title: 'New assignment', subject_id: subjectId })
      .select()
      .single()
    if (error) {
      console.error('Failed to create assignment:', error)
      return
    }
    if (data) {
      window.location.href = `/assignments/${data.id}`
    }
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-primary">Up next...</h2>

      {subjectGroups.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">No subjects yet. Add one below!</p>
      )}

      {/* Subject columns */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {subjectGroups.map(group => {
          const color = group.subject?.color ?? '#94a3b8'
          return (
            <div
              key={group.subject?.id ?? '__none__'}
              className="rounded-xl border overflow-hidden h-[280px] flex flex-col relative"
              style={{ borderColor: color + '30', backgroundColor: color + '08' }}
            >
              {/* Header */}
              <div
                className="group flex items-center gap-2 px-3 py-2 shrink-0 rounded-t-xl"
                style={{ backgroundColor: group.subject ? color : undefined, color: group.subject ? contrastText(color) : undefined }}
              >
                {editingSubjectId === group.subject?.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <input
                      value={editSubjectName}
                      onChange={e => setEditSubjectName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateSubject(group.subject!.id)}
                      autoFocus
                      className="flex-1 text-xs px-1 py-0 rounded border border-white/30 outline-none min-w-0 bg-white/20 text-inherit placeholder:text-inherit/50"
                    />
                    <button onClick={() => handleUpdateSubject(group.subject!.id)} style={{ color: contrastText(color) }}><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditingSubjectId(null)} style={{ color: contrastText(color), opacity: 0.7 }}><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <>
                    <span
                      className="text-xs font-semibold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => group.subject && navigate(`/subjects/${group.subject.id}`)}
                    >
                      {group.subject?.name ?? 'No subject'}
                    </span>
                    <span className="text-[10px] opacity-70">({group.tasks.length})</span>
                    <div className="flex items-center gap-1 ml-auto">
                      {group.subject && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCreateAssignment(group.subject!.id) }}
                          className="opacity-60 hover:opacity-100 p-0.5 transition-opacity"
                          title="Nieuwe becijferde opdracht"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {group.subject && (
                        <>
                          <button onClick={() => { setEditingSubjectId(group.subject!.id); setEditSubjectName(group.subject!.name) }} className="opacity-50 hover:opacity-100 p-0.5 transition-opacity">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => { if (confirm(`Delete "${group.subject!.name}" and all its tasks?`)) deleteSubject(group.subject!.id) }} className="opacity-50 hover:opacity-100 p-0.5 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Task list - scrollable */}
              <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
                {/* Assignments as section headings with linked tasks — YouTube-style thread */}
                {group.assignments.map(assignment => {
                  const linkedTasks = group.tasks.filter(t => assignment.linkedTaskIds.has(t.id))
                  const dueInfo = assignment.due_date ? getDueColor(assignment.due_date) : null
                  const isCollapsed = collapsedAssignments.has(assignment.id)
                  return (
                    <div key={assignment.id} className="flex flex-col">
                      {/* Assignment heading row */}
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-black/[0.04] transition-colors group/assignment">
                        {linkedTasks.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCollapse(assignment.id) }}
                            className="shrink-0 text-text-muted hover:text-text-secondary transition-colors p-0.5 -ml-0.5"
                          >
                            {isCollapsed
                              ? <ChevronRight className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />
                            }
                          </button>
                        )}
                        <FileText className="w-3 h-3 shrink-0" style={{ color }} />
                        <span
                          className="text-[11px] font-semibold text-text-primary flex-1 min-w-0 truncate hover:underline"
                          onClick={() => navigate(`/assignments/${assignment.id}`)}
                        >
                          {assignment.title}
                        </span>
                        {dueInfo && assignment.due_date && (
                          <span className={`text-[9px] font-medium shrink-0 ${dueInfo.color}`}>
                            {dueInfo.showWarning && <AlertTriangle className="w-2 h-2 inline mr-0.5" />}
                            {formatDueDate(assignment.due_date).label}
                          </span>
                        )}
                        {linkedTasks.length > 0 && (
                          <span className="text-[9px] text-text-muted shrink-0">{linkedTasks.length}</span>
                        )}
                      </div>
                      {/* Thread line + linked tasks */}
                      {linkedTasks.length > 0 && !isCollapsed && (
                        <div className="flex ml-[15px]">
                          {/* Thin thread line — clickable to collapse */}
                          <button
                            onClick={() => toggleCollapse(assignment.id)}
                            className="group/line flex flex-col items-center w-4 shrink-0 pt-0.5 pb-1 cursor-pointer"
                          >
                            <div className="w-[2px] flex-1 rounded-full bg-border group-hover/line:bg-text-muted transition-colors" />
                          </button>
                          {/* Tasks */}
                          <div className="flex-1 flex flex-col gap-1 py-0.5 min-w-0">
                            {linkedTasks.map(task => (
                              <MiniTaskCard key={task.id} task={task} onToggleDone={toggleDone} onDelete={deleteTask} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Unlinked tasks (not part of any assignment) */}
                {group.tasks.filter(t => !allLinkedTaskIds.has(t.id)).map(task => (
                  <MiniTaskCard key={task.id} task={task} onToggleDone={toggleDone} onDelete={deleteTask} />
                ))}

                {group.tasks.length === 0 && group.assignments.length === 0 && (
                  <p className="text-[10px] text-text-muted/50 text-center py-4">No tasks yet</p>
                )}
              </div>

              {/* Inline add task — always visible */}
              <div className="px-2 pb-2 pt-1.5 shrink-0 bg-black/[0.03] border-t border-black/[0.04]">
                <InlineAddTask subjectId={group.subject?.id ?? null} onAdd={addTask} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Add subject */}
      <div className="flex justify-start mt-1">
        {addingSubject ? (
          <div className="flex items-center gap-1.5">
            <input
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
              placeholder="Subject name..."
              autoFocus
              className="text-xs px-2 py-1 rounded-lg border border-border outline-none focus:border-primary-400 w-32 bg-surface"
            />
            <button onClick={handleAddSubject} className="text-xs px-2 py-1 bg-primary-600 text-white rounded-lg">OK</button>
            <button onClick={() => { setAddingSubject(false); setNewSubjectName('') }} className="text-xs px-2 py-1 text-text-muted">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAddingSubject(true)} className="flex items-center gap-1 text-xs text-text-muted hover:text-primary-500 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Add subject
          </button>
        )}
      </div>

      {/* Completed tasks */}
      {tasks.filter(t => t.is_done).length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5 px-1">
            Completed ({tasks.filter(t => t.is_done).length})
          </p>
          <div className="flex flex-col gap-1">
            {tasks.filter(t => t.is_done).map(task => (
              <MiniTaskCard key={task.id} task={task} onToggleDone={toggleDone} onDelete={deleteTask} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

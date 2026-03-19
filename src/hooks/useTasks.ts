import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task } from '../types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, subject:subjects(*)')
      .order('is_done', { ascending: true })
      .order('sort_order', { ascending: true })
    if (data) setTasks(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addTask = async (task: {
    title: string
    due_date?: string | null
    subject_id?: string | null
    note?: string | null
  }) => {
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order), 0)
    const { data } = await supabase
      .from('tasks')
      .insert({ ...task, sort_order: maxOrder + 1 })
      .select('*, subject:subjects(*)')
      .single()

    if (data) {
      // Auto-create default folders
      await supabase.from('task_folders').insert([
        { task_id: data.id, name: 'Notes', is_default: true, sort_order: 0 },
        { task_id: data.id, name: 'PDFs', is_default: true, sort_order: 1 },
        { task_id: data.id, name: 'Images', is_default: true, sort_order: 2 },
      ])
      setTasks(prev => [...prev, data])
    }
    return data
  }

  const updateTask = async (id: string, updates: Partial<Pick<Task, 'title' | 'note' | 'due_date' | 'subject_id' | 'is_done'>>) => {
    const { data } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, subject:subjects(*)')
      .single()
    if (data) setTasks(prev => prev.map(t => t.id === id ? data : t))
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const toggleDone = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (task) await updateTask(id, { is_done: !task.is_done })
  }

  return { tasks, loading, addTask, updateTask, deleteTask, toggleDone, refetch: fetch }
}

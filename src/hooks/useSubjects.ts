import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { migrateColor } from '../lib/utils'
import type { Subject } from '../types'

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const migrated = useRef(false)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('sort_order', { ascending: true })
    if (data) {
      // One-time migration of old bright colors to new palette
      if (!migrated.current) {
        migrated.current = true
        for (const s of data) {
          const newColor = migrateColor(s.color)
          if (newColor) {
            supabase.from('subjects').update({ color: newColor }).eq('id', s.id).then()
            s.color = newColor
          }
        }
      }
      setSubjects(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addSubject = async (name: string, color: string) => {
    const maxOrder = subjects.reduce((max, s) => Math.max(max, s.sort_order), 0)
    const { data } = await supabase
      .from('subjects')
      .insert({ name, color, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (data) setSubjects(prev => [...prev, data])
    return data
  }

  const updateSubject = async (id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>) => {
    const { data } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (data) setSubjects(prev => prev.map(s => s.id === id ? data : s))
  }

  const deleteSubject = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects(prev => prev.filter(s => s.id !== id))
  }

  return { subjects, loading, addSubject, updateSubject, deleteSubject, refetch: fetch }
}

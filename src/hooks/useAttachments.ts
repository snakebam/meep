import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskFolder, Attachment } from '../types'

export function useAttachments(parentId: string, parentField: 'task_id' | 'assignment_id' = 'task_id') {
  const [folders, setFolders] = useState<TaskFolder[]>([])
  const [attachments, setAttachments] = useState<Map<string, Attachment[]>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data: folderData } = await supabase
      .from('task_folders')
      .select('*')
      .eq(parentField, parentId)
      .order('sort_order', { ascending: true })

    if (folderData) {
      setFolders(folderData)

      const folderIds = folderData.map(f => f.id)
      if (folderIds.length > 0) {
        const { data: attachmentData } = await supabase
          .from('attachments')
          .select('*')
          .in('folder_id', folderIds)
          .order('created_at', { ascending: false })

        if (attachmentData) {
          const grouped = new Map<string, Attachment[]>()
          for (const a of attachmentData) {
            const list = grouped.get(a.folder_id) ?? []
            list.push(a)
            grouped.set(a.folder_id, list)
          }
          setAttachments(grouped)
        }
      }
    }
    setLoading(false)
  }, [parentId, parentField])

  useEffect(() => { fetch() }, [fetch])

  const addFolder = async (name: string) => {
    const maxOrder = folders.reduce((max, f) => Math.max(max, f.sort_order), 0)
    const { data } = await supabase
      .from('task_folders')
      .insert({ [parentField]: parentId, name, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (data) setFolders(prev => [...prev, data])
    return data
  }

  const deleteFolder = async (folderId: string) => {
    // Delete uploaded files from storage
    const folderAttachments = attachments.get(folderId) ?? []
    for (const a of folderAttachments) {
      if (a.storage_path) {
        await supabase.storage.from('attachments').remove([a.storage_path])
      }
    }
    await supabase.from('task_folders').delete().eq('id', folderId)
    setFolders(prev => prev.filter(f => f.id !== folderId))
    setAttachments(prev => {
      const next = new Map(prev)
      next.delete(folderId)
      return next
    })
  }

  /** Add a link-based attachment (YouTube, external link, Google Drive link) */
  const addAttachment = async (
    folderId: string,
    url: string,
    title: string,
    type: 'image' | 'pdf' | 'youtube' | 'link'
  ) => {
    const { data } = await supabase
      .from('attachments')
      .insert({ folder_id: folderId, type, title, url })
      .select()
      .single()

    if (data) {
      setAttachments(prev => {
        const next = new Map(prev)
        const list = next.get(folderId) ?? []
        next.set(folderId, [data, ...list])
        return next
      })
    }
    return data
  }

  /** Upload a file (PDF or image) to Supabase Storage */
  const uploadFile = async (folderId: string, file: File) => {
    const path = `${parentId}/${folderId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      console.error('Upload failed:', uploadError.message)
      alert('Upload failed: ' + uploadError.message)
      throw uploadError
    }

    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path)

    const type = file.type === 'application/pdf' ? 'pdf' as const
      : file.type.startsWith('image/') ? 'image' as const
      : 'link' as const

    const { data } = await supabase
      .from('attachments')
      .insert({
        folder_id: folderId,
        type,
        title: file.name,
        url: urlData.publicUrl,
        storage_path: path,
      })
      .select()
      .single()

    if (data) {
      setAttachments(prev => {
        const next = new Map(prev)
        const list = next.get(folderId) ?? []
        next.set(folderId, [data, ...list])
        return next
      })
    }
    return data
  }

  const deleteAttachment = async (attachment: Attachment) => {
    // Delete from storage if it was an uploaded file
    if (attachment.storage_path) {
      await supabase.storage.from('attachments').remove([attachment.storage_path])
    }
    await supabase.from('attachments').delete().eq('id', attachment.id)
    setAttachments(prev => {
      const next = new Map(prev)
      const list = next.get(attachment.folder_id) ?? []
      next.set(attachment.folder_id, list.filter(a => a.id !== attachment.id))
      return next
    })
  }

  return {
    folders,
    attachments,
    loading,
    addFolder,
    deleteFolder,
    addAttachment,
    uploadFile,
    deleteAttachment,
    refetch: fetch,
  }
}

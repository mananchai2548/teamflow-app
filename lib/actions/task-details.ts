'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addComment(taskId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Insert comment
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      content
    })
    .select('*, profiles(full_name, email)')
    .single()

  if (error) return { error: error.message }

  // 2. Trigger notification
  // Fetch task to see who is assigned
  const { data: taskData } = await supabase
    .from('tasks')
    .select('assigned_to, title')
    .eq('id', taskId)
    .single()

  if (taskData && taskData.assigned_to && taskData.assigned_to !== user.id) {
    // Determine commenter name
    const commenterName = (data as any)?.profiles?.full_name || 'Someone'
    const notificationMessage = `${commenterName} commented on your task: "${taskData.title}"`

    // Insert notification for the assignee
    await supabase.from('notifications').insert({
      user_id: taskData.assigned_to,
      sender_id: user.id,
      task_id: taskId,
      message: notificationMessage
    })
  }

  return { success: true, comment: data }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function addSubtask(taskId: string, title: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subtasks')
    .insert({
      task_id: taskId,
      title
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, subtask: data }
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('subtasks')
    .update({ is_completed: isCompleted })
    .eq('id', subtaskId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteSubtask(subtaskId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', subtaskId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateTaskTags(taskId: string, tags: string[]) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ tags })
    .eq('id', taskId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function uploadAttachment(formData: FormData) {
  const file = formData.get('file') as File
  const taskId = formData.get('taskId') as string
  
  if (!file || !taskId) return { error: 'Missing file or task ID' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
  const filePath = `${taskId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('task_files')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) return { error: uploadError.message }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('task_files')
    .getPublicUrl(filePath)

  // 3. Insert into task_attachments table
  const { data: attachment, error: dbError } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      file_url: publicUrl,
      file_name: file.name
    })
    .select('*, profiles(full_name, email)')
    .single()

  if (dbError) return { error: dbError.message }
  
  return { success: true, attachment }
}

export async function deleteAttachment(attachmentId: string, fileUrl: string) {
  const supabase = await createClient()
  
  // Extract filePath from publicUrl
  // URL looks like: https://[project_ref].supabase.co/storage/v1/object/public/task_files/[taskId]/[fileName]
  const pathParts = fileUrl.split('/task_files/')
  if (pathParts.length === 2) {
    const filePath = pathParts[1]
    await supabase.storage.from('task_files').remove([filePath])
  }

  const { error } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) return { error: error.message }
  return { success: true }
}

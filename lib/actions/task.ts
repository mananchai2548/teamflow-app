'use server'

import { createClient } from '@/lib/supabase/server'
import { TaskStatus, TaskPriority } from '@/lib/types'

export async function createTask(formData: FormData) {
  const teamId = formData.get('teamId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as TaskPriority
  const status = formData.get('status') as TaskStatus || 'TODO'
  const assignedTo = formData.get('assignedTo') as string || null

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .insert({
      team_id: teamId,
      title,
      description,
      priority,
      status,
      assigned_to: assignedTo || null,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateTask(taskId: string, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as TaskPriority
  const status = formData.get('status') as TaskStatus
  const assignedTo = formData.get('assignedTo') as string || null

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      description,
      priority,
      status,
      assigned_to: assignedTo || null,
    })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

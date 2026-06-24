'use client'

import { useState, useEffect, useRef } from 'react'
import { Task, TaskStatus, TaskComment, Subtask, TaskAttachment } from '@/lib/types'
import { X, Trash2, Plus, Paperclip, CheckSquare, MessageSquare, Tag, Download, Loader2 } from 'lucide-react'
import { createTask, updateTask, deleteTask } from '@/lib/actions/task'
import { addComment, deleteComment, addSubtask, toggleSubtask, deleteSubtask, uploadAttachment, deleteAttachment, updateTaskTags } from '@/lib/actions/task-details'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function TaskModal({ 
  teamId, 
  members, 
  defaultStatus,
  taskToEdit,
  onClose,
  currentUser
}: { 
  teamId: string, 
  members: any[],
  defaultStatus: TaskStatus,
  taskToEdit?: Task,
  onClose: () => void,
  currentUser: any
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!taskToEdit

  // Advanced feature states
  const [comments, setComments] = useState<TaskComment[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [tags, setTags] = useState<string[]>(taskToEdit?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEdit || !taskToEdit?.id) return

    const supabase = createClient()

    // Fetch initial data
    const fetchData = async () => {
      // Comments
      const { data: commentsData } = await supabase
        .from('task_comments')
        .select('*, profiles(full_name, email)')
        .eq('task_id', taskToEdit.id)
        .order('created_at', { ascending: true })
      if (commentsData) setComments(commentsData)

      // Subtasks
      const { data: subtasksData } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskToEdit.id)
        .order('created_at', { ascending: true })
      if (subtasksData) setSubtasks(subtasksData)

      // Attachments
      const { data: attachmentsData } = await supabase
        .from('task_attachments')
        .select('*, profiles(full_name, email)')
        .eq('task_id', taskToEdit.id)
        .order('created_at', { ascending: false })
      if (attachmentsData) setAttachments(attachmentsData)
    }

    fetchData()

    // Realtime Subscriptions for Comments, Subtasks, and Attachments
    const channel = supabase
      .channel(`task-updates-${taskToEdit.id}`)
      // Comments
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskToEdit.id}` },
        async (payload) => {
          const { data } = await supabase.from('profiles').select('full_name, email').eq('id', payload.new.user_id).single()
          setComments((prev) => {
            if (prev.find(c => c.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, profiles: data } as TaskComment]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskToEdit.id}` },
        (payload) => {
          setComments((prev) => prev.filter(c => c.id !== payload.old.id))
        }
      )
      // Subtasks
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'subtasks', filter: `task_id=eq.${taskToEdit.id}` },
        (payload) => {
          setSubtasks((prev) => {
            if (prev.find(s => s.id === payload.new.id)) return prev;
            return [...prev, payload.new as Subtask];
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'subtasks', filter: `task_id=eq.${taskToEdit.id}` },
        (payload) => {
          setSubtasks((prev) => prev.map(s => s.id === payload.new.id ? payload.new as Subtask : s))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'subtasks', filter: `task_id=eq.${taskToEdit.id}` },
        (payload) => {
          setSubtasks((prev) => prev.filter(s => s.id !== payload.old.id))
        }
      )
      // Attachments
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'task_attachments', filter: `task_id=eq.${taskToEdit.id}` },
        (payload) => {
          setAttachments((prev) => {
            if (prev.find(a => a.id === payload.new.id)) return prev;
            return [payload.new as TaskAttachment, ...prev];
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'task_attachments', filter: `task_id=eq.${taskToEdit.id}` },
        (payload) => {
          setAttachments((prev) => prev.filter(a => a.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isEdit, taskToEdit?.id])

  // --- Handlers ---
  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('teamId', teamId)
    if (!formData.has('status')) {
      formData.append('status', taskToEdit ? taskToEdit.status : defaultStatus)
    }

    let result;
    if (isEdit) {
      result = await updateTask(taskToEdit.id, formData)
      await updateTaskTags(taskToEdit.id, tags)
    } else {
      result = await createTask(formData)
      if (result.success && result.task) {
        if (tags.length > 0) await updateTaskTags(result.task.id, tags)
      }
    }
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm('Are you sure you want to delete this task?')) return
    setLoading(true)
    const result = await deleteTask(taskToEdit.id)
    if (result?.error) setError(result.error)
    else onClose()
  }

  // Tags
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (newTag.trim() && !tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()])
      }
      setNewTag('')
    }
  }
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  // Subtasks
  const handleAddSubtask = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!newSubtask.trim() || !isEdit) return
      const res = await addSubtask(taskToEdit.id, newSubtask.trim())
      if (res.success && res.subtask) {
        setSubtasks([...subtasks, res.subtask])
      }
      setNewSubtask('')
    }
  }
  const handleToggleSubtask = async (subtaskId: string, current: boolean) => {
    setSubtasks(subtasks.map(s => s.id === subtaskId ? { ...s, is_completed: !current } : s))
    await toggleSubtask(subtaskId, !current)
  }
  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtasks(subtasks.filter(s => s.id !== subtaskId))
    await deleteSubtask(subtaskId)
  }

  // Comments
  const handleAddComment = async () => {
    if (!newComment.trim() || !isEdit) return
    setNewComment('')
    // Realtime handles state update, but we can do optimistic update if we want
    await addComment(taskToEdit.id, newComment.trim())
  }

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId)
  }

  // Attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !isEdit) return
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    formData.append('taskId', taskToEdit.id)
    
    const res = await uploadAttachment(formData)
    if (res.success && res.attachment) {
      setAttachments([res.attachment, ...attachments])
    } else if (res.error) {
      setError(res.error)
    }
    setUploading(false)
  }

  const handleDeleteAttachment = async (attachmentId: string, url: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId))
    await deleteAttachment(attachmentId, url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
        isEdit ? "w-full max-w-5xl md:flex-row" : "w-full max-w-2xl"
      )}>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <h2 className="text-xl font-semibold">{isEdit ? 'Task Details' : 'Create New Task'}</h2>
            {!isEdit && (
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <form action={handleSubmit} className="p-6 space-y-6 flex-1">
            <div className="space-y-4">
              {/* Title & Description */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  defaultValue={taskToEdit?.title || ''}
                  required
                  autoFocus={!isEdit}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={taskToEdit?.description || ''}
                  rows={4}
                  placeholder="Add more details..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Status, Priority, Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={taskToEdit?.status || defaultStatus}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={taskToEdit?.priority || 'MEDIUM'}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="assignedTo">Assignee</label>
                  <select
                    id="assignedTo"
                    name="assignedTo"
                    defaultValue={taskToEdit?.assigned_to || ''}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  <Tag className="w-4 h-4 mr-2" /> Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-full text-xs font-medium flex items-center">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-indigo-900 dark:hover:text-white"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter..."
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Subtasks (Only available in Edit mode to ensure we have a task_id) */}
              {isEdit && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
                    <CheckSquare className="w-4 h-4 mr-2" /> Subtasks
                  </label>
                  <div className="space-y-2 mb-3">
                    {subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50 group">
                        <input
                          type="checkbox"
                          checked={sub.is_completed}
                          onChange={() => handleToggleSubtask(sub.id, sub.is_completed)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className={cn("flex-1 text-sm", sub.is_completed && "line-through text-slate-400")}>{sub.title}</span>
                        <button type="button" onClick={() => handleDeleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={handleAddSubtask}
                    placeholder="Add a new subtask and press Enter..."
                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Attachments (Only in Edit mode) */}
              {isEdit && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
                    <Paperclip className="w-4 h-4 mr-2" /> Attachments
                  </label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {attachments.map(att => {
                      const isImage = att.file_name.match(/\.(jpeg|jpg|gif|png|webp)$/i)
                      return (
                      <div key={att.id} className="flex items-center gap-2 p-2 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm group">
                        {isImage ? (
                          <a href={att.file_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded overflow-hidden shrink-0 block border border-slate-200 dark:border-slate-700">
                            <img src={att.file_url} alt={att.file_name} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                          </a>
                        ) : (
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded shrink-0">
                            <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-[80px]">
                          <span className="text-xs font-medium max-w-[120px] truncate" title={att.file_name}>{att.file_name}</span>
                          <span className="text-[10px] text-slate-500">{new Date(att.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col ml-2 gap-1 shrink-0">
                          <a href={att.file_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600" title="View/Download">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button type="button" onClick={() => handleDeleteAttachment(att.id, att.file_url)} className="text-slate-400 hover:text-red-500" title="Delete">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-sm flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Plus className="w-4 h-4 mr-2" /> Upload File</>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="pt-6 flex items-center justify-between mt-auto">
              {isEdit ? (
                <button type="button" onClick={handleDelete} className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                </button>
              ) : <div />}
              
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 transition-colors">
                  Close
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar: Comments Feed (Only visible in Edit Mode) */}
        {isEdit && (
          <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold flex items-center text-sm"><MessageSquare className="w-4 h-4 mr-2" /> Comments</h3>
              <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map(comment => {
                const isMine = comment.user_id === currentUser.id
                return (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs shrink-0 mt-1">
                      {comment.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{comment.profiles?.full_name || 'User'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 relative">
                        {comment.content}
                        {isMine && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {comments.length === 0 && <p className="text-center text-sm text-slate-500 mt-4">No comments yet.</p>}
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20 mb-2"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                Post Comment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

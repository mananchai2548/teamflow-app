'use client'

import { useState } from 'react'
import { TaskStatus, TaskPriority } from '@/lib/types'
import { X } from 'lucide-react'
import { createTask } from '@/lib/actions/task'
import { cn } from '@/lib/utils'

export function AddTaskModal({ 
  teamId, 
  members, 
  defaultStatus,
  onClose 
}: { 
  teamId: string, 
  members: any[],
  defaultStatus: TaskStatus,
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('teamId', teamId)
    formData.append('status', defaultStatus)
    
    const result = await createTask(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold">Create New Task</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form action={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              required
              autoFocus
              placeholder="What needs to be done?"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Add more details..."
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                defaultValue="MEDIUM"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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
                defaultValue=""
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? 'Saving...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { Task } from '@/lib/types'
import { Calendar, MessageSquare, CheckSquare, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TaskCard({ 
  task, 
  members,
  innerRef,
  draggableProps,
  dragHandleProps,
  onClick
}: { 
  task: Task, 
  members: any[],
  innerRef: (element: HTMLElement | null) => void,
  draggableProps: any,
  dragHandleProps: any,
  onClick: () => void
}) {
  const assignee = members.find(m => m.id === task.assigned_to)

  const priorityColors = {
    LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    MEDIUM: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    HIGH: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'DONE'

  // Subtasks calculation
  const totalSubtasks = task.subtasks?.length || 0
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0
  
  // Comments calculation
  const totalComments = task.task_comments?.length || 0

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60",
        "hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing group",
        isOverdue && "border-red-300 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-wrap gap-1.5">
          {/* Priority Badge */}
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", priorityColors[task.priority])}>
            {task.priority}
          </span>
          {/* Custom Tags */}
          {task.tags && task.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 truncate max-w-[80px]">
              {tag}
            </span>
          ))}
          {task.tags && task.tags.length > 2 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              +{task.tags.length - 2}
            </span>
          )}
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1 line-clamp-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <div className={cn("flex items-center gap-1", isOverdue && "text-red-600 dark:text-red-400 font-medium")}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
          
          {totalSubtasks > 0 && (
            <div className={cn("flex items-center gap-1", completedSubtasks === totalSubtasks && "text-green-600 dark:text-green-400 font-medium")}>
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}

          {totalComments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{totalComments}</span>
            </div>
          )}
        </div>

        {assignee && (
          <div 
            className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm ml-2 shrink-0"
            title={assignee.full_name || assignee.email}
          >
            {assignee.full_name?.charAt(0).toUpperCase() || assignee.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

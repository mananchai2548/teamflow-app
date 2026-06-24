'use client'

import { useState, useEffect, useMemo } from 'react'
import { Task, TaskStatus } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'
import { Plus, LayoutDashboard as DashboardIcon, CheckCircle2, ListTodo, Filter, User as UserIcon, Clock } from 'lucide-react'
import { updateTaskStatus } from '@/lib/actions/task'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'In Review' },
  { id: 'DONE', title: 'Done' }
]

export function KanbanBoard({ initialTasks, teamId, members, currentUser }: { initialTasks: Task[], teamId: string, members: any[], currentUser: any }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<TaskStatus>('TODO')
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined)
  const [filterMode, setFilterMode] = useState<'ALL' | 'MY_TASKS' | 'DUE_SOON'>('ALL')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sync state if server component re-fetches (via router.refresh)
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks-changes-${teamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => {
              if (prev.find(t => t.id === payload.new.id)) return prev;
              // Provide empty relation arrays so UI doesn't crash before refresh
              return [{ ...payload.new, subtasks: [], task_comments: [], tags: payload.new.tags || [] } as Task, ...prev];
            })
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t)))
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as TaskStatus
    setTasks((prev) => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t))
    await updateTaskStatus(draggableId, newStatus)
    router.refresh()
  }

  const openEditModal = (task: Task) => {
    setTaskToEdit(task)
    setIsModalOpen(true)
  }

  const openCreateModal = (status: TaskStatus) => {
    setTaskToEdit(undefined)
    setDefaultStatusForModal(status)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    router.refresh()
  }

  const [showStats, setShowStats] = useState(true)

  // --- Derived Stats ---
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'DONE').length
  const myActiveTasks = tasks.filter(t => t.assigned_to === currentUser.id && t.status !== 'DONE').length
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  // --- Filtering ---
  const filteredTasks = useMemo(() => {
    const searchQuery = searchParams.get('search')?.toLowerCase() || ''
    
    return tasks.filter(t => {
      // Search
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery) && (!t.description || !t.description.toLowerCase().includes(searchQuery))) return false
      
      // Filter Modes
      if (filterMode === 'MY_TASKS') {
        if (t.assigned_to !== currentUser.id) return false
      } else if (filterMode === 'DUE_SOON') {
        if (!t.due_date || t.status === 'DONE') return false
        const daysUntilDue = (new Date(t.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        if (daysUntilDue > 3 || daysUntilDue < -1) return false // Within 3 days and not super overdue
      }
      return true
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [tasks, searchParams, filterMode, currentUser.id])

  return (
    <div className="flex flex-col h-full">
      {/* Header & Stats Dashboard */}
      <div className="mb-6 space-y-4 shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><DashboardIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Project Board</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage, track, and collaborate on your team's workflow</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowStats(!showStats)}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            <button 
              onClick={() => openCreateModal('TODO')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" /> Add Task
            </button>
          </div>
        </div>

        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center shadow-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg mr-4"><ListTodo className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalTasks}</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col justify-center shadow-sm relative overflow-hidden">
              <div className="flex items-center mb-2 z-10">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg mr-4"><CheckCircle2 className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completion</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{completedTasks} <span className="text-sm font-normal text-slate-400">/ {totalTasks}</span></p>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full z-10 overflow-hidden">
                <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center shadow-sm">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg mr-4"><UserIcon className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">My Active Tasks</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{myActiveTasks}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 mb-4 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 w-fit shrink-0">
        <div className="px-3 py-1 flex items-center text-sm font-medium text-slate-400 border-r border-slate-200 dark:border-slate-800">
          <Filter className="w-4 h-4 mr-2" /> Filters
        </div>
        <button 
          onClick={() => setFilterMode('ALL')} 
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", filterMode === 'ALL' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
        >
          All
        </button>
        <button 
          onClick={() => setFilterMode('MY_TASKS')} 
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center", filterMode === 'MY_TASKS' ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
        >
          <UserIcon className="w-4 h-4 mr-1.5" /> My Tasks
        </button>
        <button 
          onClick={() => setFilterMode('DUE_SOON')} 
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center", filterMode === 'DUE_SOON' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
        >
          <Clock className="w-4 h-4 mr-1.5" /> Due Soon
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto overflow-y-visible pb-4 custom-scrollbar items-start">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter(t => t.status === col.id)

            return (
              <div 
                key={col.id} 
                className="shrink-0 w-80 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 h-fit"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{col.title}</h3>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs py-1 px-2.5 rounded-full font-medium">
                    {columnTasks.length}
                  </span>
                </div>
                
                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="p-3 space-y-3"
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <TaskCard 
                              task={task} 
                              members={members} 
                              innerRef={provided.innerRef}
                              draggableProps={provided.draggableProps}
                              dragHandleProps={provided.dragHandleProps}
                              onClick={() => openEditModal(task)}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      <button 
                        onClick={() => openCreateModal(col.id)}
                        className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 transition-colors mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Task
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {isModalOpen && (
        <TaskModal 
          teamId={teamId} 
          members={members} 
          defaultStatus={defaultStatusForModal}
          taskToEdit={taskToEdit}
          onClose={handleModalClose}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

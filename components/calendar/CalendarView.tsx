'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'
import { saveDailyNote } from '@/lib/actions/calendar'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function CalendarView({ currentTeam, initialNotes }: { currentTeam: any, initialNotes: any[] }) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [noteContent, setNoteContent] = useState('')

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const today = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth, i))
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const formatDateString = (date: Date) => {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
  }

  const getNoteForDate = (date: Date) => {
    const dateStr = formatDateString(date)
    return initialNotes.find(n => n.date === dateStr)
  }

  const openNoteModal = (date: Date) => {
    setSelectedDate(date)
    const existingNote = getNoteForDate(date)
    setNoteContent(existingNote?.content || '')
    setIsModalOpen(true)
  }

  const handleSaveNote = async () => {
    if (!selectedDate) return
    setSaving(true)
    const dateStr = formatDateString(selectedDate)
    
    await saveDailyNote(currentTeam.id, dateStr, noteContent)
    
    setSaving(false)
    setIsModalOpen(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex-1">
        {dayNames.map(day => (
          <div key={day} className="bg-slate-50 dark:bg-slate-900 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bg-white dark:bg-slate-950 min-h-[100px]" />
          
          const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
          const note = getNoteForDate(date)

          return (
            <div 
              key={date.toISOString()}
              onClick={() => openNoteModal(date)}
              className={cn(
                "bg-white dark:bg-slate-950 min-h-[100px] p-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer relative group",
                isToday && "bg-indigo-50/30 dark:bg-indigo-900/10"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isToday ? "bg-indigo-600 text-white" : "text-slate-700 dark:text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                )}>
                  {date.getDate()}
                </span>
                {note && note.content && (
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              
              {note && note.content && (
                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mt-1 px-1 break-words">
                  {note.content}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-lg">
                Notes for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write down notes, urgent tasks, or anything important for this day..."
                className="w-full h-40 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote}
                disabled={saving}
                className="px-4 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

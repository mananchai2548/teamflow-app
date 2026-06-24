'use client'

import { Search, Bell, Copy, CheckCircle2, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ProfileModal } from './ProfileModal'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function Header({ currentTeam, userProfile }: { currentTeam: any, userProfile: any }) {
  const [copied, setCopied] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userProfile?.id) return

    const supabase = createClient()
    
    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setNotifications(data)
    }
    
    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel(`notifications-${userProfile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          toast.success("New Notification", {
            description: payload.new.message
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` },
        (payload) => {
          setNotifications((prev) => prev.map(n => n.id === payload.new.id ? payload.new : n))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile?.id])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const copyInviteCode = () => {
    navigator.clipboard.writeText(currentTeam.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userProfile.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold hidden sm:block">{currentTeam.name} Board</h1>
          
          <div className="flex items-center text-sm px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 mr-2">Invite Code:</span>
            <span className="font-mono font-medium tracking-wider">{currentTeam.invite_code}</span>
            <button 
              onClick={copyInviteCode}
              className="ml-2 text-indigo-500 hover:text-indigo-600 transition-colors"
              title="Copy Invite Code"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              defaultValue={searchParams.get('search') || ''}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams)
                if (e.target.value) {
                  params.set('search', e.target.value)
                } else {
                  params.delete('search')
                }
                router.push(`${pathname}?${params.toString()}`)
              }}
              className="pl-9 pr-4 py-1.5 text-sm w-64 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-full transition-all outline-none"
            />
          </div>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">No notifications yet.</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={cn("p-3 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer", !notif.is_read && "bg-indigo-50/50 dark:bg-indigo-900/10")}
                        onClick={() => {
                          if (!notif.is_read) markAsRead(notif.id)
                        }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className={cn("text-sm", !notif.is_read ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-600 dark:text-slate-400")}>
                            {notif.message}
                          </p>
                          {!notif.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5" />}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-medium text-sm overflow-hidden border border-indigo-200 dark:border-indigo-800 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-all cursor-pointer outline-none"
            title="Edit Profile"
          >
            {userProfile?.full_name?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      {isProfileModalOpen && (
        <ProfileModal 
          userProfile={userProfile} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}
    </>
  )
}

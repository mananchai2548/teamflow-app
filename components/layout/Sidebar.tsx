'use client'

import { Team } from '@/lib/types'
import { LayoutDashboard, Users, Settings, LogOut, ChevronRight, Calendar } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useState, useRef, useEffect } from 'react'
import { switchTeam } from '@/lib/actions/team'

export function Sidebar({ currentTeam, teams }: { currentTeam: any, teams: any[] }) {
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const links = [
    { name: 'Board', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Members', href: '/dashboard/members', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md">
          {currentTeam.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-bold text-xl tracking-tight">TeamFlow</span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-1 overflow-y-auto">
        <div className="mb-4 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-2">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace</p>
            <Link 
              href="/onboarding" 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-3"
              title="Create or Join another workspace"
            >
              + Add
            </Link>
          </div>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="truncate">{currentTeam.name}</span>
            <ChevronRight className={cn("w-4 h-4 text-slate-400 transition-transform", isDropdownOpen && "rotate-90")} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="max-h-60 overflow-y-auto p-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setIsDropdownOpen(false)
                      if (team.id !== currentTeam.id) {
                        switchTeam(team.id)
                      }
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      team.id === currentTeam.id 
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 cursor-default" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <div className="font-medium flex items-center justify-between">
                      <span className="truncate">{team.name}</span>
                      {team.id === currentTeam.id && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20">Active</span>}
                    </div>
                    {team.members && team.members.length > 0 && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-500 line-clamp-1">
                        {team.members.map((m: any) => m.profiles?.full_name || m.profiles?.email?.split('@')[0]).join(', ')}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
        
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors", 
                isActive 
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon className="w-5 h-5 mr-3" />
              {link.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <ThemeToggle />
        <form action={logout}>
          <button 
            type="submit"
            className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-9"></div> // Placeholder
  }

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "flex-1 flex justify-center py-1.5 rounded-md text-xs font-medium transition-all",
          theme === 'light' ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        )}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          "flex-1 flex justify-center py-1.5 rounded-md text-xs font-medium transition-all",
          theme === 'system' ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        )}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "flex-1 flex justify-center py-1.5 rounded-md text-xs font-medium transition-all",
          theme === 'dark' ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        )}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}

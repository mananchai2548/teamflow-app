'use client'

import { useState } from 'react'
import { createTeam, joinTeam } from '@/lib/actions/team'
import { Users, Plus, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OnboardingPage() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(formData: FormData) {
    setLoading(true)
    const result = await createTeam(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleJoin(formData: FormData) {
    setLoading(true)
    const result = await joinTeam(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {mode === 'select' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welcome to TeamFlow</h1>
              <p className="text-slate-500 mt-2">Let's get you set up. Do you want to create a new team or join an existing one?</p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => setMode('create')}
                className="w-full flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Create a New Team</h3>
                  <p className="text-sm text-slate-500">Start fresh and invite others</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => setMode('join')}
                className="w-full flex items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Join a Team</h3>
                  <p className="text-sm text-slate-500">Enter a 6-digit invite code</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <form action={handleCreate} className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <button type="button" onClick={() => setMode('select')} className="text-sm text-indigo-600 hover:underline mb-4">
                &larr; Back
              </button>
              <h2 className="text-2xl font-bold">Create your team</h2>
              <p className="text-slate-500 mt-1">Give your team a name to get started.</p>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Team Name</label>
              <input 
                id="name" 
                name="name" 
                required 
                placeholder="e.g. Engineering, Marketing..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={cn("w-full py-2.5 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all", loading && "opacity-70")}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form action={handleJoin} className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <button type="button" onClick={() => setMode('select')} className="text-sm text-indigo-600 hover:underline mb-4">
                &larr; Back
              </button>
              <h2 className="text-2xl font-bold">Join a team</h2>
              <p className="text-slate-500 mt-1">Enter the 6-digit invite code from your team owner.</p>
            </div>
            
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium mb-1">Invite Code</label>
              <input 
                id="inviteCode" 
                name="inviteCode" 
                required 
                maxLength={6}
                placeholder="123456"
                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={cn("w-full py-2.5 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all", loading && "opacity-70")}
            >
              {loading ? 'Joining...' : 'Join Team'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

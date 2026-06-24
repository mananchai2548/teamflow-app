'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { updateProfileName } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function ProfileModal({ 
  userProfile, 
  onClose 
}: { 
  userProfile: any, 
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await updateProfileName(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form action={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md border-4 border-white dark:border-slate-800">
              {userProfile?.full_name?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              defaultValue={userProfile?.full_name || ''}
              required
              autoFocus
              placeholder="Your Name"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone_number">Phone Number</label>
            <input
              id="phone_number"
              name="phone_number"
              defaultValue={userProfile?.phone_number || ''}
              placeholder="e.g. 0812345678"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={userProfile?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
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
                "flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

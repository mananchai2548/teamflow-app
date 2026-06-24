import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Copy, Save } from 'lucide-react'

import { cookies } from 'next/headers'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id, role, teams(*)')
    .eq('user_id', user!.id)

  const cookieStore = await cookies()
  const activeTeamId = cookieStore.get('active_team_id')?.value

  let currentTeamMember = activeTeamId 
    ? teamMembers?.find(tm => tm.team_id === activeTeamId) 
    : teamMembers?.[0]

  if (!currentTeamMember) {
    currentTeamMember = teamMembers?.[0]
  }

  const currentTeam = Array.isArray(currentTeamMember?.teams) ? currentTeamMember.teams[0] : currentTeamMember?.teams

  if (!currentTeam) {
    redirect('/onboarding')
  }

  const isOwner = teamMembers?.role === 'owner'

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Workspace Settings
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage workspace preferences and details</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">General Info</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Workspace Name</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  defaultValue={currentTeam.name}
                  disabled={!isOwner}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                {isOwner && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Invite Code</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  readOnly
                  value={currentTeam.invite_code}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-indigo-600 dark:text-indigo-400 focus:outline-none"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Share this 6-digit code with your team members so they can join this workspace.
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 overflow-hidden p-6">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-500 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
              Once you delete a workspace, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              Delete Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

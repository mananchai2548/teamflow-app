'use client'

import { useState } from 'react'
import { Shield, ShieldAlert, Mail, UserPlus, X, Briefcase } from 'lucide-react'
import { updateMemberRole, inviteMemberByEmail } from '@/lib/actions/team'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function MemberList({ 
  currentTeam, 
  members,
  memberTeamsData,
  currentUserRole 
}: { 
  currentTeam: any, 
  members: any[],
  memberTeamsData: any[],
  currentUserRole: string
}) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isOwner = currentUserRole === 'owner'

  async function handleRoleChange(userId: string, newRole: 'owner' | 'member') {
    if (!isOwner) return
    const result = await updateMemberRole(userId, currentTeam.id, newRole)
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  async function handleInvite(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.append('teamId', currentTeam.id)
    
    const result = await inviteMemberByEmail(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setIsInviteModalOpen(false)
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-semibold">Members ({members.length})</h3>
        {isOwner && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>
      
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {members.map((member: any) => {
          // Get other teams for this member
          const userTeams = memberTeamsData
            .filter(data => data.user_id === member.id)
            .map(data => data.teams)
            .filter(t => t !== null) // Handle edge cases

          return (
            <div key={member.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {member.full_name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {member.full_name || 'No Name'}
                      {member.isYou && (
                        <span className="text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                          You
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isOwner && !member.isYou ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as 'owner'|'member')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="owner">Owner</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      {member.role === 'owner' ? <ShieldAlert className="w-4 h-4 text-amber-500" /> : <Shield className="w-4 h-4" />}
                      <span className="capitalize font-medium">{member.role}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Show Projects/Teams the user is part of */}
              {userTeams.length > 0 && (
                <div className="mt-4 pl-14">
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div className="flex flex-wrap gap-2">
                      {userTeams.map((team: any) => (
                        <button 
                          key={team.id}
                          onClick={() => {
                            if (team.id !== currentTeam.id) {
                              import('@/lib/actions/team').then(m => m.switchTeam(team.id))
                            }
                          }}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full border transition-colors",
                            team.id === currentTeam.id 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 cursor-default" 
                              : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                          )}
                        >
                          {team.name} {team.id === currentTeam.id && '(Current)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-semibold">Invite Member</h2>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">User Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">The user must have already registered an account.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  defaultValue="member"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
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
                  {loading ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

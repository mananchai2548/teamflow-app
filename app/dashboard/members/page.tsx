import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberList } from '@/components/team/MemberList'

import { cookies } from 'next/headers'

export default async function MembersPage() {
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

  const currentUserRole = currentTeamMember?.role || 'member'

  const { data: members } = await supabase
    .from('team_members')
    .select('role, profiles(id, full_name, email)')
    .eq('team_id', currentTeam.id)

  const formattedMembers = members?.map((m: any) => ({
    ...m.profiles,
    role: m.role,
    isYou: m.profiles.id === user!.id
  })) || []

  const memberIds = formattedMembers.map((m: any) => m.id)

  const { data: memberTeamsData } = await supabase
    .from('team_members')
    .select('user_id, teams(id, name)')
    .in('user_id', memberIds)

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Team Members</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage people in {currentTeam.name}</p>
      </div>

      <MemberList 
        currentTeam={currentTeam}
        members={formattedMembers}
        memberTeamsData={memberTeamsData || []}
        currentUserRole={currentUserRole}
      />
    </div>
  )
}

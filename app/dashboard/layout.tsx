import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { TeamProvider } from '@/lib/contexts/TeamContext'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch teams the user belongs to, including members for the sidebar dropdown
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select(`
      team_id, 
      role, 
      teams (
        *,
        members:team_members (
          profiles (full_name, email)
        )
      )
    `)
    .eq('user_id', user.id)

  if (!teamMembers || teamMembers.length === 0) {
    redirect('/onboarding')
  }

  const cookieStore = await cookies()
  const activeTeamId = cookieStore.get('active_team_id')?.value

  let currentTeamMember = activeTeamId 
    ? teamMembers.find(tm => tm.team_id === activeTeamId) 
    : teamMembers[0]

  if (!currentTeamMember) {
    currentTeamMember = teamMembers[0]
  }

  const currentTeam = Array.isArray(currentTeamMember.teams) ? currentTeamMember.teams[0] : currentTeamMember.teams

  if (!currentTeam) {
    redirect('/onboarding')
  }

  return (
    <TeamProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar currentTeam={currentTeam} teams={teamMembers.map(tm => Array.isArray(tm.teams) ? tm.teams[0] : tm.teams)} />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <Header currentTeam={currentTeam} userProfile={profile} />
          <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-slate-50/50 dark:from-indigo-950/20 dark:to-slate-950/50 pointer-events-none" />
            <div className="relative h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TeamProvider>
  )
}

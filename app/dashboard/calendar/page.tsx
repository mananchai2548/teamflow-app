import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarView } from '@/components/calendar/CalendarView'
import { cookies } from 'next/headers'

export default async function CalendarPage() {
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

  // Fetch all daily notes for this team
  // For production with lots of notes, we would filter by current month.
  // But since we want to be fast, we'll fetch them all or just a reasonable amount.
  const { data: dailyNotes } = await supabase
    .from('daily_notes')
    .select('*')
    .eq('team_id', currentTeam.id)

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar Notes</h1>
        <p className="text-slate-500 dark:text-slate-400">View and manage daily notes and urgent tasks for {currentTeam.name}.</p>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col overflow-hidden">
        <CalendarView currentTeam={currentTeam} initialNotes={dailyNotes || []} />
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { Task } from '@/lib/types'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // We already validated user in layout, get it again
  const { data: { user } } = await supabase.auth.getUser()

  // Get current team
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id, teams(*)')
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

  // Fetch team members for assignments
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, profiles(id, full_name, email)')
    .eq('team_id', currentTeam.id)

  const formattedMembers = members?.map((m: any) => m.profiles) || []

  // Fetch initial tasks
  const { data: initialTasks } = await supabase
    .from('tasks')
    .select('*, subtasks(id, is_completed), task_comments(id)')
    .eq('team_id', currentTeam.id)
    .order('created_at', { ascending: false })

  return (
    <div className="h-full flex flex-col">
      <KanbanBoard 
        initialTasks={initialTasks as Task[] || []} 
        teamId={currentTeam.id}
        members={formattedMembers}
        currentUser={user}
      />
    </div>
  )
}

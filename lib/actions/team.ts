'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function generateInviteCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createTeam(formData: FormData) {
  const name = formData.get('name') as string
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const inviteCode = generateInviteCode()

  // Start a transaction-like approach or just insert step by step
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      name,
      invite_code: inviteCode,
      created_by: user.id
    })
    .select()
    .single()

  if (teamError) {
    return { error: teamError.message }
  }

  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'owner'
    })

  if (memberError) {
    return { error: memberError.message }
  }

  redirect('/dashboard')
}

export async function joinTeam(formData: FormData) {
  const inviteCode = formData.get('inviteCode') as string
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (teamError || !team) {
    return { error: 'Invalid invite code' }
  }

  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'member'
    })

  if (memberError) {
    // If error is unique violation, they are already a member
    if (memberError.code === '23505') {
      redirect('/dashboard')
    }
    return { error: memberError.message }
  }

  redirect('/dashboard')
}

export async function updateMemberRole(userId: string, teamId: string, role: 'owner' | 'member') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('user_id', userId)
    .eq('team_id', teamId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function inviteMemberByEmail(formData: FormData) {
  const email = formData.get('email') as string
  const teamId = formData.get('teamId') as string
  const role = formData.get('role') as 'owner' | 'member' || 'member'
  const supabase = await createClient()

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    return { error: 'User with this email not found. They must register first.' }
  }

  // Insert into team_members
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: profile.id,
      role
    })

  if (memberError) {
    if (memberError.code === '23505') {
      return { error: 'User is already a member of this team.' }
    }
    return { error: memberError.message }
  }

  return { success: true }
}

import { cookies } from 'next/headers'

export async function switchTeam(teamId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_team_id', teamId, { path: '/' })
  redirect('/dashboard')
}

'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveDailyNote(teamId: string, date: string, content: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('daily_notes')
    .upsert({
      team_id: teamId,
      date,
      content,
      updated_at: new Date().toISOString()
    }, { onConflict: 'team_id, date' })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

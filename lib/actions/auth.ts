'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to onboarding after successful signup
  redirect('/onboarding')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth')
}

export async function updateProfileName(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const phoneNumber = formData.get('phone_number') as string
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Update in auth meta data
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName, phone_number: phoneNumber }
  })

  if (authError) return { error: authError.message }

  // Update in public.profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone_number: phoneNumber || null })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  return { success: true }
}

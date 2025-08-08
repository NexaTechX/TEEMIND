import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  full_name?: string
  avatar_url?: string
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user as AuthUser | null
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://synzxyecwfdlasigkint.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_84Agcx3G5dMPqzzhfCtu5g_U75NVLWp'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export async function signUp(email: string, password: string, nickname: string) {
  // Use admin API to create user with auto-confirmed email
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
      },
      // Skip email confirmation
      emailRedirectTo: undefined,
    },
  })
  
  if (error) throw error
  
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 类型定义
export type Profile = {
  id: string
  email: string
  nickname?: string
  avatar_url?: string
  gender?: 'male' | 'female' | 'other'
  birthdate?: string
  bio?: string
  school?: string
  interests?: string[]
  photos?: string[]
  is_verified: boolean
  created_at: string
}

export type Match = {
  id: string
  user_id_1: string
  user_id_2: string
  user_1_liked?: boolean
  user_2_liked?: boolean
  is_mutual: boolean
  created_at: string
}

export type Message = {
  id: string
  match_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export type Like = {
  id: string
  from_user: string
  to_user: string
  created_at: string
}

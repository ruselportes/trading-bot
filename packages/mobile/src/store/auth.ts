import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    set({ user, initialized: true })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ loading: false })
  },

  signUp: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    set({ loading: false })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

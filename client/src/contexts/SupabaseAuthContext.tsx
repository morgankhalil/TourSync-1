import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(false) // Start with loading false by default

  useEffect(() => {
    setLoading(true)
    
    // Check user on mount
    checkUser()

    // Listen for auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      // Clean up subscription if it exists
      return () => {
        if (data?.subscription?.unsubscribe) {
          data.subscription.unsubscribe()
        }
      }
    } catch (error) {
      console.warn('Error setting up auth state listener:', error)
      setLoading(false)
      return undefined
    }
  }, [])

  const checkUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.warn('Error checking user:', error)
      } else {
        setUser(data.user)
      }
    } catch (error) {
      console.warn('Exception checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Sign in error:', error.message)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Sign up error:', error.message)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error: any) {
      console.error('Sign out error:', error.message)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

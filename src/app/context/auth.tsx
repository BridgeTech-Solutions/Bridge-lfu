// app/context/auth.tsx
'use client'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Profile } from '@/types'

// Création du contexte
const AuthContext = createContext<{
  user: Profile | null
  loading: boolean
}>({
  user: null,
  loading: true,
})

// Provider pour l'authentification
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          // Si une session est active, on récupère le profil
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                setUser(profile)
              } else {
                setUser(null)
              }
              setLoading(false)
            })
        } else {
          // Si pas de session, l'utilisateur est déconnecté
          setUser(null)
          setLoading(false)
        }
      },
    )

    // Initial check on component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Handle session if it exists on load
        supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                setUser(profile)
              } else {
                setUser(null)
              }
              setLoading(false)
            })
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personnalisé pour l'utilisation dans les composants
export const useSession = () => useContext(AuthContext)
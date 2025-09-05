'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'


import type { 
  Profile
} from '@/types'
import { toast } from 'sonner'

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Utilisation de createBrowserClient pour une gestion correcte des cookies
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error("Erreur récupération du profil :", error)
          setUser(null)
        } else {
          setUser(profile)
        }
      } else {
        setUser(null)
                // Affiche une notification si la page n'est pas en cours de chargement
        if (!loading) {
          toast.error("Votre session a expiré. Veuillez vous reconnecter.");
        }
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUser(profile)
        } else {
          setUser(null)
          // Affiche une notification lors de la déconnexion
          toast.error("Votre session a expiré. Veuillez vous reconnecter.");
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      throw error
    }
    return data
  }

  const signUp = async (
    email: string,
    password: string,
    profileData: Partial<Profile>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone
        }
      }
    });

    if (error) {
      console.error("Erreur lors du signUp :", error);
      return { data: null, error };
    }

    const user = data.user;
    if (!user) {
      return {
        data: null,
        error: { message: "Veuillez confirmer votre email pour continuer." }
      };
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'new_unverified_user',
        title: 'Nouvel utilisateur à valider',
        message: `${profileData.first_name} ${profileData.last_name} (${email}) attend validation`,
        related_id: user.id,
        related_type: 'user'
      });

    if (notifError) {
      console.error("Erreur création de la notification :", notifError);
      return { data: { ...data, requiresAdminValidation: true }, error: notifError };
    }

    return {
      data: { ...data, requiresAdminValidation: true }, 
      error: null
    };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/login')
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  }

  return {
    user,
    isAuthenticated: !!user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}
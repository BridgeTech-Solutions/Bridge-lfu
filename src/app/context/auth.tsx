'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import { PermissionChecker } from '@/lib/auth/permissions'
import { toast } from 'sonner'

interface AuthContextType {
  user: Profile | null
  loading: boolean
  permissions: ReturnType<PermissionChecker['getPermissions']> | null
  isAuthenticated: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signIn: (email: string, password: string) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<any>
  signOut: () => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resetPassword: (email: string) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatePassword: (currentPassword: string, newPassword: string) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: (profileData: Partial<Profile>) => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyUser: (userId: string, role: 'admin' | 'technicien' | 'client', clientId?: string) => Promise<any>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<ReturnType<PermissionChecker['getPermissions']> | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  // Fonction pour récupérer le profil utilisateur depuis l'API
  const fetchUserProfile = async (): Promise<Profile | null> => {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        return data.profile
      }
      return null
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
      return null
    }
  }

  // Fonction pour mettre à jour les permissions basées sur l'utilisateur
  const updatePermissions = (userProfile: Profile | null) => {
    if (!userProfile) {
      setPermissions(null)
      return
    }

    const checker = new PermissionChecker(userProfile)
    setPermissions(checker.getPermissions())
  }

  // Fonction pour gérer les changements d'authentification
  const handleAuthChange = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let profile: Profile | null = null

      if (session?.user) {
        profile = await fetchUserProfile()
        setUser(profile)
        updatePermissions(profile)
      } else {
        setUser(null)
        updatePermissions(null)
      }

      setLoading(false)

      // Logique de redirection centralisée
      const currentPath = window.location.pathname
      if (!loading) {
        if (profile) {
          if (profile.role === 'unverified' && currentPath !== '/verification-pending') {
            router.push('/verification-pending')
          } else if (profile.role !== 'unverified' && currentPath === '/verification-pending') {
            router.push('/dashboard')
          } else if (currentPath.includes('/login') || currentPath.includes('/register') || currentPath.includes('/reset-password')) {
            // Rediriger vers le dashboard si l'utilisateur est connecté sur une page publique
            router.push('/dashboard')
          }
        } else {
          // Pas d'utilisateur connecté
          const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register') || currentPath.includes('/reset-password')
          if (!isAuthPage && currentPath !== '/verification-pending') {
            toast.error("Votre session a expiré. Veuillez vous reconnecter.")
            router.push('/login')
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la session:", error)
      setUser(null)
      setPermissions(null)
      setLoading(false)
    }
  }

  // Écoute des changements d'état d'authentification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange()
      }
    )

    // Appel initial
    handleAuthChange()

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const contentType = response.headers.get('content-type')

    if (!response.ok) {
      let errorMessage = 'Erreur de connexion'

      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          const errorText = await response.text()
          console.error("Réponse non-JSON de l'API:", errorText)
          throw { message: "Réponse du serveur inattendue. Veuillez vérifier la connexion ou réessayer plus tard." }
        }
      } else {
        const text = await response.text()
        console.error('Réponse non-JSON:', text)
      }

      throw new Error(errorMessage)
    }

    if (contentType?.includes('application/json')) {
      return await response.json()
    } else {
      const text = await response.text()
      console.error('Réponse réussie mais non-JSON:', text)
      throw new Error('Réponse serveur invalide')
    }
  }

  // Fonction d'inscription
  const signUp = async (email: string, password: string, profileData: Partial<Profile>) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword: password,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        phone: profileData.phone,
        company: profileData.company,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Erreur d\'inscription' } }
    }

    return {
      data: {
        ...data,
        requiresAdminValidation: data.requiresVerification
      },
      error: null
    }
  }

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setPermissions(null)
      router.push('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  // Fonction de réinitialisation de mot de passe
  const resetPassword = async (email: string) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Erreur lors de la réinitialisation' } }
    }

    return { data, error: null }
  }

  // Fonction de mise à jour de mot de passe
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    const response = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la mise à jour du mot de passe')
    }

    return data
  }

  // Fonction de mise à jour de profil
  const updateProfile = async (profileData: Partial<Profile>) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone,
        company: profileData.company,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la mise à jour du profil')
    }

    // Mettre à jour l'utilisateur et les permissions
    setUser(data.profile)
    updatePermissions(data.profile)
    return data
  }

  // Fonction de vérification d'utilisateur
  const verifyUser = async (userId: string, role: 'admin' | 'technicien' | 'client', clientId?: string) => {
    const response = await fetch('/api/auth/verify-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        role,
        clientId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la validation')
    }

    return data
  }

  // Fonction pour rafraîchir manuellement les données utilisateur
  const refreshUser = async () => {
    setLoading(true)
    await handleAuthChange()
  }

  const value: AuthContextType = {
    user,
    loading,
    permissions,
    isAuthenticated: !!user && user.role !== 'unverified',
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    verifyUser,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import { toast } from 'sonner'

interface UseAuthOptions {
  isPublicPage?: boolean
}

interface AuthError {
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
}

export function useAuth({ isPublicPage = false }: UseAuthOptions = {}) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()

  useEffect(() => {
    const handleAuthChange = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        let profile: Profile | null = null;
        
        if (session?.user) {
          const response = await fetch('/api/auth/profile');
          if (response.ok) {
            const data = await response.json();
            profile = data.profile;
            setUser(profile);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setLoading(false);

        // --- Logique de redirection centralisée ---
        const currentPath = window.location.pathname;
        if (!loading) {
          if (profile) {
            if (profile.role === 'unverified' && currentPath !== '/verification-pending') {
              router.push('/verification-pending');
            } else if (profile.role !== 'unverified' && currentPath === '/verification-pending') {
              router.push('/dashboard');
            } else if (isPublicPage && profile.role !== 'unverified') {
              // Rediriger vers le dashboard si l'utilisateur est connecté sur une page publique
              router.push('/dashboard');
            }
          } else {
            // Pas d'utilisateur connecté
            const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register') || currentPath.includes('/reset-password');
            if (!isPublicPage && !isAuthPage) {
              toast.error("Votre session a expiré. Veuillez vous reconnecter.");
              router.push('/login');
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
        setUser(null);
        setLoading(false);
      }
    };
    
    // Écoute des changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange();
      }
    );
    
    // Appel initial
    handleAuthChange();

    return () => subscription.unsubscribe();
  }, [supabase, isPublicPage, router]);

const signIn = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  // Vérifiez d'abord le content-type avant de parser
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = 'Erreur de connexion';
    
    if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Si le JSON est invalide, on utilise le message par défaut
                // Si la réponse n'est pas du JSON, on lit le texte brut une seule fois.
        const errorText = await response.text();
        console.error("Réponse non-JSON de l'API:", errorText);
        throw { message: "Réponse du serveur inattendue. Veuillez vérifier la connexion ou réessayer plus tard." };
      }
    } else {
      // Si ce n'est pas du JSON, on lit le texte
      const text = await response.text();
      console.error('Réponse non-JSON:', text);
    }
    
    throw new Error(errorMessage);
  }

  // Même vérification pour les réponses réussies
  if (contentType?.includes('application/json')) {
    return await response.json();
  } else {
    const text = await response.text();
    console.error('Réponse réussie mais non-JSON:', text);
    throw new Error('Réponse serveur invalide');
  }
};

  const signUp = async (
    email: string,
    password: string,
    profileData: Partial<Profile>
  ) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword: password, // Pour la validation côté serveur
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

  // const signOut = async () => {
  //   try {
  //     const response = await fetch('/api/auth/logout', {
  //       method: 'POST',
  //     })

  //     const { error } = await supabase.auth.signOut()
      
  //     if (error) {
  //       console.error('Erreur Supabase signOut:', error)
  //     }

  //     setUser(null)
      
  //     if (!response.ok) {
  //       console.error('Erreur API logout')
  //     }

  //     router.push('/login')
  //     return { error: null }
  //   } catch (error) {
  //     console.error('Erreur lors de la déconnexion:', error)
  //     return { error }
  //   }
  // }
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erreur Supabase signOut:', error)
      }

      setUser(null)
      router.push('/login')
      return { error: null }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      return { error }
    }
  }
  // const resetPassword = async (email: string) => {
  //   const response = await fetch('/api/auth/reset-password', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ email }),
  //   })

  //   const data = await response.json()

  //   if (!response.ok) {
  //     return { data: null, error: { message: data.error || 'Erreur lors de la réinitialisation' } }
  //   }

  //   return { data, error: null }
  // }
  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  }

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

    setUser(data.profile)
    return data
  }

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

  return {
    user,
    isAuthenticated: !!user && user.role !== 'unverified',
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    verifyUser,
  }
}

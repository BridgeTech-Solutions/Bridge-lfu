'use client'
import { useAuthContext } from '@/app/context/auth'
import type { Profile } from '@/types'

interface UseAuthOptions {
  isPublicPage?: boolean
}

interface AuthError {
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any
}

export function useAuth({ isPublicPage = false }: UseAuthOptions = {}) {
  const context = useAuthContext()

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    loading: context.loading,
    signIn: context.signIn,
    signUp: context.signUp,
    signOut: context.signOut,
    resetPassword: context.resetPassword,
    updatePassword: context.updatePassword,
    updateProfile: context.updateProfile,
    verifyUser: context.verifyUser,
    refreshUser: context.refreshUser,
  }
}

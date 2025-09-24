import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import type { Profile } from '@/types'

interface UpdateProfileData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
}

interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Hook pour gérer le profil utilisateur
export function useProfile() {
  const { user, updateProfile: authUpdateProfile, updatePassword: authUpdatePassword } = useAuth()
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)

  // Query pour récupérer les détails du profil
  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const response = await fetch(`/api/users/${user.id}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la récupération du profil')
      }
      return response.json()
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      setIsUpdating(true)
      try {
        // Utiliser la fonction updateProfile du hook useAuth
        await authUpdateProfile({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company,
        })
        return true
      } catch (error) {
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    onSuccess: () => {
      toast.success('Profil mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour du profil')
    },
  })

  // Mutation pour mettre à jour le mot de passe
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: UpdatePasswordData) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas')
      }

      if (data.newPassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères')
      }

      setIsUpdating(true)
      try {
        await authUpdatePassword(data.currentPassword, data.newPassword)
        return true
      } catch (error) {
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    onSuccess: () => {
      toast.success('Mot de passe mis à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe')
    },
  })

  // Fonction pour mettre à jour le profil
  const updateProfile = async (data: UpdateProfileData) => {
    return updateProfileMutation.mutateAsync(data)
  }

  // Fonction pour mettre à jour le mot de passe
  const updatePassword = async (data: UpdatePasswordData) => {
    return updatePasswordMutation.mutateAsync(data)
  }

  // Fonction pour obtenir les initiales
  const getInitials = () => {
    const firstName = profile?.first_name || user?.first_name || ''
    const lastName = profile?.last_name || user?.last_name || ''
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  // Fonction pour obtenir le nom complet
  const getFullName = () => {
    const firstName = profile?.first_name || user?.first_name || ''
    const lastName = profile?.last_name || user?.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'Utilisateur'
  }

  // Fonction pour obtenir le nom du rôle affiché
  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrateur',
      technicien: 'Technicien',
      client: 'Client',
      unverified: 'Non vérifié'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  return {
    profile: profile || user,
    isLoading,
    error,
    isUpdating,
    updateProfile,
    updatePassword,
    refetch,
    getInitials,
    getFullName,
    getRoleDisplayName,
    // États des mutations
    isUpdateProfilePending: updateProfileMutation.isPending,
    isUpdatePasswordPending: updatePasswordMutation.isPending,
  }
}
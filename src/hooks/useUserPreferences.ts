// hooks/useUserPreferences.ts
import {  useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'fr' | 'en'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dashboard: {
    itemsPerPage: number
  }
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'fr',
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
  dashboard: {
    itemsPerPage: 10,
  },
}

export function useUserPreferences() {
//   const { user } = useSession(); 
  const { user, loading } = useAuth()

  const queryClient = useQueryClient()

  const {
    data: preferences = defaultPreferences,
    isLoading,
    error
  } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async (): Promise<UserPreferences> => {
      const response = await fetch('/api/users/preferences')
      
      if (!response.ok) {
        if (response.status === 404) {
          // Pas de préférences trouvées, utiliser les valeurs par défaut
          return defaultPreferences
        }
        throw new Error('Erreur lors de la récupération des préférences')
      }
      
      const data = await response.json()
      
      // Transformer les données de la DB vers le format attendu
      return {
        theme: data.theme,
        language: data.language,
        notifications: {
          email: data.email_notifications,
          push: data.push_notifications,
          sms: data.sms_notifications,
        },
        dashboard: {
          itemsPerPage: data.items_per_page,
        },
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      // Transformer vers le format DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUpdates: any = {}
      
      if (updates.theme) dbUpdates.theme = updates.theme
      if (updates.language) dbUpdates.language = updates.language
      if (updates.notifications?.email !== undefined) dbUpdates.email_notifications = updates.notifications.email
      if (updates.notifications?.push !== undefined) dbUpdates.push_notifications = updates.notifications.push
      if (updates.notifications?.sms !== undefined) dbUpdates.sms_notifications = updates.notifications.sms
      if (updates.dashboard?.itemsPerPage) dbUpdates.items_per_page = updates.dashboard.itemsPerPage

      const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbUpdates),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des préférences')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
    },
  })

  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/users/preferences', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation des préférences')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] })
    },
  })

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    return updatePreferencesMutation.mutateAsync(updates)
  }, [updatePreferencesMutation])

  const resetPreferences = useCallback(() => {
    return resetPreferencesMutation.mutateAsync()
  }, [resetPreferencesMutation])

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
    isUpdating: updatePreferencesMutation.isPending,
    isResetting: resetPreferencesMutation.isPending,
  }
}
// hooks/useSettings.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AppSetting } from '@/types'

export interface SettingsData {
  [key: string]: {
    value: unknown
    category: string
    description?: string
    isPublic?: boolean
    updatedAt?: string
  }
}

export interface SettingsResponse {
  settings: SettingsData
  categories: string[]
}

// Hook principal pour les paramètres
export function useSettings(category?: string, publicOnly: boolean = false) {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['settings', category, publicOnly],
    queryFn: async (): Promise<SettingsResponse> => {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (publicOnly) params.append('public', 'true')

      const response = await fetch(`/api/settings?${params}`)
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paramètres')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation pour mettre à jour plusieurs paramètres
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Record<string, unknown>) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Paramètres mis à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Mutation pour créer un nouveau paramètre
  const createSettingMutation = useMutation({
    mutationFn: async (newSetting: {
      key: string
      value: unknown
      category: string
      description?: string
      isPublic?: boolean
    }) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la création')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Paramètre créé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateSettings = useCallback((settings: Record<string, unknown>) => {
    updateSettingsMutation.mutate(settings)
  }, [updateSettingsMutation])

  const createSetting = useCallback((setting: {
    key: string
    value: unknown
    category: string
    description?: string
    isPublic?: boolean
  }) => {
    createSettingMutation.mutate(setting)
  }, [createSettingMutation])

  // Helper pour obtenir une valeur spécifique
  const getSetting = useCallback((key: string) => {
    return data?.settings[key]?.value
  }, [data])

  // Helper pour obtenir tous les paramètres d'une catégorie
  const getSettingsByCategory = useCallback((cat: string) => {
    if (!data?.settings) return {}
    
    return Object.entries(data.settings)
      .filter(([_, setting]) => setting.category === cat)
      .reduce((acc, [key, setting]) => {
        acc[key] = setting
        return acc
      }, {} as SettingsData)
  }, [data])

  return {
    settings: data?.settings || {},
    categories: data?.categories || [],
    isLoading,
    error,
    refetch,
    updateSettings,
    createSetting,
    getSetting,
    getSettingsByCategory,
    isUpdating: updateSettingsMutation.isPending,
    isCreating: createSettingMutation.isPending,
  }
}

// Hook pour un paramètre spécifique
export function useSetting(key: string) {
  const queryClient = useQueryClient()

  const {
    data: setting,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['setting', key],
    queryFn: async (): Promise<AppSetting> => {
      const response = await fetch(`/api/settings/${key}`)
      if (!response.ok) {
        throw new Error('Paramètre non trouvé')
      }
      return response.json()
    },
    enabled: !!key,
    staleTime: 5 * 60 * 1000,
  })

  // Mutation pour mettre à jour un paramètre spécifique
  const updateMutation = useMutation({
    mutationFn: async (data: { 
      value: unknown
      description?: string
      isPublic?: boolean 
    }) => {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setting', key] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Paramètre mis à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Mutation pour supprimer un paramètre
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la suppression')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Paramètre supprimé')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateSetting = useCallback((data: { 
    value: unknown
    description?: string
    isPublic?: boolean 
  }) => {
    updateMutation.mutate(data)
  }, [updateMutation])

  const deleteSetting = useCallback(() => {
    deleteMutation.mutate()
  }, [deleteMutation])

  return {
    setting,
    isLoading,
    error,
    updateSetting,
    deleteSetting,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Hook pour gérer les préférences utilisateur (localStorage + base de données)
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'fr' as 'fr' | 'en',
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    dashboard: {
      defaultView: 'cards' as 'cards' | 'table' | 'charts',
      itemsPerPage: 10,
      autoRefresh: false,
      refreshInterval: 30000,
    },
  })

  useEffect(() => {
    // Charger les préférences depuis le localStorage au démarrage
    const saved = localStorage.getItem('userPreferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch (e) {
        console.warn('Erreur lors du chargement des préférences:', e)
      }
    }
  }, [])

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates }
      localStorage.setItem('userPreferences', JSON.stringify(newPrefs))
      return newPrefs
    })
  }, [])

  const resetPreferences = useCallback(() => {
    const defaultPrefs = {
      theme: 'system' as const,
      language: 'fr' as const,
      notifications: { email: true, push: false, sms: false },
      dashboard: {
        defaultView: 'cards' as const,
        itemsPerPage: 10,
        autoRefresh: false,
        refreshInterval: 30000,
      },
    }
    setPreferences(defaultPrefs)
    localStorage.setItem('userPreferences', JSON.stringify(defaultPrefs))
  }, [])

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  }
}
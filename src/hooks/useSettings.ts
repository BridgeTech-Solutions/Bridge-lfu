// hooks/useSettings.ts
import {  useCallback} from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthPermissions } from './index'
import type { AppSetting } from '@/types'

interface SettingsResponse {
  settings: Record<string, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
    category: string
    description: string | null
    isPublic: boolean
    updatedAt: string | null
  }>
  categories: string[]
}

interface CreateSettingData {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  category: string
  description?: string
  isPublic?: boolean
}

interface UpdateSettingsData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>
}

export function useSettings(category?: string, publicOnly?: boolean) {
  const permissions = useAuthPermissions()
  const queryClient = useQueryClient()

  // Construction des paramètres de requête
  const queryParams = new URLSearchParams()
  if (category) queryParams.append('category', category)
  if (publicOnly) queryParams.append('public', 'true')

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['settings', category, publicOnly],
    queryFn: async (): Promise<SettingsResponse> => {
      const url = `/api/settings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    },
    enabled: permissions.can('read', 'notifications') || publicOnly === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UpdateSettingsData) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la mise à jour')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const createSettingMutation = useMutation({
    mutationFn: async (data: CreateSettingData) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la création')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la suppression')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSettings = useCallback(async (settings: Record<string, any>) => {
    return updateSettingsMutation.mutateAsync({ settings })
  }, [updateSettingsMutation])

  const createSetting = useCallback(async (data: CreateSettingData) => {
    return createSettingMutation.mutateAsync(data)
  }, [createSettingMutation])

  const deleteSetting = useCallback(async (key: string) => {
    return deleteSettingMutation.mutateAsync(key)
  }, [deleteSettingMutation])

  const getSetting = useCallback((key: string) => {
    return data?.settings?.[key]
  }, [data])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSettingValue = useCallback((key: string, defaultValue?: any) => {
    const setting = getSetting(key)
    return setting?.value ?? defaultValue
  }, [getSetting])

  const getSettingsByCategory = useCallback((categoryName: string) => {
    if (!data?.settings) return {}
    
    return Object.entries(data.settings).reduce((acc, [key, setting]) => {
      if (setting.category === categoryName) {
        acc[key] = setting
      }
      return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any>)
  }, [data])

  return {
    settings: data?.settings || {},
    categories: data?.categories || [],
    isLoading,
    error,
    refetch,
    updateSettings,
    createSetting,
    deleteSetting,
    getSetting,
    getSettingValue,
    getSettingsByCategory,
    isUpdating: updateSettingsMutation.isPending,
    isCreating: createSettingMutation.isPending,
    isDeleting: deleteSettingMutation.isPending,
    canManage: permissions.can('create', 'users'), // Admin seulement
  }
}

export function useSetting(key: string) {
  const permissions = useAuthPermissions()
  
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['setting', key],
    queryFn: async (): Promise<AppSetting> => {
      const response = await fetch(`/api/settings/${key}`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    },
    enabled: !!key && (permissions.can('read', 'notifications') || permissions.can('create', 'users')),
  })

  const updateSettingMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: { value: any; description?: string; isPublic?: boolean }) => {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de la mise à jour')
      }

      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSetting = useCallback(async (value: any, options?: { description?: string; isPublic?: boolean }) => {
    return updateSettingMutation.mutateAsync({ value, ...options })
  }, [updateSettingMutation])

  return {
    setting: data,
    isLoading,
    error,
    refetch,
    updateSetting,
    isUpdating: updateSettingMutation.isPending,
    canManage: permissions.can('create', 'users'),
  }
}

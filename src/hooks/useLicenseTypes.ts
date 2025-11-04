// hooks/useLicenseTypes.ts
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

// Types pour les types de licence
export interface LicenseType {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface LicenseTypeInsert {
  name: string
  code: string
  description?: string | null
  is_active?: boolean
}

export interface LicenseTypeUpdate {
  id: string
  name?: string
  code?: string
  description?: string | null
  is_active?: boolean
}

// Hook pour récupérer tous les types de licence
export function useLicenseTypes() {
  const { user, loading: authLoading } = useAuth()

  const fetchLicenseTypes = async (): Promise<LicenseType[]> => {
    const response = await fetch('/api/license-types', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    return response.json().then(res => res.data || [])
  }

  const {
    data: types,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['licenseTypes'],
    queryFn: fetchLicenseTypes,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  return {
    data: types || null,
    isLoading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    refetch
  }
}

// Hook pour récupérer un type de licence spécifique
export function useLicenseType(id: string) {
  const { user, loading: authLoading } = useAuth()

  const fetchLicenseType = async (): Promise<LicenseType> => {
    const response = await fetch(`/api/license-types/${id}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    return response.json().then(res => res.data)
  }

  const {
    data: type,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['licenseType', id],
    queryFn: fetchLicenseType,
    enabled: !!user && !authLoading && !!id,
    staleTime: 5 * 60 * 1000,
  })

  return {
    data: type || null,
    isLoading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    refetch
  }
}

// Hook pour créer un type de licence
export function useCreateLicenseType() {
  const queryClient = useQueryClient()

  const createLicenseType = async (data: LicenseTypeInsert): Promise<LicenseType> => {
    const response = await fetch('/api/license-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    return response.json().then(res => res.data)
  }

  const mutation = useMutation({
    mutationFn: createLicenseType,
    onSuccess: () => {
      // Invalider et refetch les queries liées
      queryClient.invalidateQueries({ queryKey: ['licenseTypes'] })
      queryClient.invalidateQueries({ queryKey: ['licenseStats'] })

      toast.success('Type de licence créé avec succès')
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création: ${error.message}`)
    }
  })

  return {
    create: mutation.mutate,
    createAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error?.message || null,
    reset: mutation.reset
  }
}

// Hook pour mettre à jour un type de licence
export function useUpdateLicenseType() {
  const queryClient = useQueryClient()

  const updateLicenseType = async (data: LicenseTypeUpdate): Promise<LicenseType> => {
    const { id, ...updateData } = data
    const response = await fetch(`/api/license-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    return response.json().then(res => res.data)
  }

  const mutation = useMutation({
    mutationFn: updateLicenseType,
    onSuccess: (updatedType) => {
      // Mettre à jour le cache
      queryClient.invalidateQueries({ queryKey: ['licenseTypes'] })
      queryClient.invalidateQueries({ queryKey: ['licenseType', updatedType.id] })
      queryClient.invalidateQueries({ queryKey: ['licenseStats'] })

      toast.success('Type de licence mis à jour avec succès')
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`)
    }
  })

  return {
    update: mutation.mutate,
    updateAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error?.message || null,
    reset: mutation.reset
  }
}

// Hook pour supprimer un type de licence
export function useDeleteLicenseType() {
  const queryClient = useQueryClient()

  const deleteLicenseType = async (id: string): Promise<void> => {
    const response = await fetch(`/api/license-types/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }
  }

  const mutation = useMutation({
    mutationFn: deleteLicenseType,
    onSuccess: (_, deletedId) => {
      // Supprimer du cache
      queryClient.invalidateQueries({ queryKey: ['licenseTypes'] })
      queryClient.removeQueries({ queryKey: ['licenseType', deletedId] })
      queryClient.invalidateQueries({ queryKey: ['licenseStats'] })

      toast.success('Type de licence supprimé avec succès')
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`)
    }
  })

  return {
    delete: mutation.mutate,
    deleteAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error?.message || null,
    reset: mutation.reset
  }
}

// Hook combiné pour toutes les opérations CRUD
export function useLicenseTypesActions() {
  const queryClient = useQueryClient()

  const createMutation = useCreateLicenseType()
  const updateMutation = useUpdateLicenseType()
  const deleteMutation = useDeleteLicenseType()

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['licenseTypes'] })
    queryClient.invalidateQueries({ queryKey: ['licenseStats'] })
  }

  return {
    // Queries
    refreshAll,

    // Mutations
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,

    // États combinés
    isLoading: createMutation.isCreating || updateMutation.isUpdating || deleteMutation.isDeleting,
    hasError: !!(createMutation.error || updateMutation.error || deleteMutation.error)
  }
}

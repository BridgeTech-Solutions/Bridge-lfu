// hooks/useUsers.ts
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import type { Profile, UserRole, Client } from '@/types'

// Types spécifiques pour la gestion des utilisateurs
interface UserWithClient extends Profile {
  clients?: Pick<Client, 'id' | 'name'>
}

interface UserFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  role: UserRole
  clientId?: string
  password?: string
}

interface ValidationData {
  role: UserRole
  clientId?: string
}

interface UsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
}

interface UsersResponse {
  data: UserWithClient[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

interface UserActivityResponse {
  data: Array<{
    id: string
    action: string
    table_name: string
    record_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    old_values: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new_values: any
    ip_address: string
    user_agent: string
    created_at: string
    actionLabel: string
    tableLabel: string
    summary: string
  }>
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

// Fonction pour récupérer les utilisateurs
const fetchUsers = async (params: UsersParams): Promise<UsersResponse> => {
  const url = new URL('/api/users', window.location.origin)
  
  if (params.page) url.searchParams.set('page', params.page.toString())
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.search) url.searchParams.set('search', params.search)
  if (params.role && params.role !== 'all') url.searchParams.set('role', params.role)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des utilisateurs')
  }

  return response.json()
}

// Fonction pour récupérer un utilisateur par ID
const fetchUserById = async (id: string): Promise<UserWithClient> => {
  const response = await fetch(`/api/users/${id}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération de l\'utilisateur')
  }

  return response.json()
}

// Fonction pour créer un utilisateur
const createUser = async (userData: UserFormData): Promise<UserWithClient> => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la création de l\'utilisateur')
  }

  return response.json()
}

// Fonction pour mettre à jour un utilisateur
const updateUser = async (id: string, data: UserFormData): Promise<UserWithClient> => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la mise à jour de l\'utilisateur')
  }

  return response.json()
}

// Fonction pour valider un utilisateur
const validateUser = async (userId: string, validationData: ValidationData): Promise<UserWithClient> => {
  const response = await fetch(`/api/users/${userId}/validate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validationData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la validation de l\'utilisateur')
  }

  return response.json()
}

// Fonction pour supprimer un utilisateur
const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la suppression de l\'utilisateur')
  }
}

// Fonction pour récupérer l'activité d'un utilisateur
const fetchUserActivity = async (userId: string): Promise<UserActivityResponse> => {
  const response = await fetch(`/api/users/${userId}/activity`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des logs')
  }

  return response.json()
}

// Hook principal pour la gestion des utilisateurs
export function useUsers(params: UsersParams = {}) {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['users', params.page, params.limit, params.search, params.role]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchUsers(params),
    enabled: !!user && !loading,
    staleTime: 0,
  })

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!data) return { total: 0, unverified: 0, admins: 0, technicians: 0, clients: 0 }
    
    return data.data.reduce((acc, user) => {
      acc.total++
      switch (user.role) {
        case 'unverified': acc.unverified++; break
        case 'admin': acc.admins++; break
        case 'technicien': acc.technicians++; break
        case 'client': acc.clients++; break
      }
      return acc
    }, { total: 0, unverified: 0, admins: 0, technicians: 0, clients: 0 })
  }, [data])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: UserFormData }) => updateUser(id, data),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const validateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: ValidationData }) => 
      validateUser(userId, data),
    onSuccess: () => {
      toast.success('Utilisateur validé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('Utilisateur supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return {
    // Données
    users: data?.data || [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    stats,
    pagination: data ? {
      count: data.count,
      page: data.page,
      totalPages: data.totalPages,
      hasMore: data.hasMore
    } : null,
    
    // Actions
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    validateUser: validateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    refetch,
    
    // États des mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isValidating: validateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Hook pour récupérer un utilisateur spécifique
export function useUser(id: string) {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUserById(id),
    enabled: !!user && !loading && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook pour récupérer l'activité d'un utilisateur
export function useUserActivity(userId: string) {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['user-activity', userId],
    queryFn: () => fetchUserActivity(userId),
    enabled: !!user && !loading && !!userId,
    staleTime: 0,
  })
}

// Hook pour les actions sur les utilisateurs (séparé pour une meilleure réutilisabilité)
export function useUserActions() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: UserFormData }) => updateUser(id, data),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const validateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string, data: ValidationData }) => 
      validateUser(userId, data),
    onSuccess: () => {
      toast.success('Utilisateur validé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('Utilisateur supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return {
    updateUser: updateMutation.mutateAsync,
    validateUser: validateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isValidating: validateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Types exportés pour l'utilisation dans les composants
export type { UserWithClient, UserFormData, ValidationData, UsersParams }
// hooks/useClients.ts
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import type { Client } from '@/types'

// Types spécifiques pour la gestion des clients
interface ClientFormData {
  name: string
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactPerson?: string | null
  sector?: string | null
}


interface ClientsParams {
  page?: number
  limit?: number
  search?: string
  sector?: string
}

interface ClientsResponse {
  data: Client[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

interface ClientStats {
  total: number
  bySector: Record<string, number>
  recent: number // Clients créés dans les 30 derniers jours
}

// Fonction pour récupérer les clients
const fetchClients = async (params: ClientsParams): Promise<ClientsResponse> => {
  const url = new URL('/api/clients', window.location.origin)
  
  if (params.page) url.searchParams.set('page', params.page.toString())
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.search) url.searchParams.set('search', params.search)
  if (params.sector && params.sector !== 'all') url.searchParams.set('sector', params.sector)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des clients')
  }

  return response.json()
}

// Fonction pour récupérer un client par ID
const fetchClientById = async (id: string): Promise<Client> => {
  const response = await fetch(`/api/clients/${id}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération du client')
  }

  return response.json()
}

// Fonction pour créer un client
const createClient = async (clientData: ClientFormData): Promise<Client> => {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la création du client')
  }

  return response.json()
}

// Fonction pour mettre à jour un client
const updateClient = async (id: string, data: ClientFormData): Promise<Client> => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la mise à jour du client')
  }

  return response.json()
}

// Fonction pour supprimer un client
const deleteClient = async (clientId: string): Promise<void> => {
  const response = await fetch(`/api/clients/${clientId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la suppression du client')
  }
}

// Fonction pour récupérer les secteurs disponibles
const fetchSectors = async (): Promise<string[]> => {
  const response = await fetch('/api/clients/sectors')
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des secteurs')
  }

  return response.json()
}

// Hook principal pour la gestion des clients
export function useClients(params: ClientsParams = {}) {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['clients', params.page, params.limit, params.search, params.sector]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchClients(params),
    enabled: !!user && !loading,
    staleTime: 0,
  })

  // Calculer les statistiques
  const stats: ClientStats = useMemo(() => {
    if (!data) return { total: 0, bySector: {}, recent: 0 }
    
    const bySector: Record<string, number> = {}
    let recent = 0
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    data.data.forEach((client) => {
      // Compter par secteur
      if (client.sector) {
        bySector[client.sector] = (bySector[client.sector] || 0) + 1
      }
      
      // Compter les clients récents
      if (client.created_at && new Date(client.created_at) > thirtyDaysAgo) {
        recent++
      }
    })

    return {
      total: data.count,
      bySector,
      recent
    }
  }, [data])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast.success('Client créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ClientFormData }) => updateClient(id, data),
    onSuccess: () => {
      toast.success('Client mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success('Client supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return {
    // Données
    clients: data?.data || [],
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
    createClient: createMutation.mutateAsync,
    updateClient: updateMutation.mutateAsync,
    deleteClient: deleteMutation.mutateAsync,
    refetch,
    
    // États des mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Hook pour récupérer un client spécifique
export function useClient(id: string) {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClientById(id),
    enabled: !!user && !loading && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook pour récupérer les secteurs
export function useSectors() {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['sectors'],
    queryFn: fetchSectors,
    enabled: !!user && !loading,
    staleTime: 10 * 60 * 1000, // Cache pendant 10 minutes
    gcTime: 30 * 60 * 1000,
  })
}

// Hook pour les actions sur les clients (séparé pour une meilleure réutilisabilité)
export function useClientActions(options?: {
  onSuccess?: () => void
  onError?: (error: string) => void
}) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ClientFormData }) => updateClient(id, data),
    onSuccess: () => {
      toast.success('Client mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client'] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
      options?.onError?.(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success('Client supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
      options?.onError?.(error.message)
    }
  })

  return {
    updateClient: updateMutation.mutateAsync,
    deleteClient: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Types exportés pour l'utilisation dans les composants
export type { ClientFormData, ClientsParams, ClientStats }
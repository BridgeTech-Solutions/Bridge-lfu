// hooks/useClients.ts
import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import { useStablePermissions } from './index'
import type { Client } from '@/types'

// Types spécifiques pour la gestion des clients
export interface ClientFormData {
  name: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  sector?: string
}

export interface ClientsParams {
  page?: number
  limit?: number
  search?: string
  sector?: string
}

export interface ClientsResponse {
  data: Client[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

export interface ClientStats {
  total: number
  sectors: number
  recentClients: number
  topSectors: Array<{
    sector: string
    count: number
    percentage: number
  }>
}

// Fonction pour récupérer les clients avec pagination et filtres
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

// Fonction pour récupérer les secteurs
const fetchSectors = async (): Promise<string[]> => {
  const response = await fetch('/api/clients/sectors')
  
  if (!response.ok) {
    // Fallback vers l'API existante si l'endpoint sectors n'existe pas
    const clientsResponse = await fetch('/api/clients?limit=1000')
    if (!clientsResponse.ok) {
      throw new Error('Erreur lors de la récupération des secteurs')
    }
    const { data: clients } = await clientsResponse.json()
    const sectors = clients
      .map((client: Client) => client.sector)
      .filter((sector: string) => sector)
      .filter((sector: string, index: number, arr: string[]) => arr.indexOf(sector) === index)
    return sectors.sort()
  }

  return response.json()
}

// Hook principal pour la gestion des clients
export function useClients(params: ClientsParams = {}) {
  const { user, loading } = useAuth()
  const permissions = useStablePermissions()
  const queryClient = useQueryClient()

  const queryKey = ['clients', params.page, params.limit, params.search, params.sector]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchClients(params),
    enabled: !!user && !loading,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Calculer les statistiques des clients
  const stats = useMemo((): ClientStats => {
    if (!data) return { total: 0, sectors: 0, recentClients: 0, topSectors: [] }
    
    const sectors = [...new Set(data.data.map(client => client.sector).filter(Boolean))]
    const recentClients = data.data.filter(client => {
      const createdAt = new Date(client.created_at!)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdAt > thirtyDaysAgo
    }).length

    // Calculer les top secteurs
    const sectorCounts = data.data.reduce((acc, client) => {
      if (client.sector) {
        acc[client.sector] = (acc[client.sector] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topSectors = Object.entries(sectorCounts)
      .map(([sector, count]) => ({
        sector,
        count,
        percentage: Math.round((count / data.data.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total: data.count,
      sectors: sectors.length,
      recentClients,
      topSectors
    }
  }, [data])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (newClient) => {
      toast.success('Client créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.setQueryData(['client', newClient.id], newClient)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ClientFormData }) => updateClient(id, data),
    onSuccess: (updatedClient) => {
      toast.success('Client modifié avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.setQueryData(['client', updatedClient.id], updatedClient)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: (_, clientId) => {
      toast.success('Client supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.removeQueries({ queryKey: ['client', clientId] })
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
    
    // Permissions
    canCreate: permissions.can('create', 'clients'),
    canUpdate: permissions.can('update', 'clients'),
    canDelete: permissions.can('delete', 'clients'),
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

// Hook pour les secteurs
export function useSectors() {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['sectors'],
    queryFn: fetchSectors,
    enabled: !!user && !loading,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Hook pour les actions sur les clients (séparé pour une meilleure réutilisabilité)
export function useClientActions() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: ClientFormData }) => updateClient(id, data),
    onSuccess: (updatedClient) => {
      toast.success('Client modifié avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.setQueryData(['client', updatedClient.id], updatedClient)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: (_, clientId) => {
      toast.success('Client supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.removeQueries({ queryKey: ['client', clientId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const confirmDelete = useCallback((clientId: string, clientName: string) => {
    const isConfirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le client "${clientName}" ?\n\nCette action est irréversible.`
    )
    
    if (isConfirmed) {
      return deleteMutation.mutateAsync(clientId)
    }
    
    return Promise.resolve()
  }, [deleteMutation])

  return {
    updateClient: updateMutation.mutateAsync,
    deleteClient: deleteMutation.mutateAsync,
    confirmDelete,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

// Hook pour la recherche et filtres avancés
export function useClientFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'sector'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedSector('')
    setSortBy('name')
    setSortOrder('asc')
  }, [])

  const hasFilters = useMemo(() => {
    return searchTerm || selectedSector || sortBy !== 'name' || sortOrder !== 'asc'
  }, [searchTerm, selectedSector, sortBy, sortOrder])

  return {
    filters: {
      searchTerm,
      selectedSector,
      sortBy,
      sortOrder
    },
    setters: {
      setSearchTerm,
      setSelectedSector,
      setSortBy,
      setSortOrder
    },
    clearFilters,
    hasFilters
  }
}

// Hook pour la validation côté client
export function useClientValidation() {
  const validateClient = useCallback((data: Partial<ClientFormData>) => {
    const errors: Record<string, string> = {}

    if (!data.name?.trim()) {
      errors.name = 'Le nom du client est requis'
    }

    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      errors.contactEmail = 'Format d\'email invalide'
    }

    if (data.contactPhone && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(data.contactPhone)) {
      errors.contactPhone = 'Format de téléphone invalide'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [])

  return { validateClient }
}

// Types exportés pour l'utilisation dans les composants
// export type { ClientFormData, ClientsParams, ClientStats }
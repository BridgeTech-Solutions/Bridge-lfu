// hooks/useEquipments.ts
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

// Types spécifiques pour la gestion des équipements
interface EquipmentFormData {
  name: string
  type: 'pc' | 'serveur' | 'routeur' | 'switch' | 'imprimante' | 'autre'
  brand?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  estimated_obsolescence_date?: string
  end_of_sale?: string
  warranty_end_date?: string
  cost?: number
  client_id: string
  location?: string
  description?: string
  status?: 'actif' | 'en_maintenance' | 'obsolete' | 'bientot_obsolete' | 'retire'
}

interface EquipmentAttachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  uploaded_by_profile?: {
    first_name: string
    last_name: string
  }
}

interface EquipmentParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  clientId?: string
  type?: string
}

interface EquipmentWithClient {
  id: string
  name: string
  type: string
  brand?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  estimated_obsolescence_date?: string
  end_of_sale?: string
  warranty_end_date?: string
  status: string
  cost?: number
  client_id: string
  client_name?: string
  client_email?: string
  location?: string
  description?: string
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
}

interface EquipmentResponse {
  data: EquipmentWithClient[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

// Fonction pour récupérer les équipements
const fetchEquipment = async (params: EquipmentParams): Promise<EquipmentResponse> => {
  const url = new URL('/api/equipment', window.location.origin)
  
  if (params.page) url.searchParams.set('page', params.page.toString())
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.search) url.searchParams.set('search', params.search)
  if (params.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params.clientId && params.clientId !== 'all') url.searchParams.set('client_id', params.clientId)
  if (params.type && params.type !== 'all') url.searchParams.set('type', params.type)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des équipements')
  }

  return response.json()
}

// Fonction pour récupérer un équipement par ID
const fetchEquipmentById = async (id: string): Promise<EquipmentWithClient> => {
  const response = await fetch(`/api/equipment/${id}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération de l\'équipement')
  }

  return response.json()
}

// Fonction pour créer un équipement
const createEquipment = async (equipmentData: EquipmentFormData): Promise<EquipmentWithClient> => {
  const response = await fetch('/api/equipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(equipmentData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la création de l\'équipement')
  }

  return response.json()
}

// Fonction pour mettre à jour un équipement
const updateEquipment = async (id: string, data: EquipmentFormData): Promise<EquipmentWithClient> => {
  const response = await fetch(`/api/equipment/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la mise à jour de l\'équipement')
  }

  return response.json()
}

// Fonction pour supprimer un équipement
const deleteEquipment = async (equipmentId: string): Promise<void> => {
  const response = await fetch(`/api/equipment/${equipmentId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la suppression de l\'équipement')
  }
}

// Fonction pour mettre à jour le statut d'un équipement
const updateEquipmentStatus = async (id: string, status: string): Promise<EquipmentWithClient> => {
  const response = await fetch(`/api/equipment/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la mise à jour du statut')
  }

  return response.json()
}

// Fonction pour rafraîchir tous les statuts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const refreshAllStatuses = async (): Promise<{ message: string, details: any[] }> => {
  const response = await fetch('/api/equipment/refresh-status', {
    method: 'PUT'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors du rafraîchissement des statuts')
  }

  return response.json()
}

// Fonction pour récupérer les pièces jointes d'un équipement
const fetchEquipmentAttachments = async (equipmentId: string): Promise<EquipmentAttachment[]> => {
  const response = await fetch(`/api/equipment/${equipmentId}/attachments`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des pièces jointes')
  }

  return response.json()
}

// Fonction pour ajouter une pièce jointe
const uploadAttachment = async (equipmentId: string, file: File, fileType: string): Promise<EquipmentAttachment> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('file_type', fileType)

  const response = await fetch(`/api/equipment/${equipmentId}/attachments`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de l\'upload')
  }

  return response.json()
}

// Fonction pour supprimer une pièce jointe
const deleteAttachment = async (equipmentId: string, attachmentId: string): Promise<void> => {
  const response = await fetch(`/api/equipment/${equipmentId}/attachments/${attachmentId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la suppression')
  }
}

// Fonction pour télécharger une pièce jointe
const downloadAttachment = async (equipmentId: string, attachmentId: string): Promise<{ download_url: string, file_name: string }> => {
  const response = await fetch(`/api/equipment/${equipmentId}/attachments/${attachmentId}/download`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors du téléchargement')
  }

  return response.json()
}
// Ajouter après les autres fonctions de fetch
const exportEquipment = async (params: EquipmentParams, format: 'xlsx' | 'csv' | 'json' = 'xlsx'): Promise<void> => {
  const url = new URL('/api/equipment/export', window.location.origin)
  
  if (params.search) url.searchParams.set('search', params.search)
  if (params.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params.clientId && params.clientId !== 'all') url.searchParams.set('client_id', params.clientId)
  if (params.type && params.type !== 'all') url.searchParams.set('type', params.type)
  url.searchParams.set('format', format)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de l\'exportation')
  }

  // Télécharger le fichier
  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  
  // Déterminer l'extension selon le format
  const extensions = {
    xlsx: 'xlsx',
    csv: 'csv',
    json: 'json'
  }
  
  const fileName = `equipements_${new Date().toISOString().split('T')[0]}.${extensions[format]}`
  link.download = fileName
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}
// Hook principal pour la gestion des équipements
export function useEquipments(params: EquipmentParams = {}) {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = [
    'equipment', 
    params.page, 
    params.limit, 
    params.search, 
    params.status, 
    params.clientId, 
    params.type
  ]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchEquipment(params),
    enabled: !!user && !loading,
    staleTime: 0,
  })

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!data) return { total: 0, actif: 0, en_maintenance: 0, obsolete: 0, bientot_obsolete: 0, retire: 0 }
    
    return data.data.reduce((acc, equipment) => {
      acc.total++
      switch (equipment.status) {
        case 'actif': acc.actif++; break
        case 'en_maintenance': acc.en_maintenance++; break
        case 'obsolete': acc.obsolete++; break
        case 'bientot_obsolete': acc.bientot_obsolete++; break
        case 'retire': acc.retire++; break
      }
      return acc
    }, { total: 0, actif: 0, en_maintenance: 0, obsolete: 0, bientot_obsolete: 0, retire: 0 })
  }, [data])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      toast.success('Équipement créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: EquipmentFormData }) => updateEquipment(id, data),
    onSuccess: () => {
      toast.success('Équipement mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment-detail'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      toast.success('Équipement supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const refreshStatusMutation = useMutation({
    mutationFn: refreshAllStatuses,
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
  const exportMutation = useMutation({
    mutationFn: ({ params, format }: { params: EquipmentParams, format: 'xlsx' | 'csv' | 'json' }) => 
      exportEquipment(params, format),
    onSuccess: () => {
      toast.success('Exportation réussie')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
  return {
    // Données
    equipment: data?.data || [],
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
    createEquipment: createMutation.mutateAsync,
    updateEquipment: updateMutation.mutateAsync,
    deleteEquipment: deleteMutation.mutateAsync,
    refreshStatuses: refreshStatusMutation.mutateAsync,
    exportEquipment: exportMutation.mutateAsync, // NOUVELLE ACTION
    refetch,
    
    // États des mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRefreshing: refreshStatusMutation.isPending,
    isExporting: exportMutation.isPending, // NOUVEL ÉTAT
  }
}

// Hook pour récupérer un équipement spécifique
export function useEquipment(id: string) {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['equipment-detail', id],
    queryFn: () => fetchEquipmentById(id),
    enabled: !!user && !loading && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook pour récupérer les pièces jointes d'un équipement
export function useEquipmentAttachments(equipmentId: string) {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['equipment-attachments', equipmentId],
    queryFn: () => fetchEquipmentAttachments(equipmentId),
    enabled: !!user && !loading && !!equipmentId,
    staleTime: 0,
  })
}

// Hook pour les actions sur les équipements (séparé pour une meilleure réutilisabilité)
export function useEquipmentActions(options?: {
  onSuccess?: () => void
  onError?: (error: string) => void
}) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: EquipmentFormData }) => updateEquipment(id, data),
    onSuccess: () => {
      toast.success('Équipement mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment-detail'] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
      options?.onError?.(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      toast.success('Équipement supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
      options?.onError?.(error.message)
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateEquipmentStatus(id, status),
    onSuccess: () => {
      toast.success('Statut mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment-detail'] })
      options?.onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(error.message)
      options?.onError?.(error.message)
    }
  })

  return {
    updateEquipment: updateMutation.mutateAsync,
    deleteEquipment: deleteMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  }
}

// Hook pour la gestion des pièces jointes
export function useAttachmentActions(equipmentId: string) {
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: ({ file, fileType }: { file: File, fileType: string }) => 
      uploadAttachment(equipmentId, file, fileType),
    onSuccess: () => {
      toast.success('Fichier ajouté avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment-attachments', equipmentId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(equipmentId, attachmentId),
    onSuccess: () => {
      toast.success('Fichier supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment-attachments', equipmentId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const downloadMutation = useMutation({
    mutationFn: (attachmentId: string) => downloadAttachment(equipmentId, attachmentId),
    onSuccess: (data) => {
      // Ouvrir le fichier dans un nouvel onglet
      window.open(data.download_url, '_blank')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return {
    uploadAttachment: uploadMutation.mutateAsync,
    deleteAttachment: deleteMutation.mutateAsync,
    downloadAttachment: downloadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDownloading: downloadMutation.isPending,
  }
}

// Types exportés pour l'utilisation dans les composants
export type { EquipmentFormData, EquipmentAttachment, EquipmentParams, EquipmentWithClient }
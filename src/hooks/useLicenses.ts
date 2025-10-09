// hooks/useLicenses.ts
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import type { LicenseWithClientView, LicenseStatus, Client } from '@/types'

// Types spécifiques pour la gestion des licences
interface LicenseFormData {
  name: string
  editor?: string
  version?: string
  licenseKey?: string
  purchaseDate?: string
  expiryDate: string
  cost?: number
  clientId: string
  description?: string
}

interface LicenseAttachment {
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

interface LicensesParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  clientId?: string
  editor?: string
}

interface LicensesResponse {
  data: LicenseWithClientView[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

// Fonction pour récupérer les licences
const fetchLicenses = async (params: LicensesParams): Promise<LicensesResponse> => {
  const url = new URL('/api/licenses', window.location.origin)
  
  if (params.page) url.searchParams.set('page', params.page.toString())
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.search) url.searchParams.set('search', params.search)
  if (params.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params.clientId && params.clientId !== 'all') url.searchParams.set('client_id', params.clientId)
  if (params.editor) url.searchParams.set('editor', params.editor)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des licences')
  }

  return response.json()
}

// Fonction pour récupérer une licence par ID
const fetchLicenseById = async (id: string): Promise<LicenseWithClientView> => {
  const response = await fetch(`/api/licenses/${id}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération de la licence')
  }

  return response.json()
}

// Fonction pour créer une licence
const createLicense = async (licenseData: LicenseFormData): Promise<LicenseWithClientView> => {
  const response = await fetch('/api/licenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(licenseData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la création de la licence')
  }

  return response.json()
}

// Fonction pour mettre à jour une licence
const updateLicense = async (id: string, data: LicenseFormData): Promise<LicenseWithClientView> => {
  const response = await fetch(`/api/licenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la mise à jour de la licence')
  }

  return response.json()
}

// Fonction pour supprimer une licence
const deleteLicense = async (licenseId: string): Promise<void> => {
  const response = await fetch(`/api/licenses/${licenseId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la suppression de la licence')
  }
}
const revealLicenseKey = async (licenseId: string, password: string) => {
  const response = await fetch(`/api/licenses/${licenseId}/reveal-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Échec de la vérification')
  }

  return response.json() as Promise<{ licenseKey: string }>
}

// Fonction pour récupérer les pièces jointes d'une licence
const fetchLicenseAttachments = async (licenseId: string): Promise<LicenseAttachment[]> => {
  const response = await fetch(`/api/licenses/${licenseId}/attachments`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des pièces jointes')
  }

  return response.json()
}

// Fonction pour ajouter une pièce jointe
const uploadAttachment = async (licenseId: string, file: File, fileType: string): Promise<LicenseAttachment> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('file_type', fileType)

  const response = await fetch(`/api/licenses/${licenseId}/attachments`, {
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
const deleteAttachment = async (licenseId: string, attachmentId: string): Promise<void> => {
  const response = await fetch(`/api/licenses/${licenseId}/attachments/${attachmentId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la suppression')
  }
}

// Fonction pour télécharger une pièce jointe
const downloadAttachment = async (licenseId: string, attachmentId: string): Promise<{ download_url: string, file_name: string }> => {
  const response = await fetch(`/api/licenses/${licenseId}/attachments/${attachmentId}/download`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors du téléchargement')
  }

  return response.json()
}
// Fonction pour exporter les licences
const exportLicenses = async (params: LicensesParams, format: 'xlsx' | 'csv' | 'json' = 'xlsx'): Promise<void> => {
  const url = new URL('/api/licenses/export', window.location.origin)
  
  if (params.search) url.searchParams.set('search', params.search)
  if (params.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params.clientId && params.clientId !== 'all') url.searchParams.set('client_id', params.clientId)
  if (params.editor) url.searchParams.set('editor', params.editor)
  url.searchParams.set('format', format)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de l\'exportation')
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  
  const extensions = {
    xlsx: 'xlsx',
    csv: 'csv',
    json: 'json'
  }
  
  const fileName = `licences_${new Date().toISOString().split('T')[0]}.${extensions[format]}`
  link.download = fileName
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}
// Hook principal pour la gestion des licences
export function useLicenses(params: LicensesParams = {}) {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = ['licenses', params.page, params.limit, params.search, params.status, params.clientId, params.editor]

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchLicenses(params),
    enabled: !!user && !loading,
    staleTime: 0,
  })

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, expired: 0, aboutToExpire: 0, cancelled: 0 }
    
    return data.data.reduce((acc, license) => {
      acc.total++
      switch (license.status) {
        case 'active': acc.active++; break
        case 'expired': acc.expired++; break
        case 'about_to_expire': acc.aboutToExpire++; break
        case 'cancelled': acc.cancelled++; break
      }
      return acc
    }, { total: 0, active: 0, expired: 0, aboutToExpire: 0, cancelled: 0 })
  }, [data])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createLicense,
    onSuccess: () => {
      toast.success('Licence créée avec succès')
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: LicenseFormData }) => updateLicense(id, data),
    onSuccess: () => {
      toast.success('Licence mise à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLicense,
    onSuccess: () => {
      toast.success('Licence supprimée avec succès')
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
  const exportMutation = useMutation({
    mutationFn: ({ params, format }: { params: LicensesParams, format: 'xlsx' | 'csv' | 'json' }) => 
      exportLicenses(params, format),
    onSuccess: () => {
      toast.success('Exportation réussie')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return {
    // Données
    licenses: data?.data || [],
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
    createLicense: createMutation.mutateAsync,
    updateLicense: updateMutation.mutateAsync,
    deleteLicense: deleteMutation.mutateAsync,
    exportLicenses: exportMutation.mutateAsync,
    refetch,
    
    // États des mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExporting: exportMutation.isPending,
  }
}

// Hook pour récupérer une licence spécifique
export function useLicense(id: string) {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['license', id],
    queryFn: () => fetchLicenseById(id),
    enabled: !!user && !loading && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook pour récupérer les pièces jointes d'une licence
export function useLicenseAttachments(licenseId: string) {
  const { user, loading } = useAuth()

  return useQuery({
    queryKey: ['license-attachments', licenseId],
    queryFn: () => fetchLicenseAttachments(licenseId),
    enabled: !!user && !loading && !!licenseId,
    staleTime: 0,
  })
}

// Hook pour les actions sur les licences (séparé pour une meilleure réutilisabilité)
export function useLicenseActions() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: LicenseFormData }) => updateLicense(id, data),
    onSuccess: () => {
      toast.success('Licence mise à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLicense,
    onSuccess: () => {
      toast.success('Licence supprimée avec succès')
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'cancel' | 'reactivate' }) => {
      const response = await fetch(`/api/licenses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour du statut')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['license', variables.id] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const revealKeyMutation = useMutation({
    mutationFn: ({ licenseId, password }: { licenseId: string; password: string }) =>
      revealLicenseKey(licenseId, password),
    onError: (error: Error) => toast.error(error.message)
  })
  return {
    updateLicense: updateMutation.mutateAsync,
    deleteLicense: deleteMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    revealLicenseKey: revealKeyMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isRevealing: revealKeyMutation.isPending
  }
}

// Hook pour la gestion des pièces jointes
export function useAttachmentActions(licenseId: string) {
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: ({ file, fileType }: { file: File, fileType: string }) => 
      uploadAttachment(licenseId, file, fileType),
    onSuccess: () => {
      toast.success('Fichier ajouté avec succès')
      queryClient.invalidateQueries({ queryKey: ['license-attachments', licenseId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(licenseId, attachmentId),
    onSuccess: () => {
      toast.success('Fichier supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['license-attachments', licenseId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const downloadMutation = useMutation({
    mutationFn: (attachmentId: string) => downloadAttachment(licenseId, attachmentId),
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
export type { LicenseFormData, LicenseAttachment, LicensesParams }
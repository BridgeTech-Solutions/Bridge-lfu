// hooks/useNotifications.ts - Version corrigée
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface NotificationFilters {
  page: number
  limit: number
  is_read?: boolean
  type?: string
  search?: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'license_expiry' | 'equipment_obsolescence' | 'general' | 'new_unverified_user'
  title: string
  message: string
  related_id?: string
  related_type?: string
  is_read: boolean
  email_sent: boolean
  created_at: string
}

// Interface pour la réponse paginée
export interface NotificationsResponse {
  data: Notification[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

export interface NotificationStats {
  total: number
  unread: number
  read: number
  by_type: {
    license_expiry: number
    equipment_obsolescence: number
    general: number
    new_unverified_user: number
  }
}

export interface NotificationSettings {
  id: string
  user_id: string
  license_alert_days: number[]
  equipment_alert_days: number[]
  email_enabled: boolean
  created_at: string
  updated_at: string
}

// API Functions avec types explicites
const notificationAPI = {
  async getNotifications(filters: NotificationFilters): Promise<NotificationsResponse> {
    const params = new URLSearchParams({
      page: filters.page.toString(),
      limit: filters.limit.toString()
    })
    
    if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString())
    if (filters.type) params.append('type', filters.type)
    if (filters.search) params.append('search', filters.search)

    const response = await fetch(`/api/notifications?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || 'Erreur lors de la récupération des notifications')
    }
    return response.json()
  },

  async getNotificationStats(): Promise<NotificationStats> {
    const response = await fetch('/api/notifications/stats', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || 'Erreur lors de la récupération des statistiques')
    }
    return response.json()
  },

  async markAsRead(id: string, isRead: boolean): Promise<Notification> {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead })
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || 'Erreur lors de la mise à jour de la notification')
    }
    return response.json()
  },

  async deleteNotification(id: string): Promise<void> {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || 'Erreur lors de la suppression de la notification')
    }
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await fetch('/api/notifications/settings')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la récupération des paramètres')
    }
    return response.json()
  },

  async updateNotificationSettings(settings: {
    licenseAlertDays: number[]
    equipmentAlertDays: number[]
    emailEnabled: boolean
  }): Promise<NotificationSettings> {
    const response = await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la mise à jour des paramètres')
    }
    return response.json()
  },

  async markAllAsRead(): Promise<{ message: string; updated_count: number }> {
    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }))
      throw new Error(error.message || 'Erreur lors de la mise à jour des notifications')
    }
    return response.json()
  }
}

// Hook principal pour les notifications - VERSION CORRIGÉE
export function useNotifications(filters: NotificationFilters) {
  const queryClient = useQueryClient()

  const {
    data: notificationsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationAPI.getNotifications(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - augmenté pour éviter les refetch trop fréquents
    refetchInterval: 2 * 60 * 1000, // 2 minutes au lieu de 1 minute
    refetchOnWindowFocus: false, // Ne pas refetch quand on revient sur la fenêtre
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false
      if (error.message.includes('Non authentifié')) return false
      return true
    },
  })
  if (error) {
    console.error('Erreur lors du chargement des notifications:', error);
    toast.error('Erreur lors du chargement des notifications');
  }

  // CORRECTION : Utiliser le type explicite pour les données
  const notificationsResponse = notificationsData as NotificationsResponse | undefined

  const markAsReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => 
      notificationAPI.markAsRead(id, isRead),
    onSuccess: (data, variables) => {
      // Mise à jour optimiste du cache avec typage correct
      queryClient.setQueryData(['notifications', filters], (old: NotificationsResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((notif: Notification) =>
            notif.id === variables.id ? { ...notif, is_read: variables.isRead } : notif
          )
        }
      })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error: Error, variables) => {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Erreur lors de la mise à jour de la notification')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onSuccess: async (_, deletedId) => {
      // Supprimer de TOUS les caches de notifications (peu importe les filtres)
      queryClient.setQueriesData(
        { queryKey: ['notifications'] },
        (old: NotificationsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.filter((notif: Notification) => notif.id !== deletedId),
            count: old.count - 1
          }
        }
      )
      
      // Refetch immédiat des stats pour mettre à jour le badge du header
      await queryClient.refetchQueries({ queryKey: ['notification-stats'] })
      
      toast.success('Notification supprimée')
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression de la notification')
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onSuccess: (data) => {
      queryClient.setQueryData(['notifications', filters], (old: NotificationsResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((notif: Notification) => ({ ...notif, is_read: true }))
        }
      })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
      
      if (data.updated_count > 0) {
        toast.success(data.message)
      } else {
        toast.info('Aucune notification à mettre à jour')
      }
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la mise à jour globale:', error)
      toast.error('Erreur lors de la mise à jour des notifications')
    }
  })

  // RETOUR CORRIGÉ : Utiliser la variable typée
  return {
    notifications: notificationsResponse?.data || [],
    pagination: {
      page: notificationsResponse?.page || 1,
      totalPages: notificationsResponse?.totalPages || 1,
      hasMore: notificationsResponse?.hasMore || false,
      count: notificationsResponse?.count || 0
    },
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending
  }
}

export function useNotificationStats() {
  const { data, isLoading, error, refetch } = useQuery<NotificationStats>({
    queryKey: ['notification-stats'],
    queryFn: notificationAPI.getNotificationStats,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });

  if (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
  }

  // CORRECTION : Ajoutez 'refetch' à l'objet retourné
  return { data, isLoading, error, refetch };
}
export function useNotificationSettings() {
  const queryClient = useQueryClient()

  const {
    data: settings,
    isLoading,
    error
  } = useQuery<NotificationSettings>({
    queryKey: ['notification-settings'],
    queryFn: notificationAPI.getNotificationSettings,
    staleTime: 5 * 60 * 1000
  })

  const updateMutation = useMutation({
    mutationFn: notificationAPI.updateNotificationSettings,
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['notification-settings'], updatedSettings)
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la mise à jour des paramètres:', error)
    }
  })

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error
  }
}

// Hook pour gérer les filtres de notifications avec fonctions optimisées
export function useNotificationFilters() {
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
    is_read: undefined,
    type: '',
    search: ''
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFilter = useCallback((key: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      is_read: undefined,
      type: '',
      search: ''
    })
  }, [])

  const setUnreadOnly = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      is_read: false,
      page: 1
    }))
  }, [])

  const setAllNotifications = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      is_read: undefined,
      page: 1
    }))
  }, [])

  return {
    filters,
    updateFilter,
    resetFilters,
    setUnreadOnly,
    setAllNotifications
  }
}
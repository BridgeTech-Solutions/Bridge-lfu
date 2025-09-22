// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { useState } from 'react'
import { useState, useCallback } from 'react'; // Importer useCallback

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

// API Functions
const notificationAPI = {
  async getNotifications(filters: NotificationFilters) {
    const params = new URLSearchParams({
      page: filters.page.toString(),
      limit: filters.limit.toString()
    })
    
    if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString())
    if (filters.type) params.append('type', filters.type)
    if (filters.search) params.append('search', filters.search)

    const response = await fetch(`/api/notifications?${params}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la récupération des notifications')
    }
    return response.json()
  },

  async getNotificationStats(): Promise<NotificationStats> {
    const response = await fetch('/api/notifications/stats')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la récupération des statistiques')
    }
    return response.json()
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

  async markAsRead(id: string, isRead: boolean): Promise<Notification> {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la mise à jour de la notification')
    }
    return response.json()
  },

  async deleteNotification(id: string): Promise<void> {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la suppression de la notification')
    }
  },

  async markAllAsRead(): Promise<{ message: string; updated_count: number }> {
    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'POST'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erreur lors de la mise à jour des notifications')
    }
    return response.json()
  }
}

// Hook principal pour les notifications
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
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000 // Refetch toutes les minutes
  })

  const markAsReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => 
      notificationAPI.markAsRead(id, isRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: notificationAPI.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error)
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] })
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour globale:', error)
    }
  })

  return {
    notifications: notificationsData?.data || [],
    pagination: {
      page: notificationsData?.page || 1,
      totalPages: notificationsData?.totalPages || 1,
      hasMore: notificationsData?.hasMore || false,
      count: notificationsData?.count || 0
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

// Hook pour les statistiques de notifications
export function useNotificationStats() {
  return useQuery<NotificationStats>({
    queryKey: ['notification-stats'],
    queryFn: notificationAPI.getNotificationStats,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })
}

// Hook pour les paramètres de notifications
export function useNotificationSettings() {
  const queryClient = useQueryClient()

  const {
    data: settings,
    isLoading,
    error
  } = useQuery<NotificationSettings>({
    queryKey: ['notification-settings'],
    queryFn: notificationAPI.getNotificationSettings,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const updateMutation = useMutation({
    mutationFn: notificationAPI.updateNotificationSettings,
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['notification-settings'], updatedSettings)
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
    onError: (error) => {
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


// Hook pour gérer les filtres de notifications
export function useNotificationFilters() {
    const [filters, setFilters] = useState<NotificationFilters>({
      page: 1,
      limit: 20,
      is_read: undefined,
      type: '',
      search: ''
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFilter = useCallback((key: keyof NotificationFilters, value: any) => {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        page: key !== 'page' ? 1 : value
      }));
    }, []); // 👈 Le tableau de dépendances est vide car la fonction ne dépend d'aucune variable du scope.

    const resetFilters = useCallback(() => {
      setFilters({
        page: 1,
        limit: 20,
        is_read: undefined,
        type: '',
        search: ''
      });
    }, []); // 👈 Pas de dépendances

    const setUnreadOnly = useCallback(() => {
      setFilters(prev => ({
        ...prev,
        is_read: false,
        page: 1
      }));
    }, []); // 👈 Pas de dépendances

    const setAllNotifications = useCallback(() => {
      setFilters(prev => ({
        ...prev,
        is_read: undefined,
        page: 1
      }));
    }, []); // 👈 Pas de dépendances

    return {
      filters,
      updateFilter,
      resetFilters,
      setUnreadOnly,
      setAllNotifications
    };
}
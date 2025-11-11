// hooks/useStats.ts
'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'

// Types pour les types de licence
export interface LicenseType {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
}

// Types pour les statistiques d'équipements
export interface EquipmentStats {
  total: number
  total_value: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  chart_data: {
    types: Array<{
      name: string
      value: number
      percentage: number
    }>
    statuses: Array<{
      name: string
      value: number
      percentage: number
    }>
  }
}

// Types pour les statistiques de licences
export interface LicenseStats {
  total: number
  by_status: Record<string, number>
  total_value: number
  monthly_expiry: Array<{
    month: string
    count: number
  }>
  chart_data: {
    statuses: Array<{
      name: string
      value: number
      percentage: number
    }>
    expiry: Array<{
      month: string
      count: number
    }>
  }
}
// Hook pour les tendances d'obsolescence équipements (12 mois)
export function useEquipmentTrends(clientId?: string) {
  const { user, loading: authLoading } = useAuth()

  const fetchTrends = async (): Promise<Array<{ month: string; count: number }>> => {
    const url = new URL('/api/stats/equipment/trends', window.location.origin)
    if (clientId) url.searchParams.set('client_id', clientId)
    const res = await fetch(url.toString(), { credentials: 'include' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Erreur ${res.status}`)
    }
    const data = await res.json()
    return (data.months || []) as Array<{ month: string; count: number }>
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['equipmentTrends', user?.id, clientId],
    queryFn: fetchTrends,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    months: data || [],
    loading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    refetch,
  }
}

// Hook pour les tendances d'expiration licences (12 mois)
export function useLicenseTrends(clientId?: string, typeId?: string) {
  const { user, loading: authLoading } = useAuth()

  const fetchTrends = async (): Promise<Array<{ month: string; count: number }>> => {
    const url = new URL('/api/stats/licenses/trends', window.location.origin)
    if (clientId) url.searchParams.set('client_id', clientId)
    if (typeId) url.searchParams.set('type_id', typeId)
    const res = await fetch(url.toString(), { credentials: 'include' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Erreur ${res.status}`)
    }
    const data = await res.json()
    return (data.months || []) as Array<{ month: string; count: number }>
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['licenseTrends', user?.id, clientId, typeId],
    queryFn: fetchTrends,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    months: data || [],
    loading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    refetch,
  }
}

// Hook coûts par éditeur (période mobile, défaut 30j)
export function useCosts(params?: { clientId?: string; period?: number; groupBy?: 'editor' }) {
  const { user, loading: authLoading } = useAuth()
  const { clientId, period = 30, groupBy = 'editor' } = params || {}

  const fetchCosts = async (): Promise<Array<{ name: string; value: number }>> => {
    const url = new URL('/api/stats/costs', window.location.origin)
    if (clientId) url.searchParams.set('client_id', clientId)
    url.searchParams.set('period', String(period))
    url.searchParams.set('groupBy', groupBy)
    const res = await fetch(url.toString(), { credentials: 'include' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Erreur ${res.status}`)
    }
    const data = await res.json()
    return (data.data || []) as Array<{ name: string; value: number }>
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['costs', user?.id, clientId, period, groupBy],
    queryFn: fetchCosts,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    items: data || [],
    loading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    refetch,
  }
}


// Hook pour les statistiques d'équipements
export function useEquipmentStats(clientId?: string) {
  const { user, loading: authLoading } = useAuth()

  const fetchEquipmentStats = async (): Promise<EquipmentStats> => {
    const url = new URL('/api/stats/equipment', window.location.origin)
    if (clientId) url.searchParams.set('client_id', clientId)

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['equipmentStats', user?.id, clientId],
    queryFn: fetchEquipmentStats,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message.includes('401')) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  return {
    stats: stats || null,
    loading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    refetch,
    isRefetching
  }
}

// Hook pour les statistiques de licences
export function useLicenseStats(clientId?: string, typeId?: string) {
  const { user, loading: authLoading } = useAuth()

  const fetchLicenseStats = async (): Promise<LicenseStats> => {
    const url = new URL('/api/stats/licenses', window.location.origin)
    if (clientId) url.searchParams.set('client_id', clientId)
    if (typeId) url.searchParams.set('type_id', typeId)

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['licenseStats', user?.id, clientId, typeId],
    queryFn: fetchLicenseStats,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message.includes('401')) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })

  return {
    stats: stats || null,
    loading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    refetch,
    isRefetching
  }
}

// Hook combiné pour les statistiques générales
export function useCombinedStats() {
  const equipmentStats = useEquipmentStats()
  const licenseStats = useLicenseStats()

  const loading = equipmentStats.loading || licenseStats.loading
  const error = equipmentStats.error || licenseStats.error

  const combinedData = useMemo(() => {
    if (!equipmentStats.stats || !licenseStats.stats) return null

    return {
      equipment: equipmentStats.stats,
      licenses: licenseStats.stats,
      totals: {
        total_equipment: equipmentStats.stats.total,
        total_licenses: licenseStats.stats.total,
        total_value: (licenseStats.stats.total_value || 0) + (equipmentStats.stats.total_value || 0)
      }
    }
  }, [equipmentStats.stats, licenseStats.stats])

  const refetchAll = useCallback(() => {
    equipmentStats.refetch()
    licenseStats.refetch()
  }, [equipmentStats, licenseStats])

  return {
    data: combinedData,
    loading,
    error,
    refetch: refetchAll,
    isRefetching: equipmentStats.isRefetching || licenseStats.isRefetching,
    equipment: equipmentStats,
    licenses: licenseStats
  }
}

// Hook pour les métriques en temps réel (avec polling optionnel)
export function useRealtimeStats(options?: {
  enablePolling?: boolean
  pollingInterval?: number
}) {
  const { enablePolling = false, pollingInterval = 30000 } = options || {}
  const queryClient = useQueryClient()

  const equipmentStats = useEquipmentStats()
  const licenseStats = useLicenseStats()

  useEffect(() => {
    if (!enablePolling) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
      queryClient.invalidateQueries({ queryKey: ['licenseStats'] })
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [enablePolling, pollingInterval, queryClient])

  const forceRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
    queryClient.invalidateQueries({ queryKey: ['licenseStats'] })
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
  }, [queryClient])

  return {
    equipment: equipmentStats,
    licenses: licenseStats,
    forceRefresh,
    isPolling: enablePolling
  }
}

// Hook pour les alertes basées sur les statistiques
export function useStatsAlerts(clientId?: string) {
  const { stats: equipmentStats } = useEquipmentStats(clientId)
  const { stats: licenseStats } = useLicenseStats(clientId)

  const alerts = useMemo(() => {
    const alertsList = []

    if (equipmentStats) {
      const obsoleteCount = equipmentStats.by_status.obsolete || 0
      const soonObsoleteCount = equipmentStats.by_status.bientot_obsolete || 0

      if (obsoleteCount > 0) {
        alertsList.push({
          type: 'equipment',
          level: 'danger',
          message: `${obsoleteCount} équipement${obsoleteCount > 1 ? 's' : ''} obsolète${obsoleteCount > 1 ? 's' : ''}`,
          count: obsoleteCount
        })
      }

      if (soonObsoleteCount > 0) {
        alertsList.push({
          type: 'equipment',
          level: 'warning',
          message: `${soonObsoleteCount} équipement${soonObsoleteCount > 1 ? 's' : ''} bientôt obsolète${soonObsoleteCount > 1 ? 's' : ''}`,
          count: soonObsoleteCount
        })
      }
    }

    if (licenseStats) {
      const expiredCount = licenseStats.by_status.expired || 0
      const aboutToExpireCount = licenseStats.by_status.about_to_expire || 0

      if (expiredCount > 0) {
        alertsList.push({
          type: 'license',
          level: 'danger',
          message: `${expiredCount} licence${expiredCount > 1 ? 's' : ''} expirée${expiredCount > 1 ? 's' : ''}`,
          count: expiredCount
        })
      }

      if (aboutToExpireCount > 0) {
        alertsList.push({
          type: 'license',
          level: 'warning',
          message: `${aboutToExpireCount} licence${aboutToExpireCount > 1 ? 's' : ''} bientôt expirée${aboutToExpireCount > 1 ? 's' : ''}`,
          count: aboutToExpireCount
        })
      }
    }

    return alertsList
  }, [equipmentStats, licenseStats])

  const criticalAlertsCount = alerts.filter(alert => alert.level === 'danger').length
  const warningAlertsCount = alerts.filter(alert => alert.level === 'warning').length

  return {
    alerts,
    criticalCount: criticalAlertsCount,
    warningCount: warningAlertsCount,
    totalCount: alerts.length,
    hasCritical: criticalAlertsCount > 0,
    hasWarnings: warningAlertsCount > 0
  }
}

// Hook utilitaire pour les couleurs des graphiques
export function useChartColors() {
  return {
    equipment: {
      types: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'],
      statuses: {
        actif: '#10B981',
        en_maintenance: '#F59E0B',
        obsolete: '#EF4444',
        bientot_obsolete: '#F97316',
        retire: '#6B7280'
      }
    },
    licenses: {
      statuses: {
        active: '#10B981',
        expired: '#EF4444',
        about_to_expire: '#F59E0B',
        cancelled: '#6B7280'
      }
    },
    default: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
  }
}

// Export du hook principal pour la compatibilité avec le code existant
export { useEquipmentStats as useEquipmentStatsAPI, useLicenseStats as useLicenseStatsAPI }
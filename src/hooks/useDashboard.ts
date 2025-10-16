// hooks/useDashboard.ts
'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useStablePermissions } from './index'
import { useMemo } from 'react'

// Types pour le dashboard
export interface DashboardStats {
  total_clients: number
  total_licenses: number
  total_equipment: number
  expired_licenses: number
  about_to_expire_licenses: number
  obsolete_equipment: number
  soon_obsolete_equipment: number
}

export interface DashboardAlert {
  id: string
  item_name: string
  client_name?: string
  type: string
  alert_type: string
  alert_level: string
  alert_date: string
  status: string
  client_id?: string
}

export interface DashboardData {
  stats: DashboardStats
  alerts: DashboardAlert[]
}

// Hook principal pour le dashboard
export function useDashboard() {
  const { user, loading: authLoading } = useAuth()
  const permissions = useStablePermissions()
  const queryClient = useQueryClient()

  // Fonction de fetch optimisée
  const fetchDashboardData = async (): Promise<DashboardData> => {
    const response = await fetch('/api/dashboard', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.')
      }
      if (response.status === 403) {
        throw new Error('Accès non autorisé')
      }
      
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.stats) {
      throw new Error('Données de statistiques manquantes')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validAlerts = (data.alerts || []).filter((alert: any) => 
      alert && 
      alert.id && 
      alert.item_name && 
      alert.alert_type && 
      alert.alert_level && 
      alert.status
    )

    return {
      stats: {
        total_clients: data.stats.total_clients || 0,
        total_licenses: data.stats.total_licenses || 0,
        total_equipment: data.stats.total_equipment || 0,
        expired_licenses: data.stats.expired_licenses || 0,
        about_to_expire_licenses: data.stats.about_to_expire_licenses || 0,
        obsolete_equipment: data.stats.obsolete_equipment || 0,
        soon_obsolete_equipment: data.stats.soon_obsolete_equipment || 0
      },
      alerts: validAlerts
    }
  }

  const stableQueryKey = useMemo(() => [
    'dashboardData',
    user?.id,
    user?.role, // Plus stable que les permissions calculées
    user?.client_id
  ], [user?.id, user?.role, user?.client_id])

  // Configuration de la query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt
  } = useQuery({
    queryKey: stableQueryKey ,
    queryFn: fetchDashboardData,
    enabled: !!user && !authLoading,
    // staleTime: 2 * 60 * 1000, // 2 minutes - données du dashboard peuvent être un peu anciennes
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      // Ne pas retry sur les erreurs d'autorisation
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          return false
        }
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Mémorisation des statistiques dérivées
  const derivedStats = useMemo(() => {
    if (!data?.stats) return null

    const stats = data.stats
    return {
      ...stats,
      // Calculs dérivés
      active_licenses: stats.total_licenses - stats.expired_licenses,
      active_equipment: stats.total_equipment - stats.obsolete_equipment,
      critical_alerts_count: stats.expired_licenses + stats.obsolete_equipment,
      warning_alerts_count: stats.about_to_expire_licenses + stats.soon_obsolete_equipment,
      
      // Pourcentages
      license_health_percentage: stats.total_licenses > 0 
        ? Math.round(((stats.total_licenses - stats.expired_licenses) / stats.total_licenses) * 100)
        : 100,
      equipment_health_percentage: stats.total_equipment > 0
        ? Math.round(((stats.total_equipment - stats.obsolete_equipment) / stats.total_equipment) * 100)
        : 100
    }
  }, [data?.stats])

  // Mémorisation des alertes par niveau
  const alertsByLevel = useMemo(() => {
    if (!data?.alerts) return { critical: [], urgent: [], warning: [], normal: [] }

    return data.alerts.reduce((acc, alert) => {
      const level = alert.alert_level
      if (!acc[level]) acc[level] = []
      acc[level].push(alert)
      return acc
    }, { critical: [], urgent: [], warning: [], normal: [] } as Record<string, DashboardAlert[]>)
  }, [data?.alerts])

  // Fonction de rafraîchissement intelligent
  const smartRefetch = async () => {
    // Ne rafraîchir que si les données sont vraiment anciennes
    const now = Date.now()
    const dataAge = now - (dataUpdatedAt || 0)
    const fiveMinutes = 5 * 60 * 1000

    if (dataAge < fiveMinutes) {
      // console.log('Données encore fraîches, pas de rechargement nécessaire')
      return { data }
    }

    // Invalider les caches liés seulement si nécessaire
    queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
    queryClient.invalidateQueries({ queryKey: ['licenseStats'] })
    queryClient.invalidateQueries({ queryKey: ['systemMetrics'] })
    
    return refetch()
  }


  return {
    // Données principales
    stats: derivedStats,
    alerts: data?.alerts || [],
    
    // États
    loading: isLoading || authLoading,
    error: isError ? (error as Error).message : null,
    isRefetching,
    
    // Métadonnées
    lastUpdated: dataUpdatedAt,
    isEmpty: !data?.stats || (data.stats.total_licenses === 0 && data.stats.total_equipment === 0),
    
    // Alertes organisées
    alertsByLevel,
    criticalAlerts: alertsByLevel.critical || [],
    urgentAlerts: alertsByLevel.urgent || [],
    warningAlerts: alertsByLevel.warning || [],
    
    // Compteurs d'alertes
    alertCounts: {
      total: data?.alerts?.length || 0,
      critical: alertsByLevel.critical?.length || 0,
      urgent: alertsByLevel.urgent?.length || 0,
      warning: alertsByLevel.warning?.length || 0,
      normal: alertsByLevel.normal?.length || 0
    },
    
    // Actions
    refetch: smartRefetch,
    
    // Helpers
    hasData: !!data?.stats,
    hasCriticalAlerts: (alertsByLevel.critical?.length || 0) > 0,
    hasAlerts: (data?.alerts?.length || 0) > 0,
    healthScore: derivedStats ? Math.round(
      (derivedStats.license_health_percentage + derivedStats.equipment_health_percentage) / 2
    ) : 0
  }
}

// Hook pour surveiller les changements critiques
export function useDashboardRealtime() {
  const dashboard = useDashboard()
  const queryClient = useQueryClient()

  // Auto-refresh pour les alertes critiques
  const hasNewCriticalAlerts = dashboard.criticalAlerts.length > 0

  // Fonction pour forcer une mise à jour complète
  const forceFullRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
    queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
    queryClient.invalidateQueries({ queryKey: ['licenseStats'] })
    queryClient.invalidateQueries({ queryKey: ['systemMetrics'] })
    queryClient.refetchQueries({ queryKey: ['dashboardData'] })
  }

  return {
    ...dashboard,
    hasNewCriticalAlerts,
    forceFullRefresh
  }
}

// Hook utilitaire pour les statistiques rapides
export function useDashboardSummary() {
  const { stats, loading, error } = useDashboard()

  const summary = useMemo(() => {
    if (!stats) return null

    return {
      totalAssets: stats.total_licenses + stats.total_equipment,
      healthyAssets: stats.active_licenses + stats.active_equipment,
      criticalIssues: stats.expired_licenses + stats.obsolete_equipment,
      warnings: stats.about_to_expire_licenses + stats.soon_obsolete_equipment,
      overallHealth: stats.license_health_percentage && stats.equipment_health_percentage
        ? Math.round((stats.license_health_percentage + stats.equipment_health_percentage) / 2)
        : 0
    }
  }, [stats])

  return {
    summary,
    loading,
    error,
    isHealthy: summary ? summary.overallHealth > 80 : false,
    needsAttention: summary ? summary.criticalIssues > 0 || summary.warnings > 5 : false
  }
}

export default useDashboard
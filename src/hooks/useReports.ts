// hooks/useReports.ts - Mise à jour pour supporter Excel
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useStablePermissions } from './index'

// Types pour les rapports
export interface ReportConfig {
  type: 'licenses' | 'equipment'
  clientId: string
  status: string
  format: 'json' | 'csv' | 'pdf' | 'excel'  // Ajout de 'excel'
  dateFrom: string
  dateTo: string
}

export interface ReportData {
  title: string
  generated_at: string
  total_count: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  metadata?: {
    total_licenses?: number
    total_cost?: number
    expired_count?: number
    expiring_soon_count?: number
    active_count?: number
  }
}

export interface StatsData {
  total: number
  by_type?: Record<string, number>
  by_status: Record<string, number>
  total_value?: number
  monthly_expiry?: Array<{ month: string; count: number }>
  chart_data: {
    types?: Array<{ name: string; value: number; percentage: number }>
    statuses: Array<{ name: string; value: number; percentage: number }>
    expiry?: Array<{ month: string; count: number }>
  }
}

// Hook principal pour les rapports
export function useReports() {
  const { user, loading: userLoading } = useAuth()
  const permissions = useStablePermissions()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [lastGeneratedConfig, setLastGeneratedConfig] = useState<ReportConfig | null>(null)

  // Fonction pour générer un rapport
  const generateReport = useCallback(async (
    config: ReportConfig,
    configOverride?: Partial<ReportConfig>
  ) => {
    const finalConfig = { ...config, ...configOverride }
    
    // Vérification des permissions
    const canGenerate = permissions.can('read', 'reports', { 
      client_id: finalConfig.clientId || user?.client_id 
    })
    
    if (!canGenerate) {
      throw new Error('Permissions insuffisantes pour générer des rapports')
    }

    setIsGenerating(true)
    
    try {
      const params = new URLSearchParams()
      
      if (finalConfig.clientId) params.append('client_id', finalConfig.clientId)
      if (finalConfig.status) params.append('status', finalConfig.status)
      if (finalConfig.dateFrom) params.append('date_from', finalConfig.dateFrom)
      if (finalConfig.dateTo) params.append('date_to', finalConfig.dateTo)
      params.append('format', finalConfig.format)

      const endpoint = finalConfig.type === 'licenses' 
        ? `/api/reports/licenses?${params}`
        : `/api/reports/equipment?${params}`

      const response = await fetch(endpoint)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
        throw new Error(errorData.message || 'Erreur lors de la génération du rapport')
      }

      // Téléchargement direct pour CSV, PDF et Excel
      if (finalConfig.format === 'csv' || finalConfig.format === 'pdf' || finalConfig.format === 'excel') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        
        const extension = finalConfig.format === 'excel' ? 'xlsx' : finalConfig.format
        const filename = `rapport_${finalConfig.type}_${new Date().toISOString().split('T')[0]}.${extension}`
        a.download = filename
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        const formatLabel = finalConfig.format === 'excel' ? 'XLSX' : finalConfig.format.toUpperCase()
        return { success: true, message: `Rapport ${formatLabel} téléchargé avec succès` }
      } else {
        // Affichage JSON
        const data = await response.json()
        setReportData(data)
        setLastGeneratedConfig(finalConfig)
        return { success: true, data, message: 'Rapport généré avec succès' }
      }
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [permissions, user?.client_id])

  // Fonction pour télécharger le rapport JSON courant dans d'autres formats
  const downloadCurrentReport = useCallback(async (format: 'csv' | 'pdf' | 'excel' | 'json') => {
    if (!reportData || !lastGeneratedConfig) {
      throw new Error('Aucun rapport à télécharger')
    }

    if (format === 'json') {
      const dataStr = JSON.stringify(reportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportData.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      return
    }

    return generateReport(lastGeneratedConfig, { format })
  }, [reportData, lastGeneratedConfig, generateReport])

  // Fonction pour réinitialiser les données de rapport
  const resetReport = useCallback(() => {
    setReportData(null)
    setLastGeneratedConfig(null)
  }, [])

  return {
    isGenerating,
    reportData,
    lastGeneratedConfig,
    generateReport,
    downloadCurrentReport,
    resetReport
  }
}

// Hook pour les statistiques de licences
export function useReportsLicenseStats() {
  const { user, loading } = useAuth()
  const permissions = useStablePermissions()

  const { data, isLoading, error, refetch } = useQuery<StatsData>({
    queryKey: ['reports', 'stats', 'licenses', permissions.clientAccess, user?.id],
    queryFn: async () => {
      const response = await fetch('/api/stats/licenses')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques licences')
      }
      return response.json()
    },
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    stats: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch
  }
}

// Hook pour les statistiques d'équipements
export function useReportsEquipmentStats() {
  const { user, loading } = useAuth()
  const permissions = useStablePermissions()

  const { data, isLoading, error, refetch } = useQuery<StatsData>({
    queryKey: ['reports', 'stats', 'equipment', permissions.clientAccess, user?.id],
    queryFn: async () => {
      const response = await fetch('/api/stats/equipment')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques équipements')
      }
      return response.json()
    },
    enabled: !!user && !loading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    stats: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch
  }
}

// Hook pour les rapports rapides prédéfinis
export function useQuickReports() {
  const { generateReport } = useReports()

  const generateQuickReport = useCallback(async (
    type: 'expired-licenses' | 'obsolete-equipment' | 'expiring-soon',
    format: 'csv' | 'pdf' | 'excel' = 'csv'
  ) => {
    const configs: Record<string, Partial<ReportConfig>> = {
      'expired-licenses': {
        type: 'licenses',
        status: 'expired',
        format,
        clientId: '',
        dateFrom: '',
        dateTo: ''
      },
      'obsolete-equipment': {
        type: 'equipment',
        status: 'obsolete',
        format,
        clientId: '',
        dateFrom: '',
        dateTo: ''
      },
      'expiring-soon': {
        type: 'licenses',
        status: 'about_to_expire',
        format,
        clientId: '',
        dateFrom: '',
        dateTo: ''
      }
    }

    const config = configs[type]
    if (!config) {
      throw new Error('Type de rapport rapide non reconnu')
    }

    return generateReport(config as ReportConfig)
  }, [generateReport])

  return {
    generateQuickReport
  }
}

// Hook pour la gestion des notifications de rapport
export function useReportNotifications() {
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
      type === 'success' 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 5000)
  }, [])

  return {
    showNotification
  }
}
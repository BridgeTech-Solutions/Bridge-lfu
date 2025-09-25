'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/lib/auth/permissions'
import { Download, FileText, Calendar, Filter, RefreshCw, BarChart3, Users, HardDrive, Key, FileSpreadsheet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { FaRegFilePdf } from "react-icons/fa";
 import { useSession } from '@/app/context/auth' 
 
interface ReportData {
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

interface StatsData {
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

interface Client {
  id: string
  name: string
}

interface ReportConfig {
  type: 'licenses' | 'equipment'
  clientId: string
  status: string
  format: 'json' | 'csv' | 'pdf'
  dateFrom: string
  dateTo: string
}

export default function ReportsPage() {
  const { user, loading: userLoading } = useAuth(); // Utilisez le hook de session
  const permissions = usePermissions(user)
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'licenses',
    clientId: '',
    status: '',
    format: 'json',
    dateFrom: '',
    dateTo: ''
  })
    // Auto-remplir le client_id pour les clients
    useEffect(() => {
      if (user && !permissions.canViewAllData() && user.client_id) {
        setReportConfig(prev => ({
          ...prev,
          clientId: user.client_id ?? ''
        }));
      }
    }, [user, permissions]);

  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [lastGeneratedConfig, setLastGeneratedConfig] = useState<ReportConfig | null>(null)

  // Récupération des clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Erreur lors du chargement des clients')
      const data = await response.json()
      return data.clients || []
    },
    enabled: permissions.canViewAllData()
  })

  // Récupération des statistiques
  const { data: licenseStats } = useQuery<StatsData>({
    queryKey: ['stats', 'licenses'],
    queryFn: async () => {
      const response = await fetch('/api/stats/licenses')
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques licences')
      return response.json()
    }
  })

  const { data: equipmentStats } = useQuery<StatsData>({
    queryKey: ['stats', 'equipment'],
    queryFn: async () => {
      const response = await fetch('/api/stats/equipment')
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques équipements')
      return response.json()
    }
  })

  const updateConfig = (key: keyof ReportConfig, value: string) => {
    setReportConfig(prev => ({ ...prev, [key]: value }))
  }

  const generateReport = async (configOverride?: Partial<ReportConfig>) => {
    const canGenerate = permissions.can('read', 'reports', { 
        client_id: reportConfig.clientId || user?.client_id 
    });
    
    if (!canGenerate) {
        alert('Permissions insuffisantes pour générer des rapports');
        return;
    }



    const config = { ...reportConfig, ...configOverride }
    setIsGenerating(true)
    
    try {
      const params = new URLSearchParams()
      
      if (config.clientId) params.append('client_id', config.clientId)
      if (config.status) params.append('status', config.status)
      if (config.dateFrom) params.append('date_from', config.dateFrom)
      if (config.dateTo) params.append('date_to', config.dateTo)
      params.append('format', config.format)

      const endpoint = config.type === 'licenses' 
        ? `/api/reports/licenses?${params}`
        : `/api/reports/equipment?${params}`

      const response = await fetch(endpoint)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
        throw new Error(errorData.message || 'Erreur lors de la génération du rapport')
      }

      if (config.format === 'csv' || config.format === 'pdf') {
        // Téléchargement direct pour CSV et PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        
        const extension = config.format
        const filename = `rapport_${config.type}_${new Date().toISOString().split('T')[0]}.${extension}`
        a.download = filename
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Notification de succès
        showNotification(`Rapport ${extension.toUpperCase()} téléchargé avec succès`, 'success')
      } else {
        // Affichage JSON
        const data = await response.json()
        setReportData(data)
        setLastGeneratedConfig(config)
        showNotification('Rapport généré avec succès', 'success')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification(error instanceof Error ? error.message : 'Erreur lors de la génération du rapport', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - vous pouvez remplacer par votre système de notification
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
      type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 5000)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'actif': 'bg-green-100 text-green-800',
      'active': 'bg-green-100 text-green-800',
      'expiré': 'bg-red-100 text-red-800',
      'expired': 'bg-red-100 text-red-800',
      'about_to_expire': 'bg-orange-100 text-orange-800',
      'bientot_obsolete': 'bg-orange-100 text-orange-800',
      'obsolete': 'bg-red-100 text-red-800',
      'en_maintenance': 'bg-blue-100 text-blue-800',
      'retire': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const resetFilters = () => {
    setReportConfig({
      type: 'licenses',
      clientId: '',
      status: '',
      format: 'json',
      dateFrom: '',
      dateTo: ''
    })
    setReportData(null)
    setLastGeneratedConfig(null)
  }

  return (
    <div className="space-y-8 p-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Rapports et Statistiques</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Générez et visualisez des rapports détaillés sur vos licences et équipements au format JSON, CSV ou PDF.
        </p>
      </div>

      {/* Statistiques en un coup d'œil */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Key className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Licences</dt>
                  <dd className="text-lg font-medium text-gray-900">{licenseStats?.total || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HardDrive className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Équipements</dt>
                  <dd className="text-lg font-medium text-gray-900">{equipmentStats?.total || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Valeur Totale</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {licenseStats?.total_value ? formatCurrency(licenseStats.total_value) : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Clients</dt>
                  <dd className="text-lg font-medium text-gray-900">{clients.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques des statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques des licences */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statuts des Licences</h3>
          <div className="space-y-3">
            {licenseStats?.chart_data?.statuses?.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.name)}`}>
                  {item.name}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques des équipements */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statuts des Équipements</h3>
          <div className="space-y-3">
            {equipmentStats?.chart_data?.statuses?.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.name)}`}>
                  {item.name}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expirations mensuelles */}
      {licenseStats?.monthly_expiry && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expirations de Licences par Mois</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {licenseStats.monthly_expiry.map((item) => (
              <div key={item.month} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                <div className="text-sm text-gray-600">{item.month}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Générateur de rapports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Générateur de Rapports</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configurez et générez des rapports personnalisés au format JSON, CSV ou PDF
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Configuration du rapport */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de rapport
              </label>
              <select
                value={reportConfig.type}
                onChange={(e) => updateConfig('type', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="licenses">Licences</option>
                <option value="equipment">Équipements</option>
              </select>
            </div>

            {permissions.canViewAllData() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  value={reportConfig.clientId}
                  onChange={(e) => updateConfig('clientId', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Tous les clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={reportConfig.status}
                onChange={(e) => updateConfig('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                {reportConfig.type === 'licenses' ? (
                  <>
                    <option value="active">Actif</option>
                    <option value="expired">Expiré</option>
                    <option value="about_to_expire">Bientôt expiré</option>
                  </>
                ) : (
                  <>
                    <option value="active">Actif</option>
                    <option value="obsolete">Obsolète</option>
                    <option value="bientot_obsolete">Bientôt obsolète</option>
                    <option value="en_maintenance">En maintenance</option>
                    <option value="retire">Retiré</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select
                value={reportConfig.format}
                onChange={(e) => updateConfig('format', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="json">Aperçu (JSON)</option>
                <option value="csv">Téléchargement CSV</option>
                <option value="pdf">Téléchargement PDF</option>
              </select>
            </div>

            {/* Filtres de dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={reportConfig.dateFrom}
                onChange={(e) => updateConfig('dateFrom', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={reportConfig.dateTo}
                onChange={(e) => updateConfig('dateTo', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser
            </button>

            <div className="flex space-x-3">
              {reportConfig.format !== 'json' && (
                <div className="flex items-center space-x-2">
                  {reportConfig.format === 'csv' && <FileSpreadsheet className="w-4 h-4 text-green-600" />}
                  {reportConfig.format === 'pdf' && <FaRegFilePdf />}
                  <span className="text-sm text-gray-600">
                    Le fichier sera téléchargé automatiquement
                  </span>
                </div>
              )}
              
              <button
                onClick={() => generateReport()}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <>
                    {reportConfig.format === 'json' && <BarChart3 className="w-4 h-4 mr-2" />}
                    {reportConfig.format === 'csv' && <FileSpreadsheet className="w-4 h-4 mr-2" />}
                    {reportConfig.format === 'pdf' && <FaRegFilePdf />}
                  </>
                )}
                {isGenerating ? 'Génération...' : `Générer ${reportConfig.format.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage du rapport généré (JSON uniquement) */}
      {reportData && reportConfig.format === 'json' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{reportData.title}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Généré le {formatDate(reportData.generated_at)} • {reportData.total_count} éléments
              </p>
              {lastGeneratedConfig && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {lastGeneratedConfig.clientId && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      Client: {clients.find(c => c.id === lastGeneratedConfig.clientId)?.name || lastGeneratedConfig.clientId}
                    </span>
                  )}
                  {lastGeneratedConfig.status && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      Statut: {lastGeneratedConfig.status}
                    </span>
                  )}
                  {lastGeneratedConfig.dateFrom && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                      Du: {formatDate(lastGeneratedConfig.dateFrom)}
                    </span>
                  )}
                  {lastGeneratedConfig.dateTo && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                      Au: {formatDate(lastGeneratedConfig.dateTo)}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => generateReport({ format: 'pdf' })}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaRegFilePdf />
                PDF
              </button>
              
              <button
                onClick={() => generateReport({ format: 'csv' })}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                CSV
              </button>
              
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(reportData, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = `${reportData.title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
                  link.click()
                  URL.revokeObjectURL(url)
                }}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </button>
            </div>
          </div>

          {/* Métadonnées du rapport */}
          {reportData.metadata && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">{reportData.metadata.total_licenses || reportData.total_count}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                {reportData.metadata.total_cost !== undefined && (
                  <div>
                    <div className="text-lg font-semibold text-green-600">{formatCurrency(reportData.metadata.total_cost)}</div>
                    <div className="text-xs text-gray-500">Coût total</div>
                  </div>
                )}
                {reportData.metadata.expired_count !== undefined && (
                  <div>
                    <div className="text-lg font-semibold text-red-600">{reportData.metadata.expired_count}</div>
                    <div className="text-xs text-gray-500">Expirées</div>
                  </div>
                )}
                {reportData.metadata.expiring_soon_count !== undefined && (
                  <div>
                    <div className="text-lg font-semibold text-orange-600">{reportData.metadata.expiring_soon_count}</div>
                    <div className="text-xs text-gray-500">Expirent bientôt</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {reportConfig.type === 'licenses' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Éditeur</th>
                      {permissions.canViewAllData() && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coût</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jours restants</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque</th>
                      {permissions.canViewAllData() && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obsolescence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jours restants</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.data.slice(0, 50).map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {reportConfig.type === 'licenses' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.license_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.editor || 'N/A'}
                        </td>
                        {permissions.canViewAllData() && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.client_name || 'N/A'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.expiry_date ? formatDate(item.expiry_date) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.cost ? formatCurrency(item.cost) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={item.days_until_expiry < 0 ? 'text-red-600 font-medium' : item.days_until_expiry <= 30 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                            {item.days_until_expiry !== null ? `${item.days_until_expiry} jours` : 'N/A'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.equipment_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.brand || 'N/A'}
                        </td>
                        {permissions.canViewAllData() && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.client_name || 'N/A'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.obsolescence_date ? formatDate(item.obsolescence_date) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={item.days_until_obsolescence < 0 ? 'text-red-600 font-medium' : item.days_until_obsolescence <= 30 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                            {item.days_until_obsolescence !== null ? `${item.days_until_obsolescence} jours` : 'N/A'}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.data.length > 50 && (
            <div className="px-6 py-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Affichage des 50 premiers résultats sur {reportData.total_count} total. 
                Téléchargez le rapport CSV ou PDF pour voir tous les résultats.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rapports rapides */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Rapports Rapides</h3>
          <p className="mt-1 text-sm text-gray-500">
            Téléchargez des rapports prédéfinis au format de votre choix
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Licences expirées */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 mr-2 text-red-500" />
                <h4 className="font-medium text-gray-900">Licences expirées</h4>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => generateReport({ 
                    type: 'licenses', 
                    status: 'expired', 
                    format: 'csv',
                    clientId: '',
                    dateFrom: '',
                    dateTo: ''
                  })}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => generateReport({ 
                    type: 'licenses', 
                    status: 'expired', 
                    format: 'pdf',
                    clientId: '',
                    dateFrom: '',
                    dateTo: ''
                  })}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaRegFilePdf />

                  PDF
                </button>
              </div>
            </div>

            {/* Équipements obsolètes */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <HardDrive className="w-5 h-5 mr-2 text-red-500" />
                <h4 className="font-medium text-gray-900">Équipements obsolètes</h4>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => generateReport({ 
                    type: 'equipment', 
                    status: 'obsolete', 
                    format: 'csv',
                    clientId: '',
                    dateFrom: '',
                    dateTo: ''
                  })}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => generateReport({ 
                    type: 'equipment', 
                    status: 'obsolete', 
                    format: 'pdf',
                    clientId: '',
                    dateFrom: '',
                    dateTo: ''
                  })}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaRegFilePdf />

                  PDF
                </button>
              </div>
            </div>

            {/* Expirations prochaines */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                <h4 className="font-medium text-gray-900">Expirations prochaines</h4>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => generateReport({ 
                    type: 'licenses', 
                    status: 'about_to_expire', 
                    format: 'csv',
                    clientId: '',
                    dateFrom: '',
                    dateTo: ''
                  })}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => generateReport({ 
                    type: 'licenses', 
                    status: 'about_to_expire', 
                    format: 'pdf',
                    clientId: '',
                    dateFrom: '',
                    dateTo: ''
                  })}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaRegFilePdf />

                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
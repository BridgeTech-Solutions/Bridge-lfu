'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/lib/auth/permissions'
import { Download, FileText, Calendar, Filter, RefreshCw, BarChart3, Users, HardDrive, Key } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface ReportData {
  title: string
  generated_at: string
  total_count: number
  data: any[]
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

export default function ReportsPage() {
  const { user } = useAuth()
  const permissions = usePermissions(user)
  const [selectedReportType, setSelectedReportType] = useState<'licenses' | 'equipment'>('licenses')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

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

  const generateReport = async () => {
    if (!permissions.can('read', 'reports')) {
      alert('Permissions insuffisantes pour générer des rapports')
      return
    }

    setIsGenerating(true)
    
    try {
      const params = new URLSearchParams()
      if (selectedClientId) params.append('client_id', selectedClientId)
      if (selectedStatus) params.append('status', selectedStatus)
      params.append('format', selectedFormat)

      const endpoint = selectedReportType === 'licenses' 
        ? `/api/reports/licenses?${params}`
        : `/api/reports/equipment?${params}`

      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport')
      }

      if (selectedFormat === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `rapport_${selectedReportType}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la génération du rapport')
    } finally {
      setIsGenerating(false)
    }
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

  if (!permissions.canExportReports) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès refusé</h3>
          <p className="text-gray-600">Vous n&apos;avez pas les permissions nécessaires pour accéder aux rapports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">Rapports et Statistiques</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Générez et visualisez des rapports détaillés sur vos licences et équipements.
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
            Configurez et générez des rapports personnalisés
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Configuration du rapport */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de rapport
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as 'licenses' | 'equipment')}
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
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                {selectedReportType === 'licenses' ? (
                  <>
                    <option value="actif">Actif</option>
                    <option value="expiré">Expiré</option>
                    <option value="about_to_expire">Bientôt expiré</option>
                  </>
                ) : (
                  <>
                    <option value="actif">Actif</option>
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
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as 'json' | 'csv')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="json">Aperçu (JSON)</option>
                <option value="csv">Téléchargement (CSV)</option>
              </select>
            </div>
          </div>

          {/* Bouton de génération */}
          <div className="flex justify-end">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Génération...' : 'Générer le rapport'}
            </button>
          </div>
        </div>
      </div>

      {/* Affichage du rapport généré */}
      {reportData && selectedFormat === 'json' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{reportData.title}</h3>
              <p className="mt-1 text-sm text-gray-500">
                Généré le {formatDate(reportData.generated_at)} • {reportData.total_count} éléments
              </p>
            </div>
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
              Exporter JSON
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedReportType === 'licenses' ? (
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
                    {selectedReportType === 'licenses' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.nom_licence}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.éditeur || 'N/A'}
                        </td>
                        {permissions.canViewAllData() && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.nom_client || 'N/A'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.date_expiration ? formatDate(item.date_expiration) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.statut)}`}>
                            {item.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.coût ? formatCurrency(item.coût) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={item.jours_jusqu_à_expiration < 0 ? 'text-red-600 font-medium' : item.jours_jusqu_à_expiration <= 30 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                            {item.jours_jusqu_à_expiration !== null ? `${item.jours_jusqu_à_expiration} jours` : 'N/A'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.nom_équipement}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.marque || 'N/A'}
                        </td>
                        {permissions.canViewAllData() && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.nom_client || 'N/A'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.statut)}`}>
                            {item.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.date_obsolescence ? formatDate(item.date_obsolescence) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={item.jours_jusqu_à_obsolescence < 0 ? 'text-red-600 font-medium' : item.jours_jusqu_à_obsolescence <= 30 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                            {item.jours_jusqu_à_obsolescence !== null ? `${item.jours_jusqu_à_obsolescence} jours` : 'N/A'}
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
                Téléchargez le rapport CSV pour voir tous les résultats.
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
            Téléchargez des rapports prédéfinis
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setSelectedReportType('licenses')
                setSelectedStatus('expiré')
                setSelectedFormat('csv')
                setTimeout(generateReport, 100)
              }}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="w-5 h-5 mr-2 text-red-500" />
              Licences expirées
            </button>

            <button
              onClick={() => {
                setSelectedReportType('equipment')
                setSelectedStatus('obsolete')
                setSelectedFormat('csv')
                setTimeout(generateReport, 100)
              }}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <HardDrive className="w-5 h-5 mr-2 text-red-500" />
              Équipements obsolètes
            </button>

            <button
              onClick={() => {
                setSelectedReportType('licenses')
                setSelectedStatus('about_to_expire')
                setSelectedFormat('csv')
                setTimeout(generateReport, 100)
              }}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              Expirations prochaines
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
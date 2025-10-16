'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/lib/auth/permissions'
import { Download, FileText, RefreshCw, BarChart3, Users, HardDrive, Key, FileSpreadsheet, Calendar,  Shield,
  Server,
 } from 'lucide-react'
import { FaRegFilePdf, FaFileExcel } from "react-icons/fa"
import { useTranslations } from '@/hooks/useTranslations'
import { 
  useReports, 
  useReportsLicenseStats, 
  useReportsEquipmentStats, 
  useQuickReports,
  useReportNotifications,
  type ReportConfig 
} from '@/hooks/useReports'
import { useClients } from '@/hooks/useClients'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

function StatusChartSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center justify-between">
          <Skeleton className="w-24 h-5" />
          <div className="flex items-center space-x-2">
            <Skeleton className="w-24 h-2" />
            <Skeleton className="w-12 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth()
  const permissions = usePermissions(user)
  const r = useTranslations('reports')
  const canViewAll = permissions.canViewAllData()
  
  const { 
    isGenerating, 
    reportData, 
    generateReport, 
    downloadCurrentReport, 
    resetReport 
  } = useReports()
  
  const { clients, loading: clientsLoading } = useClients()
  
  const { stats: licenseStats, loading: licenseStatsLoading } = useReportsLicenseStats()
  const { stats: equipmentStats, loading: equipmentStatsLoading } = useReportsEquipmentStats()
  const { generateQuickReport } = useQuickReports()
  const { showNotification } = useReportNotifications()

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'licenses',
    clientId: '',
    status: '',
    format: 'json',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    if (!user || canViewAll) return
    const targetClientId = user.client_id ?? ''
    // Only update when necessary to avoid re-renders
    setReportConfig(prev => (prev.clientId === targetClientId ? prev : { ...prev, clientId: targetClientId }))
  }, [user, user?.client_id, canViewAll])


  const updateConfig = (key: keyof ReportConfig, value: string) => {
    setReportConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleGenerateReport = async (configOverride?: Partial<ReportConfig>) => {
    try {
      const result = await generateReport(reportConfig, configOverride)
      if (result.success) {
        showNotification(result.message, 'success')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification(error instanceof Error ? error.message : 'Erreur lors de la génération du rapport', 'error')
    }
  }

  const handleDownloadCurrentReport = async (format: 'csv' | 'pdf' | 'excel' | 'json') => {
    try {
      const result = await downloadCurrentReport(format)
      if (result?.success) {
        showNotification(result.message, 'success')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification(error instanceof Error ? error.message : 'Erreur lors du téléchargement', 'error')
    }
  }

  const handleQuickReport = async (
    type: 'expired-licenses' | 'obsolete-equipment' | 'expiring-soon',
    format: 'csv' | 'pdf' | 'excel' = 'csv'
  ) => {
    try {
      const result = await generateQuickReport(type, format)
      if (result.success) {
        showNotification(result.message, 'success')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification(error instanceof Error ? error.message : 'Erreur lors de la génération du rapport rapide', 'error')
    }
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
    resetReport()
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

  const getFormatIcon = (format: string) => {
    switch(format) {
      case 'csv': return <FileSpreadsheet className="w-4 h-4" />
      case 'pdf': return <FaRegFilePdf className="w-4 h-4" />
      case 'excel': return <FaFileExcel className="w-4 h-4 text-green-600" />
      case 'json': return <BarChart3 className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-6 text-gray-900">{r.t('ui.headerTitle')}</h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          {r.t('ui.headerSubtitle')}
        </p>
      </div>

      {/* Statistiques en un coup d'œil */}
      <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${permissions.canViewAllData() ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{r.t('ui.glanceLicenses')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {licenseStatsLoading ? <Skeleton className="w-16 h-6" /> : licenseStats?.total || 0}
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
                <Server className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{r.t('ui.glanceEquipment')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {equipmentStatsLoading ? <Skeleton className="w-16 h-6" /> : equipmentStats?.total || 0}
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
                <BarChart3 className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{r.t('ui.glanceTotalValue')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {licenseStatsLoading || equipmentStatsLoading ? <Skeleton className="w-20 h-6" /> : 
                      formatCurrency((licenseStats?.total_value || 0) + (equipmentStats?.total_value || 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {permissions.canViewAllData() && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{r.t('ui.glanceClients')}</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {clientsLoading ? <Skeleton className="w-16 h-6" /> : clients.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graphiques des statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{r.t('charts.licenseStatusTitle')}</h3>
          {licenseStatsLoading ? (
            <StatusChartSkeleton count={3} />
          ) : !licenseStats?.chart_data?.statuses?.length ? (
            <div className="flex items-center justify-center h-24 text-gray-500 text-center">{r.t('empty.licenseStatus')}</div>
          ) : (
            <div className="space-y-3">
              {licenseStats.chart_data.statuses.map((item) => (
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
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{r.t('charts.equipmentStatusTitle')}</h3>
          {equipmentStatsLoading ? (
            <StatusChartSkeleton count={3} />
          ) : !equipmentStats?.chart_data?.statuses?.length ? (
            <div className="flex items-center justify-center h-24 text-gray-500 text-center">{r.t('empty.equipmentStatus')}</div>
          ) : (
            <div className="space-y-3">
              {equipmentStats.chart_data.statuses.map((item) => (
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
          )}
        </div>
      </div>

      {/* Expirations mensuelles */}
      {licenseStatsLoading ? null : (
        licenseStats?.monthly_expiry?.length ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{r.t('charts.monthlyExpirationsTitle')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {licenseStats.monthly_expiry.map((item) => (
                <div key={item.month} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                  <div className="text-sm text-gray-600">{item.month}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{r.t('charts.monthlyExpirationsTitle')}</h3>
            <div className="flex items-center justify-center h-24 text-gray-500 text-center">{r.t('empty.monthlyExpirations')}</div>
          </div>
        )
      )}

      {/* Générateur de rapports */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{r.t('generator.title')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {r.t('generator.description')}
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Configuration du rapport */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {r.t('filters.type')}
              </label>
              <Select value={reportConfig.type} onValueChange={(value) => updateConfig('type', value)}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder={r.t('filters.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="licenses">{r.t('options.typeLicenses')}</SelectItem>
                  <SelectItem value="equipment">{r.t('options.typeEquipment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {permissions.canViewAllData() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {r.t('filters.client')}
                </label>
                <Select
                  value={reportConfig.clientId ?? ''}
                  onValueChange={(value) => updateConfig('clientId', value === '' ? '' : value)}
                  disabled={clientsLoading || !permissions.canViewAllData()}
                >
                  <SelectTrigger id="client-filter">
                    <SelectValue placeholder={r.t('filters.clientPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{r.t('options.clientAll')}</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {r.t('filters.status')}
              </label>
              <Select
                value={reportConfig.status || 'all'}
                onValueChange={(value) =>
                  updateConfig('status', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger id="report-status">
                  <SelectValue placeholder={r.t('options.statusAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={'all'}>{r.t('options.statusAll')}</SelectItem>
                  {reportConfig.type === 'licenses' ? (
                    <>
                      <SelectItem value="active">{r.t('options.statusLicense.active')}</SelectItem>
                      <SelectItem value="expired">{r.t('options.statusLicense.expired')}</SelectItem>
                      <SelectItem value="about_to_expire">{r.t('options.statusLicense.about_to_expire')}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="active">{r.t('options.statusEquipment.active')}</SelectItem>
                      <SelectItem value="obsolete">{r.t('options.statusEquipment.obsolete')}</SelectItem>
                      <SelectItem value="bientot_obsolete">{r.t('options.statusEquipment.bientot_obsolete')}</SelectItem>
                      <SelectItem value="en_maintenance">{r.t('options.statusEquipment.en_maintenance')}</SelectItem>
                      <SelectItem value="retire">{r.t('options.statusEquipment.retire')}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {r.t('filters.format')}
              </label>
              <Select
                value={reportConfig.format}
                onValueChange={(value) => updateConfig('format', value)}
              >
                <SelectTrigger id="report-format">
                  <SelectValue placeholder={r.t('filters.formatPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">{r.t('options.formatJson')}</SelectItem>
                  <SelectItem value="csv">{r.t('options.formatCsv')}</SelectItem>
                  <SelectItem value="excel">{r.t('options.formatExcel')}</SelectItem>
                  <SelectItem value="pdf">{r.t('options.formatPdf')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {r.t('filters.dateFrom')}
              </label>
              
              <Input
                type="date"
                value={reportConfig.dateFrom}
                onChange={(e) => updateConfig('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {r.t('filters.dateTo')}
              </label>
              <Input
                type="date"
                value={reportConfig.dateTo}
                onChange={(e) => updateConfig('dateTo', e.target.value)}
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
              {r.t('actions.reset')}
            </button>

            <div className="flex space-x-3 items-center">
              {reportConfig.format !== 'json' && (
                <div className="flex items-center space-x-2">
                  {getFormatIcon(reportConfig.format)}
                  <span className="text-sm text-gray-600">
                    {r.t('ui.autoDownloadNotice').replace('{{format}}', reportConfig.format.toUpperCase())}
                  </span>
                </div>
              )}
              
              <button
                onClick={() => handleGenerateReport()}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <>
                    {getFormatIcon(reportConfig.format)}
                    <span className="ml-2" />
                  </>
                )}
                {isGenerating ? r.t('actions.generating') : r.t('actions.generate')}
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
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleDownloadCurrentReport('excel')}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <FaFileExcel className="w-4 h-4 mr-2 text-green-600" />
                Excel
              </button>

              <button
                onClick={() => handleDownloadCurrentReport('pdf')}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <FaRegFilePdf className="w-4 h-4 mr-2" />
                PDF
              </button>
              
              <button
                onClick={() => handleDownloadCurrentReport('csv')}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                CSV
              </button>
              
              <button
                onClick={() => handleDownloadCurrentReport('json')}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </button>
            </div>
          </div>

          {/* Tableau des données - Reste identique au code original */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {reportConfig.type === 'licenses' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.editor')}</th>
                      {permissions.canViewAllData() && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.client')}</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.expiration')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.cost')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.daysUntilExpiry')}</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.type')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.brand')}</th>
                      {permissions.canViewAllData() && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.client')}</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.obsolescence')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r.t('reports.tableHeaders.daysUntilObsolescence')}</th>
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
                          {item.license_name || item.name}
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
                          {item.equipment_name || item.name}
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
                          {item.obsolescence_date || item.estimated_obsolescence_date ? formatDate(item.obsolescence_date || item.estimated_obsolescence_date) : 'N/A'}
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
                Téléchargez le rapport CSV, Excel ou PDF pour voir tous les résultats.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rapports rapides */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{r.t('actions.quickTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {r.t('actions.quickSubtitle')}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Licences expirées */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 mr-2 text-red-500" />
                <h4 className="font-medium text-gray-900">{r.t('actions.quickExpiredLicenses')}</h4>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuickReport('expired-licenses', 'csv')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  {r.t('actions.btnCsv')}
                </button>
                <button
                  onClick={() => handleQuickReport('expired-licenses', 'excel')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaFileExcel className="w-3 h-3 mr-1 text-green-600" />
                  {r.t('actions.btnExcel')}
                </button>
                <button
                  onClick={() => handleQuickReport('expired-licenses', 'pdf')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaRegFilePdf className="w-3 h-3 mr-1" />
                  {r.t('actions.btnPdf')}
                </button>
              </div>
            </div>

            {/* Équipements obsolètes */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <HardDrive className="w-5 h-5 mr-2 text-red-500" />
                <h4 className="font-medium text-gray-900">{r.t('actions.quickObsoleteEquipment')}</h4>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuickReport('obsolete-equipment', 'csv')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  {r.t('actions.btnCsv')}
                </button>
                <button
                  onClick={() => handleQuickReport('obsolete-equipment', 'excel')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaFileExcel className="w-3 h-3 mr-1 text-green-600" />
                  {r.t('actions.btnExcel')}
                </button>
                <button
                  onClick={() => handleQuickReport('obsolete-equipment', 'pdf')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaRegFilePdf className="w-3 h-3 mr-1" />
                  {r.t('actions.btnPdf')}
                </button>
              </div>
            </div>

            {/* Expirations prochaines */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                <h4 className="font-medium text-gray-900">{r.t('actions.quickExpiringSoon')}</h4>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleQuickReport('expiring-soon', 'csv')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  {r.t('actions.btnCsv')}
                </button>
                <button
                  onClick={() => handleQuickReport('expiring-soon', 'excel')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaFileExcel className="w-3 h-3 mr-1 text-green-600" />
                  Excel
                </button>
                <button
                  onClick={() => handleQuickReport('expiring-soon', 'pdf')}
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaRegFilePdf className="w-3 h-3 mr-1" />
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
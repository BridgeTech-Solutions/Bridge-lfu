// Mise à jour de votre Dashboard existant
'use client'

import {
  useEquipmentStats,
  useLicenseStats,
  useStatsAlerts,
  useEquipmentTrends,
} from '@/hooks/useStats'
import { useStablePermissions } from '@/hooks/index'
import { useDashboard } from '@/hooks/useDashboard'
import { useClients } from '@/hooks/useClients'
import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Shield,
  Server,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  CheckCircle,

  DollarSign,

} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { useMemo } from 'react'
import { useTranslations } from '@/hooks/useTranslations'

  interface StatCardProps {
    title: string
    value: number
    icon: React.ElementType
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
    trend?: {
      value: number
      isPositive: boolean
    }
    href?: string
    subtitle?: string
    trendLabel?: string
  }
  function StatCard({ title, value, icon: Icon, color, trend, href, subtitle, trendLabel }: StatCardProps) {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    }

    const content = (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500 h-full">
        <CardContent className="p-6 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center mt-2">
                  {trend.isPositive ? (
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                  )}
                  <span className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                  {trendLabel && (
                    <span className="text-xs text-gray-500 ml-1">{trendLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    )

    return href ? <Link href={href}>{content}</Link> : content
  }




const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {children}
        </CardContent>
      </Card>
    )
  }
  // À ajouter dans `page.tsx` (ou un fichier `DashboardSkeletons.tsx`)
function StatCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-gray-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div> {/* Titre */}
            <div className="h-8 bg-gray-300 rounded w-1/2"></div> {/* Valeur principale */}
            <div className="h-3 bg-gray-200 rounded w-3/4"></div> {/* Sous-titre/Détail */}
          </div>
          <div className="p-3 rounded-lg border bg-gray-100 h-12 w-12">
            {/* Icône */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
// À ajouter dans `page.tsx`
function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <ChartCard title={title}>
      <div className="animate-pulse flex items-center justify-center h-[300px] bg-gray-100 rounded-lg">
        <div className="h-1/3 w-1/3 bg-gray-300 rounded-full opacity-50"></div>
      </div>
    </ChartCard>
  )
}
// À ajouter dans `page.tsx`
function AlertsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900 w-1/3 h-6 bg-gray-200 rounded animate-pulse"></CardTitle>
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {[...Array(count)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
              <div className="flex-shrink-0 h-9 w-9 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
export default function DashboardPage() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState('all')  // Changer à 'all' par défaut
  const { stats, loading, error } = useDashboard(selectedClient === 'all' ? undefined : selectedClient)
  const { t } = useTranslations('dashboard')
  const statsTranslations = useTranslations('dashboard.stats')
  const chartsTranslations = useTranslations('dashboard.charts')
  const alertsTranslations = useTranslations('dashboard.alerts')
  const quickActionsTranslations = useTranslations('dashboard.quickActions')
  const clientSummaryTranslations = useTranslations('dashboard.clientSummary')
  const overviewTranslations = useTranslations('dashboard.overview')
  const errorsTranslations = useTranslations('dashboard.errors')
  
  // Récupérer la liste des clients pour le sélecteur
  const { clients } = useClients({ limit: 1000 }) // Récupérer tous les clients
  
  // NOUVEAUX hooks pour les statistiques avec filtrage par client
  const { stats: equipmentStats, loading: equipmentLoading, error: equipmentError } = useEquipmentStats(selectedClient === 'all' ? undefined : selectedClient)
  const { stats: licenseStats, loading: licenseLoading, error: licenseError } = useLicenseStats(selectedClient === 'all' ? undefined : selectedClient)
  const equipmentTrends = useEquipmentTrends(selectedClient === 'all' ? undefined : selectedClient)
  const statsAlerts = useStatsAlerts(selectedClient === 'all' ? undefined : selectedClient) // Passer clientId ici

    const operationalLicenseCount = useMemo(() => {
      if (!licenseStats || !licenseStats.by_status) return 0;
      
      // 1. Compte des licences strictement ACTIVES
      const actives = licenseStats.by_status.active || 0;
      
      // 2. Compte des licences qui fonctionnent mais qui BIENTÔT EXPIRENT
      const aboutToExpire = licenseStats.by_status.about_to_expire || 0;
      
      // Le compte opérationnel est la somme des deux
      return actives + aboutToExpire;

    }, [licenseStats]);
    const operationalEquipmentCount = useMemo(() => {
      if (!equipmentStats || !equipmentStats.by_status) return 0;
      
      // 1. Compte des équipements strictement ACTIFS
      const actifs = equipmentStats.by_status.actif || 0;
      
      // 2. Compte des équipements qui fonctionnent mais ont un AVERTISSEMENT
      const bientotObsolete = equipmentStats.by_status.bientot_obsolete || 0;
      
      // Le compte opérationnel est la somme des deux
      return actifs + bientotObsolete;

    }, [equipmentStats]);

    const totalAssetValue = useMemo(() => {
      const licensesValue = licenseStats?.total_value ?? 0;
      const equipmentValue = equipmentStats?.total_value ?? 0;
      return licensesValue + equipmentValue;
    }, [licenseStats?.total_value, equipmentStats?.total_value]);
    // Permissions stabilisées
    const stablePermissions = useStablePermissions()

  if (error || equipmentError || licenseError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertDescription>
            {errorsTranslations.t('loading')}: {error || equipmentError || licenseError}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-2">
              {overviewTranslations.t('subtitle').replace(
                '{{context}}',
                overviewTranslations.t(
                  `context.${stablePermissions.canViewAllData ? 'platform' : 'account'}`
                )
              )}
            </p>
          </div>
          {stablePermissions.canViewAllData && (
            <div className="flex items-center gap-2">
              <label htmlFor="client-select" className="text-sm font-medium text-gray-700">
                {t('clientFilter.label')}
              </label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client-select" className="w-64">
                  <SelectValue placeholder={t('clientFilter.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('clientFilter.allClients')}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

        {/* Stats Grid - AMÉLIORÉ avec les nouvelles données */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${stablePermissions.canViewAllData ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {stablePermissions.canViewAllData && (
            loading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard
                title={statsTranslations.t('totalClients')}
                value={stats?.total_clients || 0}
                icon={Users}
                color="blue"
                href="/clients"
              />
            )
          )}
          {licenseLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={statsTranslations.t('activeLicenses')}
              value={(operationalLicenseCount)}
              icon={Shield}
              color="green"
              href="/licenses"
              subtitle={statsTranslations
                .t('activeLicensesSubtitle')
                .replace('{{count}}', String(licenseStats?.by_status.expired || 0))}
            />
          )}
          {equipmentLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={statsTranslations.t('activeEquipment')}
              value={(operationalEquipmentCount)}
              icon={Server}
              color="blue"
              href="/equipment"
              subtitle={statsTranslations
                .t('activeEquipmentSubtitle')
                .replace('{{count}}', String(equipmentStats?.by_status.obsolete || 0))}
            />
          )}
          {licenseLoading || equipmentLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title={statsTranslations.t('criticalAlerts')}
              value={statsAlerts.criticalCount}
              icon={AlertTriangle}
              color="red"
              subtitle={statsTranslations
                .t('criticalAlertsSubtitle')
                .replace('{{count}}', String(statsAlerts.warningCount))}
            />
          )}
        </div>

        {/* Section graphiques - OPTIMISÉE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Équipements - Utilise les nouvelles données */}
          {equipmentLoading ? (
            <ChartCardSkeleton title={chartsTranslations.t('equipmentByType')} />
          ) : !equipmentStats?.chart_data?.types?.length ? (
            <ChartCard title={chartsTranslations.t('equipmentByType')}>
              <div className="flex items-center justify-center h-[300px] text-gray-500 text-center">{chartsTranslations.t('empty.equipmentByType')}</div>
            </ChartCard>
          ) : (
            <ChartCard title={chartsTranslations.t('equipmentByType')}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={equipmentStats.chart_data.types}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(data, index) => {
                      const entry = equipmentStats.chart_data.types[index]
                      if (entry?.name) {
                        const url = new URL('/equipment', window.location.origin)
                        url.searchParams.set('type', entry.name)
                        router.push(url.pathname + '?' + url.searchParams.toString())
                      }
                    }}
                  >
                    {equipmentStats.chart_data.types.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}


          {/* Licences - Utilise les nouvelles données */}

          {licenseLoading ? (
            <ChartCardSkeleton title={chartsTranslations.t('licenseStatus')} />
          ) : !licenseStats?.chart_data?.statuses?.length ? (
            <ChartCard title={chartsTranslations.t('licenseStatus')}>
              <div className="flex items-center justify-center h-[300px] text-gray-500 text-center">{chartsTranslations.t('empty.licenseStatus')}</div>
            </ChartCard>
          ) : (
            <ChartCard title={chartsTranslations.t('licenseStatus')}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  // Barre combinée : Actif + bientôt expiré
                  {
                    name: 'Actif',
                    value: (licenseStats.chart_data.statuses.find(s => s.name === 'active')?.value || 0) + (licenseStats.by_status.about_to_expire || 0),
                    percentage: 0
                  },
                  // Barre séparée : bientôt expiré
                  licenseStats.chart_data.statuses.find(s => s.name === 'about_to_expire') || { name: 'about_to_expire', value: 0, percentage: 0 },
                  // Barre séparée : expired
                  licenseStats.chart_data.statuses.find(s => s.name === 'expired') || { name: 'expired', value: 0, percentage: 0 }
                ].filter(item => item.value > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" onClick={(data) => {
                    const name = (data && (data as unknown as { activeLabel?: string }).activeLabel) || ''
                    const statusMap: Record<string, string> = { active: 'active', about_to_expire: 'about_to_expire', expired: 'expired', Actif: 'active' }
                    const status = statusMap[name] || name
                    if (status) {
                      const url = new URL('/licenses', window.location.origin)
                      if (status === 'active') {
                        // Pas de filtre explicite pour la barre combinée; on renvoie vers la liste
                      } else {
                        url.searchParams.set('status', status)
                      }
                      router.push(url.pathname + (url.search ? '?' + url.searchParams.toString() : ''))
                    }
                  }} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {/* Nouveau graphique - Évolution des expirations */}
          {licenseLoading ? (
            <ChartCardSkeleton title={chartsTranslations.t('upcomingExpirations')} />
          ) : !licenseStats?.chart_data.expiry || licenseStats.chart_data.expiry.length === 0 ? (
            <ChartCard title={chartsTranslations.t('upcomingExpirations')}>
              <div className="flex items-center justify-center h-[300px] text-gray-500 text-center">{chartsTranslations.t('empty.upcomingExpirations')}</div>
            </ChartCard>
          ) : (
            <ChartCard title={chartsTranslations.t('upcomingExpirations')}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={licenseStats.chart_data.expiry}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#FF8042" 
                    strokeWidth={2}
                    name={chartsTranslations.t('expirationsSeries')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Nouveau: Obsolescence équipements (12 mois) */}
          {equipmentTrends.loading ? (
            <ChartCardSkeleton title={chartsTranslations.t('equipmentObsolescence')} />
          ) : equipmentTrends.months.length === 0 ? (
            <ChartCard title={chartsTranslations.t('equipmentObsolescence')}>
              <div className="flex items-center justify-center h-[300px] text-gray-500 text-center">{chartsTranslations.t('empty.equipmentObsolescence')}</div>
            </ChartCard>
          ) : (
            <ChartCard title={chartsTranslations.t('equipmentObsolescence')}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={equipmentTrends.months} onClick={(e) => {
                  const payload = (e && (e as unknown as { activeLabel?: string })).activeLabel
                  // payload est comme 'nov. 2025' → pas de filtre direct par mois dans /equipment; à implémenter plus tard si nécessaire
                }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    name={chartsTranslations.t('equipmentObsolescenceSeries')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          

          {/* Statuts des équipements */}
          {equipmentLoading ? (
            <ChartCardSkeleton title={chartsTranslations.t('equipmentStatus')} />
          ) : !equipmentStats?.chart_data?.statuses?.length ? (
            <ChartCard title={chartsTranslations.t('equipmentStatus')}>
              <div className="flex items-center justify-center h-[300px] text-gray-500 text-center">{chartsTranslations.t('empty.equipmentStatus')}</div>
            </ChartCard>
          ) : (
            <ChartCard title={chartsTranslations.t('equipmentStatus')}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  // Barre combinée : Actif + bientôt obsolète
                  {
                    name: 'Actif',
                    value: (equipmentStats.chart_data.statuses.find(s => s.name === 'actif')?.value || 0) + (equipmentStats.by_status.bientot_obsolete || 0),
                    percentage: 0
                  },
                  // Barre séparée : bientôt obsolète
                  equipmentStats.chart_data.statuses.find(s => s.name === 'bientot_obsolete') || { name: 'bientot_obsolete', value: 0, percentage: 0 },
                  // Barre séparée : obsolete
                  equipmentStats.chart_data.statuses.find(s => s.name === 'obsolete') || { name: 'obsolete', value: 0, percentage: 0 }
                ].filter(item => item.value > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" onClick={(data) => {
                    const name = (data && (data as unknown as { activeLabel?: string }).activeLabel) || ''
                    const statusMap: Record<string, string> = { Actif: 'actif', bientot_obsolete: 'bientot_obsolete', obsolete: 'obsolete' }
                    const status = statusMap[name] || name
                    const url = new URL('/equipment', window.location.origin)
                    if (status && status !== 'Actif') {
                      url.searchParams.set('status', status)
                    }
                    router.push(url.pathname + (url.search ? '?' + url.searchParams.toString() : ''))
                  }} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Section inférieure */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alertes - AMÉLIORÉ avec les nouvelles alertes */}
          <div className="lg:col-span-2">

            {licenseLoading || equipmentLoading ? (
              <AlertsCardSkeleton />
            ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {alertsTranslations.t('title')}
                      {( statsAlerts.totalCount > 0) && (
                        <Badge variant="destructive" className="ml-2">
                          { statsAlerts.totalCount}
                        </Badge>
                      )}
                    </CardTitle>
                    <Link
                      href="/notifications"
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center"
                    >
                      {alertsTranslations.t('viewAll')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0">
                    {(statsAlerts.alerts.length > 0) ? (
                      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {/* Alertes critiques en premier */}
                        {statsAlerts.alerts.map((alert, index) => (
                          <div key={`stats-alert-${index}`} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  alert.level === 'danger' ? 'bg-red-50' : 'bg-yellow-50'
                                }`}>
                                  {alert.type === 'equipment' ? (
                                    <Server className={`h-4 w-4 ${
                                      alert.level === 'danger' ? 'text-red-600' : 'text-yellow-600'
                                    }`} />
                                  ) : (
                                    <Shield className={`h-4 w-4 ${
                                      alert.level === 'danger' ? 'text-red-600' : 'text-yellow-600'
                                    }`} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                                  <p className="text-xs text-gray-500">{alertsTranslations.t('systemLabel')}</p>
                                </div>
                              </div>
                              <Badge variant={alert.level === 'danger' ? 'destructive' : 'warning'}>
                                {alert.level === 'danger'
                                  ? alertsTranslations.t('badgeCritical')
                                  : alertsTranslations.t('badgeWarning')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">{alertsTranslations.t('emptyTitle')}</p>
                        <p>{alertsTranslations.t('emptyDescription')}</p>
                      </div>
                    )}
                  </CardContent>
              </Card>
            )}
          </div>
          {/* Actions rapides et métriques */}

          <div className="space-y-6">
            {/* Actions rapides - INCHANGÉ */}
           {stablePermissions.canViewAllData && (

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stablePermissions.can('create', 'clients') && (
                  <Link
                    href="/clients/new"
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-blue-900">
                        {quickActionsTranslations.t('newClient')}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                
                {stablePermissions.can('create', 'licenses') && (
                  <Link
                    href="/licenses/new"
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                  >
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-green-900">
                        {quickActionsTranslations.t('newLicense')}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                
                {stablePermissions.can('create', 'equipment') && (
                  <Link
                    href="/equipment/new"
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex items-center">
                      <Server className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-purple-900">
                        {quickActionsTranslations.t('newEquipment')}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                
                {stablePermissions.can('read', 'reports') && (
                  <Link
                    href="/reports"
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
                  >
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-orange-600 mr-3" />
                      <span className="text-sm font-medium text-orange-900">
                        {quickActionsTranslations.t('reports')}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-orange-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}              
              </CardContent>
            </Card>
          )}



            {/* Section client - AMÉLIORÉE avec valeur des licences */}
            {!stablePermissions.canViewAllData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {clientSummaryTranslations.t('title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-blue-900">{clientSummaryTranslations.t('licenses')}</span>
                    </div>
                    <Badge variant="secondary">{licenseStats?.total || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <Server className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-purple-900">{clientSummaryTranslations.t('equipment')}</span>
                    </div>
                    <Badge variant="secondary">{equipmentStats?.total || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
                      <span className="text-sm font-medium text-orange-900">{clientSummaryTranslations.t('alerts')}</span>
                    </div>
                    <Badge variant={statsAlerts.totalCount > 0 ? "destructive" : "secondary"}>
                      {statsAlerts.totalCount}
                    </Badge>
                  </div>
                  {(licenseStats || equipmentStats) && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-sm font-medium text-green-900">{clientSummaryTranslations.t('totalValue')}</span>
                      </div>
                      <Badge variant="secondary">
                        {totalAssetValue.toLocaleString('fr-FR')} FCFA
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }
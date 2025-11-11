'use client'

import {
  useEquipmentStats,
  useLicenseStats,
  useStatsAlerts,
  useEquipmentTrends,
  useLicenseTrends,
} from '@/hooks/useStats'
import { useStablePermissions } from '@/hooks/index'
import { useDashboard } from '@/hooks/useDashboard'
import { useClients } from '@/hooks/useClients'
import { useState, useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DonutChart as TremorDonutChart,
  AreaChart as TremorAreaChart,
  BarChart as TremorBarChart,
} from '@tremor/react'
import { useTranslations } from '@/hooks/useTranslations'

// ============================================================================
// SYSTÈME DE COULEURS HARMONISÉ
// ============================================================================
const COLORS = {
  // Palette principale
  primary: {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', chart: 'blue' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', chart: 'emerald' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', chart: 'purple' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', chart: 'orange' },
  },
  // États
  status: {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    danger: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    info: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  },
  // Neutrals
  neutral: {
    light: 'bg-gray-50',
    medium: 'bg-gray-100',
    dark: 'text-gray-900',
    muted: 'text-gray-600',
    subtle: 'text-gray-500',
  }
}

// ============================================================================
// COMPOSANTS DE BASE
// ============================================================================

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: keyof typeof COLORS.primary
  trend?: { value: number; isPositive: boolean }
  href?: string
  subtitle?: string
  trendLabel?: string
}

function StatCard({ title, value, icon: Icon, color, trend, href, subtitle, trendLabel }: StatCardProps) {
  const colorScheme = COLORS.primary[color]
  
  const content = (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 cursor-pointer h-full",
      "border-l-4",
      colorScheme.border.replace('border-', 'border-l-')
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn("text-sm font-medium", COLORS.neutral.muted)}>{title}</p>
            <p className={cn("text-3xl font-bold mt-2", COLORS.neutral.dark)}>
              {value.toLocaleString('fr-FR')}
            </p>
            {subtitle && (
              <p className={cn("text-xs mt-1", COLORS.neutral.subtle)}>{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-3">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                )}
                <span className={cn(
                  'text-sm font-semibold',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                {trendLabel && (
                  <span className={cn("text-xs ml-1", COLORS.neutral.subtle)}>{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl border-2',
            colorScheme.bg,
            colorScheme.text,
            colorScheme.border
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function ChartCard({ title, children, className = '' }: { 
  title: string
  children: React.ReactNode
  className?: string 
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// COMPOSANTS DE CHARGEMENT
// ============================================================================

function StatCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-gray-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="p-3 rounded-xl border-2 bg-gray-100 h-12 w-12"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <ChartCard title={title}>
      <div className="animate-pulse flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
        <div className="h-1/3 w-1/3 bg-gray-200 rounded-full opacity-50"></div>
      </div>
    </ChartCard>
  )
}

function AlertsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {[...Array(count)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-lg"></div>
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

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function DashboardPage() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState('all')
  
  // Hooks
  const { stats, loading, error } = useDashboard(selectedClient === 'all' ? undefined : selectedClient)
  const { clients } = useClients({ limit: 1000 })
  const { stats: equipmentStats, loading: equipmentLoading, error: equipmentError } = useEquipmentStats(
    selectedClient === 'all' ? undefined : selectedClient
  )
  const { stats: licenseStats, loading: licenseLoading, error: licenseError } = useLicenseStats(
    selectedClient === 'all' ? undefined : selectedClient
  )
  const equipmentTrends = useEquipmentTrends(selectedClient === 'all' ? undefined : selectedClient)
  const licenseTrends = useLicenseTrends(selectedClient === 'all' ? undefined : selectedClient)
  const statsAlerts = useStatsAlerts(selectedClient === 'all' ? undefined : selectedClient)
  const stablePermissions = useStablePermissions()
  
  // Traductions
  const { t } = useTranslations('dashboard')
  const statsTranslations = useTranslations('dashboard.stats')
  const chartsTranslations = useTranslations('dashboard.charts')
  const alertsTranslations = useTranslations('dashboard.alerts')
  const quickActionsTranslations = useTranslations('dashboard.quickActions')
  const clientSummaryTranslations = useTranslations('dashboard.clientSummary')
  const overviewTranslations = useTranslations('dashboard.overview')
  const errorsTranslations = useTranslations('dashboard.errors')

  // Calculs
  const operationalLicenseCount = useMemo(() => {
    if (!licenseStats?.by_status) return 0
    return (licenseStats.by_status.active || 0) + (licenseStats.by_status.about_to_expire || 0)
  }, [licenseStats])

  const operationalEquipmentCount = useMemo(() => {
    if (!equipmentStats?.by_status) return 0
    return (equipmentStats.by_status.actif || 0) + (equipmentStats.by_status.bientot_obsolete || 0)
  }, [equipmentStats])

  const totalAssetValue = useMemo(() => {
    return (licenseStats?.total_value ?? 0) + (equipmentStats?.total_value ?? 0)
  }, [licenseStats?.total_value, equipmentStats?.total_value])

  // Gestion des erreurs
  if (error || equipmentError || licenseError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {errorsTranslations.t('loading')}: {error || equipmentError || licenseError}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* ============================================================================
          EN-TÊTE
          ============================================================================ */}
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
          <div className="flex items-center gap-3">
            <label htmlFor="client-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
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

      {/* ============================================================================
          ONGLETS PRINCIPAUX
          ============================================================================ */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="licenses" className="data-[state=active]:bg-white">
            Licences
          </TabsTrigger>
          <TabsTrigger value="equipment" className="data-[state=active]:bg-white">
            Équipements
          </TabsTrigger>
        </TabsList>

        {/* ============================================================================
            ONGLET: VUE D'ENSEMBLE
            ============================================================================ */}
        <TabsContent value="overview" className="space-y-8">
          {/* KPI Cards */}
          <div className={cn(
            "grid gap-6",
            stablePermissions.canViewAllData 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" 
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
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
                value={operationalLicenseCount}
                icon={Shield}
                color="green"
                href="/licenses"
                subtitle={statsTranslations.t('activeLicensesSubtitle').replace(
                  '{{count}}',
                  String(licenseStats?.by_status.expired || 0)
                )}
              />
            )}
            
            {equipmentLoading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard
                title={statsTranslations.t('activeEquipment')}
                value={operationalEquipmentCount}
                icon={Server}
                color="purple"
                href="/equipment"
                subtitle={statsTranslations.t('activeEquipmentSubtitle').replace(
                  '{{count}}',
                  String(equipmentStats?.by_status.obsolete || 0)
                )}
              />
            )}
            
            {licenseLoading || equipmentLoading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard
                title={statsTranslations.t('criticalAlerts')}
                value={statsAlerts.criticalCount}
                icon={AlertTriangle}
                color="orange"
                href="/notifications"
                subtitle={statsTranslations.t('criticalAlertsSubtitle').replace(
                  '{{count}}',
                  String(statsAlerts.warningCount)
                )}
              />
            )}
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Équipements par type */}
            {equipmentLoading ? (
              <ChartCardSkeleton title={chartsTranslations.t('equipmentByType')} />
            ) : !equipmentStats?.chart_data?.types?.length ? (
              <ChartCard title={chartsTranslations.t('equipmentByType')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.equipmentByType')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('equipmentByType')}>
                <div className="h-[300px]">
                  <TremorDonutChart
                    className="h-full"
                    data={equipmentStats.chart_data.types}
                    category="value"
                    index="name"
                    colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                    onValueChange={(v) => {
                      const name = typeof v === 'string' ? v : (v as { name?: string })?.name
                      if (name) {
                        const url = new URL('/equipment', window.location.origin)
                        url.searchParams.set('type', name)
                        router.push(url.pathname + '?' + url.searchParams.toString())
                      }
                    }}
                  />
                </div>
              </ChartCard>
            )}

            {/* Statut des licences */}
            {licenseLoading ? (
              <ChartCardSkeleton title={chartsTranslations.t('licenseStatus')} />
            ) : !licenseStats?.chart_data?.statuses?.length ? (
              <ChartCard title={chartsTranslations.t('licenseStatus')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.licenseStatus')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('licenseStatus')}>
                <div className="h-[300px]">
                  <TremorBarChart
                    className="h-full"
                    data={[
                      { 
                        name: 'Actif', 
                        value: (licenseStats.chart_data.statuses.find(s => s.name === 'active')?.value || 0) + 
                               (licenseStats.by_status.about_to_expire || 0) 
                      },
                      licenseStats.chart_data.statuses.find(s => s.name === 'about_to_expire') || { name: 'about_to_expire', value: 0 },
                      licenseStats.chart_data.statuses.find(s => s.name === 'expired') || { name: 'expired', value: 0 }
                    ].filter(item => (item as { value?: number }).value && (item as { value: number }).value > 0)}
                    index="name"
                    categories={['value']}
                    colors={['emerald']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                    onValueChange={(v) => {
                      const name = (v && (v as { name?: string }).name) || ''
                      const statusMap: Record<string, string> = { 
                        active: 'active', 
                        about_to_expire: 'about_to_expire', 
                        expired: 'expired', 
                        Actif: 'active' 
                      }
                      const status = statusMap[name] || name
                      if (status) {
                        const url = new URL('/licenses', window.location.origin)
                        if (status !== 'active' && status !== 'Actif') {
                          url.searchParams.set('status', status)
                        }
                        router.push(url.pathname + (url.search ? '?' + url.searchParams.toString() : ''))
                      }
                    }}
                  />
                </div>
              </ChartCard>
            )}

            {/* Expirations à venir */}
            {licenseTrends.loading ? (
              <ChartCardSkeleton title={chartsTranslations.t('upcomingExpirations')} />
            ) : !licenseTrends.months || licenseTrends.months.length === 0 ? (
              <ChartCard title={chartsTranslations.t('upcomingExpirations')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.upcomingExpirations')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('upcomingExpirations')}>
                <div className="h-[300px]">
                  <TremorAreaChart
                    className="h-full"
                    data={licenseTrends.months}
                    index="month"
                    categories={['count']}
                    colors={['amber']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                  />
                </div>
              </ChartCard>
            )}

            {/* Obsolescence équipements */}
            {equipmentTrends.loading ? (
              <ChartCardSkeleton title={chartsTranslations.t('equipmentObsolescence')} />
            ) : equipmentTrends.months.length === 0 ? (
              <ChartCard title={chartsTranslations.t('empty.equipmentObsolescence')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.equipmentObsolescence')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('empty.equipmentObsolescence')}>
                <div className="h-[300px]">
                  <TremorAreaChart
                    className="h-full"
                    data={equipmentTrends.months}
                    index="month"
                    categories={['count']}
                    colors={['violet']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                  />
                </div>
              </ChartCard>
            )}
          </div>

          {/* Section Alertes et Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alertes */}
            <div className="lg:col-span-2">
              {licenseLoading || equipmentLoading ? (
                <AlertsCardSkeleton />
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {alertsTranslations.t('title')}
                      {statsAlerts.totalCount > 0 && (
                        <Badge variant="destructive">{statsAlerts.totalCount}</Badge>
                      )}
                    </CardTitle>
                    <Link
                      href="/notifications"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      {alertsTranslations.t('viewAll')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0">
                    {statsAlerts.alerts.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {statsAlerts.alerts.map((alert, index) => (
                          <div 
                            key={`stats-alert-${index}`} 
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={cn(
                                  'p-2.5 rounded-lg',
                                  alert.level === 'danger' ? COLORS.status.danger.bg : COLORS.status.warning.bg
                                )}>
                                  {alert.type === 'equipment' ? (
                                    <Server className={cn(
                                      'h-5 w-5',
                                      alert.level === 'danger' ? COLORS.status.danger.text : COLORS.status.warning.text
                                    )} />
                                  ) : (
                                    <Shield className={cn(
                                      'h-5 w-5',
                                      alert.level === 'danger' ? COLORS.status.danger.text : COLORS.status.warning.text
                                    )} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {alertsTranslations.t('systemLabel')}
                                  </p>
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
                      <div className="p-8 text-center">
                        <CheckCircle className="h-16 w-16 mx-auto text-emerald-200 mb-4" />
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          {alertsTranslations.t('emptyTitle')}
                        </p>
                        <p className="text-gray-500">{alertsTranslations.t('emptyDescription')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Actions rapides / Résumé client */}
            <div className="space-y-6">
              {stablePermissions.canViewAllData ? (
                <Card>
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Actions Rapides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    {stablePermissions.can('create', 'clients') && (
                      <Link
                        href="/clients/new"
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all group",
                          COLORS.primary.blue.bg,
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Users className={cn("h-5 w-5", COLORS.primary.blue.text)} />
                          <span className="text-sm font-medium text-blue-900">
                            {quickActionsTranslations.t('newClient')}
                          </span>
                        </div>
                        <ArrowRight className={cn(
                          "h-4 w-4 transition-transform group-hover:translate-x-1",
                          COLORS.primary.blue.text
                        )} />
                      </Link>
                    )}
                    
                    {stablePermissions.can('create', 'licenses') && (
                      <Link
                        href="/licenses/new"
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all group",
                          COLORS.primary.green.bg,
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Shield className={cn("h-5 w-5", COLORS.primary.green.text)} />
                          <span className="text-sm font-medium text-emerald-900">
                            {quickActionsTranslations.t('newLicense')}
                          </span>
                        </div>
                        <ArrowRight className={cn(
                          "h-4 w-4 transition-transform group-hover:translate-x-1",
                          COLORS.primary.green.text
                        )} />
                      </Link>
                    )}
                    
                    {stablePermissions.can('create', 'equipment') && (
                      <Link
                        href="/equipment/new"
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all group",
                          COLORS.primary.purple.bg,
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Server className={cn("h-5 w-5", COLORS.primary.purple.text)} />
                          <span className="text-sm font-medium text-purple-900">
                            {quickActionsTranslations.t('newEquipment')}
                          </span>
                        </div>
                        <ArrowRight className={cn(
                          "h-4 w-4 transition-transform group-hover:translate-x-1",
                          COLORS.primary.purple.text
                        )} />
                      </Link>
                    )}
                    
                    {stablePermissions.can('read', 'reports') && (
                      <Link
                        href="/reports"
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all group",
                          COLORS.primary.orange.bg,
                          "hover:shadow-md"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className={cn("h-5 w-5", COLORS.primary.orange.text)} />
                          <span className="text-sm font-medium text-orange-900">
                            {quickActionsTranslations.t('reports')}
                          </span>
                        </div>
                        <ArrowRight className={cn(
                          "h-4 w-4 transition-transform group-hover:translate-x-1",
                          COLORS.primary.orange.text
                        )} />
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {clientSummaryTranslations.t('title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      COLORS.primary.green.bg
                    )}>
                      <div className="flex items-center gap-3">
                        <Shield className={cn("h-5 w-5", COLORS.primary.green.text)} />
                        <span className="text-sm font-medium text-emerald-900">
                          {clientSummaryTranslations.t('licenses')}
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {licenseStats?.total || 0}
                      </Badge>
                    </div>
                    
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      COLORS.primary.purple.bg
                    )}>
                      <div className="flex items-center gap-3">
                        <Server className={cn("h-5 w-5", COLORS.primary.purple.text)} />
                        <span className="text-sm font-medium text-purple-900">
                          {clientSummaryTranslations.t('equipment')}
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {equipmentStats?.total || 0}
                      </Badge>
                    </div>
                    
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      COLORS.primary.orange.bg
                    )}>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={cn("h-5 w-5", COLORS.primary.orange.text)} />
                        <span className="text-sm font-medium text-orange-900">
                          {clientSummaryTranslations.t('alerts')}
                        </span>
                      </div>
                      <Badge 
                        variant={statsAlerts.totalCount > 0 ? "destructive" : "secondary"}
                        className="font-semibold"
                      >
                        {statsAlerts.totalCount}
                      </Badge>
                    </div>
                    
                    {(licenseStats || equipmentStats) && (
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        COLORS.primary.blue.bg
                      )}>
                        <div className="flex items-center gap-3">
                          <DollarSign className={cn("h-5 w-5", COLORS.primary.blue.text)} />
                          <span className="text-sm font-medium text-blue-900">
                            {clientSummaryTranslations.t('totalValue')}
                          </span>
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {totalAssetValue.toLocaleString('fr-FR')} FCFA
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================================
            ONGLET: LICENCES
            ============================================================================ */}
        <TabsContent value="licenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {licenseTrends.loading ? (
              <ChartCardSkeleton title={chartsTranslations.t('upcomingExpirations')} />
            ) : !licenseTrends.months || licenseTrends.months.length === 0 ? (
              <ChartCard title={chartsTranslations.t('upcomingExpirations')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.upcomingExpirations')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('upcomingExpirations')}>
                <div className="h-[300px]">
                  <TremorAreaChart
                    className="h-full"
                    data={licenseTrends.months}
                    index="month"
                    categories={['count']}
                    colors={['amber']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                  />
                </div>
              </ChartCard>
            )}

            {licenseLoading ? (
              <ChartCardSkeleton title={chartsTranslations.t('licenseStatus')} />
            ) : !licenseStats?.chart_data?.statuses?.length ? (
              <ChartCard title={chartsTranslations.t('licenseStatus')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.licenseStatus')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('licenseStatus')}>
                <div className="h-[300px]">
                  <TremorBarChart
                    className="h-full"
                    data={[
                      {
                        name: 'Actif',
                        value: (licenseStats.chart_data.statuses.find(s => s.name === 'active')?.value || 0) + 
                               (licenseStats.by_status.about_to_expire || 0)
                      },
                      licenseStats.chart_data.statuses.find(s => s.name === 'about_to_expire') || { name: 'about_to_expire', value: 0 },
                      licenseStats.chart_data.statuses.find(s => s.name === 'expired') || { name: 'expired', value: 0 }
                    ].filter(item => (item as { value?: number }).value && (item as { value: number }).value > 0)}
                    index="name"
                    categories={['value']}
                    colors={['emerald']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                  />
                </div>
              </ChartCard>
            )}
          </div>
        </TabsContent>

        {/* ============================================================================
            ONGLET: ÉQUIPEMENTS
            ============================================================================ */}
        <TabsContent value="equipment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {equipmentTrends.loading ? (
              <ChartCardSkeleton title={chartsTranslations.t('empty.equipmentObsolescence')} />
            ) : equipmentTrends.months.length === 0 ? (
              <ChartCard title={chartsTranslations.t('empty.equipmentObsolescence')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.equipmentObsolescence')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('empty.equipmentObsolescence')}>
                <div className="h-[300px]">
                  <TremorAreaChart
                    className="h-full"
                    data={equipmentTrends.months}
                    index="month"
                    categories={['count']}
                    colors={['violet']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                  />
                </div>
              </ChartCard>
            )}

            {equipmentLoading ? (
              <ChartCardSkeleton title={chartsTranslations.t('equipmentByType')} />
            ) : !equipmentStats?.chart_data?.types?.length ? (
              <ChartCard title={chartsTranslations.t('equipmentByType')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.equipmentByType')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('equipmentByType')}>
                <div className="h-[300px]">
                  <TremorDonutChart
                    className="h-full"
                    data={equipmentStats.chart_data.types}
                    category="value"
                    index="name"
                    colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                  />
                </div>
              </ChartCard>
            )}

            {equipmentLoading ? (
              <ChartCardSkeleton title={chartsTranslations.t('equipmentStatus')} />
            ) : !equipmentStats?.chart_data?.statuses?.length ? (
              <ChartCard title={chartsTranslations.t('equipmentStatus')}>
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  {chartsTranslations.t('empty.equipmentStatus')}
                </div>
              </ChartCard>
            ) : (
              <ChartCard title={chartsTranslations.t('equipmentStatus')}>
                <div className="h-[300px]">
                  <TremorBarChart
                    className="h-full"
                    data={[
                      {
                        name: 'Actif',
                        value: (equipmentStats.chart_data.statuses.find(s => s.name === 'actif')?.value || 0) + 
                               (equipmentStats.by_status.bientot_obsolete || 0)
                      },
                      equipmentStats.chart_data.statuses.find(s => s.name === 'bientot_obsolete') || { name: 'bientot_obsolete', value: 0 },
                      equipmentStats.chart_data.statuses.find(s => s.name === 'obsolete') || { name: 'obsolete', value: 0 }
                    ].filter(item => (item as { value?: number }).value && (item as { value: number }).value > 0)}
                    index="name"
                    categories={['value']}
                    colors={['emerald']}
                    valueFormatter={(n: number) => n.toLocaleString('fr-FR')}
                  />
                </div>
              </ChartCard>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
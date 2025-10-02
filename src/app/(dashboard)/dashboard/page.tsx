  // Mise à jour de votre Dashboard existant
  'use client'

  import { 
    useEquipmentStats, 
    useLicenseStats, 
    useStatsAlerts 
  } from '@/hooks/useStats'
  import { 
    useAuthPermissions, 
    useStablePermissions,
  } from '@/hooks/index'
  import { 
    useDashboard, 

  } from '@/hooks/useDashboard'


  import { LoadingSpinner } from '@/components/ui/loading-spinner'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { Alert, AlertDescription } from '@/components/ui/alert'
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
    XCircle,
    Clock,
    Activity,
    DollarSign,
    Zap,
    Bell
  } from 'lucide-react'
  import Link from 'next/link'
  import { cn } from '@/lib/utils'
  import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts'
  import { useEffect, useMemo } from 'react'
  // ... autres imports

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
  }
  function StatCard({ title, value, icon: Icon, color, trend, href, subtitle }: StatCardProps) {
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
                  <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
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

  interface AlertItemProps {
    alert: {
      id: string
      item_name: string
      client_name?: string
      type: string
      alert_type: string
      alert_level: string
      alert_date: string
      status: string
    }
  }

  function AlertItem({ alert }: AlertItemProps) {
    const getAlertIcon = (alertType: string) => {
      switch (alertType) {
        case 'license_expiry':
          return Shield
        case 'equipment_obsolescence':
          return Server
        default:
          return AlertTriangle
      }
    }

    const getAlertColor = (level: string) => {
      switch (level) {
        case 'expired':
          return 'destructive'
        case 'urgent':
          return 'destructive'
        case 'warning':
          return 'warning'
        default:
          return 'secondary'
      }
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'active':
          return CheckCircle
        case 'expired':
        case 'obsolete':
          return XCircle
        case 'about_to_expire':
        case 'bientot_obsolete':
          return Clock
        default:
          return AlertTriangle
      }
    }

    const Icon = getAlertIcon(alert.alert_type)
    const StatusIcon = getStatusIcon(alert.status)

    return (
      <div className="flex items-center space-x-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
        <div className="flex-shrink-0">
          <div className="p-2 bg-red-50 rounded-lg">
            <Icon className="h-5 w-5 text-red-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {alert.item_name}
            </p>
            <Badge variant={getAlertColor(alert.alert_level)}>
              {alert.alert_level}
            </Badge>
          </div>
          <div className="flex items-center mt-1 space-x-2">
            {alert.client_name && (
              <p className="text-sm text-gray-500">
                Client: {alert.client_name}
              </p>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <StatusIcon className="h-4 w-4 mr-1" />
              {alert.status}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(alert.alert_date).toLocaleDateString('fr-FR')}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
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
    // Hooks existants
    const { stats, loading, error } = useDashboard()
    
    // NOUVEAUX hooks pour les statistiques
    const { stats: equipmentStats, loading: equipmentLoading, error: equipmentError } = useEquipmentStats()
    const { stats: licenseStats, loading: licenseLoading, error: licenseError } = useLicenseStats()
    const statsAlerts = useStatsAlerts() // Alertes intelligentes

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
    // Permissions stabilisées
    const stablePermissions = useStablePermissions()

    // Gestion des erreurs améliorée
    if (error || equipmentError || licenseError) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              Erreur lors du chargement: {error || equipmentError || licenseError}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // // État de chargement global
    // const isLoading = loading || equipmentLoading || licenseLoading 

    // if (isLoading) {
    //   return (
    //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    //       <div className="flex items-center justify-center min-h-96">
    //         <LoadingSpinner size="lg" />
    //       </div>
    //     </div>
    //   )
    // }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-2">
            Vue d&apos;ensemble de votre {stablePermissions.canViewAllData ? 'plateforme' : 'compte'}
          </p>
        </div>

        {/* Stats Grid - AMÉLIORÉ avec les nouvelles données */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${stablePermissions.canViewAllData ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          {stablePermissions.canViewAllData && (
            loading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard
                title="Total Clients"
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
              title="Licences Actives"
              value={(operationalLicenseCount)}
              icon={Shield}
              color="green"
              href="/licenses"
              subtitle={`${licenseStats?.by_status.expired || 0} expirées`}
            />
          )}
          {equipmentLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Équipements Actifs"
              value={(operationalEquipmentCount)}
              icon={Server}
              color="blue"
              href="/equipment"
              subtitle={`${equipmentStats?.by_status.obsolete || 0} obsolètes`}
            />
          )}
          {licenseLoading || equipmentLoading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Alertes Critiques"
              value={statsAlerts.criticalCount}
              icon={AlertTriangle}
              color="red"
              subtitle={`${statsAlerts.warningCount} avertissements`}
            />
          )}
        </div>

        {/* Section graphiques - OPTIMISÉE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Équipements - Utilise les nouvelles données */}
          {/*  eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain */}
         {equipmentLoading || !equipmentStats?.chart_data?.types?.length ? (
            <ChartCardSkeleton title="Répartition des Équipements par Type" />
          ) : (
            <ChartCard title="Répartition des Équipements par Type">
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
                  >
                    {equipmentStats.chart_data.types.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}


          {/* Licences - Utilise les nouvelles données */}

          {licenseLoading || !licenseStats?.chart_data?.statuses?.length ? (
            <ChartCardSkeleton title="Statut des Licences" />
          ) : (
            <ChartCard title="Statut des Licences">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={licenseStats.chart_data.statuses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          {/* Nouveau graphique - Évolution des expirations */}
          {licenseLoading || !licenseStats?.chart_data.expiry || licenseStats.chart_data.expiry.length === 0 ? (
            <ChartCardSkeleton title="Expirations à venir (6 mois)" />
          ) : (
            <ChartCard title="Expirations à venir (6 mois)">
              {/* ... Contenu du ResponsiveContainer LineChart existant ... */}
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
                    name="Expirations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
          

          {/* Statuts des équipements */}
          {equipmentLoading || !equipmentStats?.chart_data?.statuses?.length ? (
            <ChartCardSkeleton title="Statut des Équipements" />
          ) : (
            <ChartCard title="Statut des Équipements">
              {/* ... Contenu du ResponsiveContainer BarChart existant ... */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={equipmentStats.chart_data.statuses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" />
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
                      Alertes Récentes
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
                      Voir tout
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
                                  <p className="text-xs text-gray-500">Alerte système</p>
                                </div>
                              </div>
                              <Badge variant={alert.level === 'danger' ? 'destructive' : 'warning'}>
                                {alert.level === 'danger' ? 'Critique' : 'Attention'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">Tout va bien !</p>
                        <p>Aucune alerte critique à signaler</p>
                      </div>
                    )}
                  </CardContent>
              </Card>
            )}
          </div>

          {/* Actions rapides et métriques */}
          <div className="space-y-6">
            {/* Actions rapides - INCHANGÉ */}
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
                        Nouveau Client
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
                        Nouvelle Licence
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
                        Nouvel Équipement
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
                        Générer un Rapport
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-orange-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}              
              </CardContent>
            </Card>



            {/* Section client - AMÉLIORÉE avec valeur des licences */}
            {!stablePermissions.canViewAllData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Mes Données
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-blue-900">Licences</span>
                    </div>
                    <Badge variant="secondary">{licenseStats?.total || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <Server className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-purple-900">Équipements</span>
                    </div>
                    <Badge variant="secondary">{equipmentStats?.total || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mr-3" />
                      <span className="text-sm font-medium text-orange-900">Alertes</span>
                    </div>
                    <Badge variant={statsAlerts.totalCount > 0 ? "destructive" : "secondary"}>
                      {statsAlerts.totalCount}
                    </Badge>
                  </div>
                  {licenseStats && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-sm font-medium text-green-900">Valeur totale</span>
                      </div>
                      <Badge variant="secondary">
                        {licenseStats.total_value.toLocaleString()} FCFA
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
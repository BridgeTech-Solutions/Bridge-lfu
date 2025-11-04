// app/licenses/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { useRouter } from 'next/navigation'
import { Search, Plus, Download, Calendar, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PaginationWithLogic, PaginationInfo } from '@/components/ui/pagination'
import { 
  useStablePermissions,
  usePagination, 
  useDebounce 
} from '@/hooks'
import { useLicenses, useLicenseActions } from '@/hooks/useLicenses' // Nouveau hook
import { useLicenseTypes } from '@/hooks/useLicenseTypes'
import { useClients } from '@/hooks/useClients' // Nouveau hook
import type { LicenseStatus } from '@/types'
import { LicenseTable } from '@/components/tables/LicenseTable'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function LicensesPage() {

  const router = useRouter()
  const permissions = useStablePermissions()
  const { page, limit, goToPage } = usePagination(1)
  const { t } = useTranslations('licenses')

  // États des filtres
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'all'>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [editorFilter, setEditorFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expiryDateStart, setExpiryDateStart] = useState<string>('')
  const [expiryDateEnd, setExpiryDateEnd] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Valeurs débouncées pour éviter les requêtes excessives
  const debouncedSearch = useDebounce(search, 500)
  const debouncedEditorFilter = useDebounce(editorFilter, 500)

  // Utilisation du nouveau hook useLicenses
  const { 
    licenses, 
    loading: isLicensesLoading, 
    error: licensesError, 
    stats,
    pagination,
    refetch: refetchLicenses,
    deleteLicense,
    isDeleting,
    exportLicenses,
    isExporting
  } = useLicenses({
    page,
    limit: limit,
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter,
    clientId: clientFilter === 'all' ? undefined : clientFilter,
    editor: debouncedEditorFilter,
    typeId: typeFilter === 'all' ? undefined : typeFilter,
    expiryDateStart: expiryDateStart || undefined,
    expiryDateEnd: expiryDateEnd || undefined
  })
  
  const { 
    clients: clientsData, 
    loading: isClientsLoading 
  } = useClients({
    page: 1,
    limit: 999, // On charge tous les clients pour les filtres
    search: '',
    sector: ''
  })

  // Hook pour les actions (annuler/réactiver)
  const { updateStatus, isUpdatingStatus } = useLicenseActions()

  const { data: licenseTypes, isLoading: isLicenseTypesLoading } = useLicenseTypes()

  // Gestion de l'export
    const handleExport = async (format: 'xlsx' | 'csv' | 'json' = 'xlsx') => {
      try {
        await exportLicenses({
          params: {
            search: debouncedSearch,
            status: statusFilter === 'all' ? undefined : statusFilter,
            clientId: clientFilter === 'all' ? undefined : clientFilter,
            editor: debouncedEditorFilter,
            typeId: typeFilter === 'all' ? undefined : typeFilter,
            expiryDateStart: expiryDateStart || undefined,
            expiryDateEnd: expiryDateEnd || undefined
          },
          format
        })
      } catch (error) {
        // L'erreur est déjà gérée par le hook
      }
    }
  // Gestionnaires d'événements du tableau
  const handleEdit = (id: string) => router.push(`/licenses/${id}/edit`)
  const handleView = (id: string) => router.push(`/licenses/${id}`)
  
  const handleDelete = async (id: string) => {
    const license = licenses.find(l => l.id === id)
    if (!license) return

    if (confirm(`Êtes-vous sûr de vouloir supprimer la licence "${license.name}" ? Cette action est irréversible.`)) {
      try {
        await deleteLicense(id)
      } catch (error) {
        // L'erreur est déjà gérée par le hook
      }
    }
  }

  const handleCancel = async (id: string) => {
    const license = licenses.find(l => l.id === id)
    if (!license) return

    if (confirm(`Êtes-vous sûr de vouloir annuler la licence "${license.name}" ?`)) {
      try {
        await updateStatus({ id, action: 'cancel' })
        await refetchLicenses()
      } catch (error) {
        // L'erreur est déjà gérée par le hook
      }
    }
  }

  const handleReactivate = async (id: string) => {
    const license = licenses.find(l => l.id === id)
    if (!license) return

    if (confirm(`Êtes-vous sûr de vouloir réactiver la licence "${license.name}" ?`)) {
      try {
        await updateStatus({ id, action: 'reactivate' })
        await refetchLicenses()
      } catch (error) {
        // L'erreur est déjà gérée par le hook
      }
    }
  }

  // Données traitées
  const clients = clientsData || []
  const totalLicenses = pagination?.count || 0

  // Calcul du nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (search) count++
    if (statusFilter !== 'all') count++
    if (clientFilter !== 'all') count++
    if (editorFilter) count++
    if (typeFilter !== 'all') count++
    if (expiryDateStart) count++
    if (expiryDateEnd) count++
    return count
  }, [search, statusFilter, clientFilter, editorFilter, typeFilter, expiryDateStart, expiryDateEnd])

  // Gestion des changements de filtres avec retour à la page 1
  const handleSearchChange = (value: string) => {
    setSearch(value)
    goToPage(1)
  }

  const handleStatusFilterChange = (value: LicenseStatus | 'all') => {
    setStatusFilter(value)
    goToPage(1)
  }

  const handleClientFilterChange = (value: string) => {
    setClientFilter(value)
    goToPage(1)
  }

  const handleEditorFilterChange = (value: string) => {
    setEditorFilter(value)
    goToPage(1)
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    goToPage(1)
  }

  const handleExpiryDateStartChange = (value: string) => {
    setExpiryDateStart(value)
    goToPage(1)
  }

  const handleExpiryDateEndChange = (value: string) => {
    setExpiryDateEnd(value)
    goToPage(1)
  }

  // Affichage du loading global
  if (isLicensesLoading && page === 1) {
    return (
      <div className="space-y-6 mx-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('header.title')}</h1>
            <p className="text-gray-600">{t('header.subtitle')}</p>
          </div>
        </div>
        
        {/* Skeleton des statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Skeleton des filtres */}
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Skeleton du tableau */}
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Affichage en cas d'erreur
  if (licensesError) {
    return (
      <div className="space-y-6 mx-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('header.title')}</h1>
            <p className="text-gray-600">{t('header.subtitle')}</p>
          </div>
        </div>
        
        <div className="text-center py-16">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-600">{t('errors.loadTitle')}</h2>
          <p className="text-gray-500 mt-2 mb-4">{t('errors.loadDescription')}</p>
          <Button onClick={() => refetchLicenses()}>
            {t('actions.reload')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mx-4">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('header.title')}</h1>
          <p className="text-gray-600">{t('header.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {/* {permissions.canViewReports && ( */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
                  {isExporting ? t('actions.exporting') : t('actions.export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('exportMenu.excel')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('exportMenu.csv')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('exportMenu.json')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          
          {permissions.can('create', 'licenses') && (
            <Button onClick={() => router.push('/licenses/new')}>
              <Plus className="w-4 h-4 mr-2" />
              {t('actions.new')}
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('stats.total')}</p>
                <div className="text-3xl font-bold">
                  {stats.total}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('stats.active')}</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.active + stats.aboutToExpire}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('stats.aboutToExpire')}</p>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.aboutToExpire}
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('stats.expired')}</p>
                <div className="text-3xl font-bold text-red-600">
                  {stats.expired}
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          {/* Recherche et bouton de toggle */}
          <div className="space-y-4">
            {/* Recherche générale */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('filters.searchLabel')}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('filters.searchPlaceholder')}
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative shrink-0"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? t('filters.hideFiltersButton') : t('filters.showFiltersButton')}
                  {activeFiltersCount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Filtres conditionnels */}
            {showFilters && (
              <>
                {/* Filtres principaux */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('filters.statusLabel')}
                    </label>
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('filters.statusPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
                        <SelectItem value="active">{t('filters.statusActive')}</SelectItem>
                        <SelectItem value="about_to_expire">{t('filters.statusAboutToExpire')}</SelectItem>
                        <SelectItem value="expired">{t('filters.statusExpired')}</SelectItem>
                        <SelectItem value="cancelled">{t('filters.statusCancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {permissions.canViewAllData && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('filters.clientLabel')}
                      </label>
                      <Select value={clientFilter} onValueChange={handleClientFilterChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('filters.clientPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('filters.clientAll')}</SelectItem>
                          {isClientsLoading ? (
                            <SelectItem value="loading" disabled>{t('filters.loading')}</SelectItem>
                          ) : (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id!}>
                                {client.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('filters.editorLabel')}
                    </label>
                    <Input
                      placeholder={t('filters.editorPlaceholder')}
                      value={editorFilter}
                      onChange={(e) => handleEditorFilterChange(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('filters.typeLabel')}
                    </label>
                    <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('filters.typePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('filters.typeAll')}</SelectItem>
                        {isLicenseTypesLoading ? (
                          <SelectItem value="loading" disabled>{t('filters.loading')}</SelectItem>
                        ) : (
                          licenseTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filtres de dates */}
                <div className="border-t pt-4">
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('filters.expiryDateSectionTitle')}
                    </label>
                    <p className="text-xs text-gray-500">
                      {t('filters.expiryDateSectionDescription')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('filters.expiryDateStartLabel')}
                      </label>
                      <Input
                        type="date"
                        placeholder={t('filters.expiryDateStartPlaceholder')}
                        value={expiryDateStart}
                        onChange={(e) => handleExpiryDateStartChange(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('filters.expiryDateEndLabel')}
                      </label>
                      <Input
                        type="date"
                        placeholder={t('filters.expiryDateEndPlaceholder')}
                        value={expiryDateEnd}
                        onChange={(e) => handleExpiryDateEndChange(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch('')
                        setStatusFilter('all')
                        setClientFilter('all')
                        setEditorFilter('')
                        setTypeFilter('all')
                        setExpiryDateStart('')
                        setExpiryDateEnd('')
                        goToPage(1)
                      }}
                    >
                      {t('filters.resetButton')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('table.title')}</span>
            {isLicensesLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                {t('table.loading')}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LicenseTable 
            licenses={licenses} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onView={handleView}
            onCancel={handleCancel}
            onReactivate={handleReactivate}
          />

          {/* État vide */}
          {licenses.length === 0 && !isLicensesLoading && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('table.emptyTitle')}</h3>
              <p className="text-gray-500 mb-4">
                {search || statusFilter !== 'all' || clientFilter !== 'all' || editorFilter || typeFilter !== 'all' || expiryDateStart || expiryDateEnd ?
                  t('table.emptyFiltered') :
                  t('table.emptyDescription')
                }
              </p>
              {permissions.can('create', 'licenses') && !search && statusFilter === 'all' && clientFilter === 'all' && !editorFilter && typeFilter === 'all' && !expiryDateStart && !expiryDateEnd && (
                <Button onClick={() => router.push('/licenses/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('actions.new')}
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalLicenses > limit && pagination && (
            <div className="flex items-center justify-between mt-6">
              <PaginationInfo
                currentPage={page}
                itemsPerPage={limit}
                totalItems={totalLicenses}
              />
              <PaginationWithLogic
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
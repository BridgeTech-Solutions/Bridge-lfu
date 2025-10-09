'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Server,
  CreditCard,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthPermissions, usePagination } from '@/hooks'
import { useClients } from '@/hooks/useClients'
import { useEquipments } from '@/hooks/useEquipments'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes' 
import LucideIcon from '@/components/LucideIcon'
import { useTranslations } from '@/hooks/useTranslations'
import { PaginationInfo, PaginationWithLogic } from '@/components/ui/pagination'
import { Label } from '@/components/ui/label'

export default function EquipmentPage() {
  const { page, limit, goToPage } = usePagination(1);
  const { t: tList } = useTranslations('equipment.list')
  const { t: tStatus } = useTranslations('equipment.status')
  const router = useRouter()
  const permissions = useAuthPermissions()
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState('')
  const [typeIdFilter, setTypeIdFilter] = useState('') 
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ 
    open: boolean
    equipmentId: string | null
    equipmentName: string | null 
  }>({
    open: false,
    equipmentId: null,
    equipmentName: null
  })

  const { types: equipmentTypes, loading: loadingTypes } = useEquipmentTypes({ 
    activeOnly: true, 
    limit: 1000 
  })

  const { 
    equipment,
    loading: isLoading,
    error,
    stats,
    exportEquipment,
    isExporting,
    pagination,
    deleteEquipment,
    refreshStatuses,
    isDeleting,
    isRefreshing,
    refetch
  } = useEquipments({
    page,
    limit,
    search: searchTerm,
    status: selectedStatus,
    clientId: selectedClient,
    typeId: typeIdFilter || undefined
  })

  const { clients: clientsData } = useClients({
    page: 1,
    limit: 100
  })
  const clients = clientsData || []

  const handleExport = async (format: 'xlsx' | 'csv' | 'json' = 'xlsx') => {
    try {
      await exportEquipment({
        params: {
          search: searchTerm,
          status: selectedStatus,
          clientId: selectedClient,
          typeId: typeIdFilter || undefined
        },
        format
      })
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  // Fonction pour obtenir l'icône et la couleur du statut
  const getStatusDisplay = (status: string) => {
    const label = tStatus(status, status)
    
    switch (status) {
      case 'actif':
        return { icon: CheckCircle, color: 'success', label }
      case 'bientot_obsolete':
        return { icon: AlertTriangle, color: 'warning', label }
      case 'obsolete':
        return { icon: XCircle, color: 'destructive', label }
      case 'retire':
        return { icon: XCircle, color: 'retired', label, variant: 'retired' }
      case 'en_maintenance':
        return { icon: Clock, color: 'warning', label }
      default:
        return { icon: Server, color: 'default', label }
    }
  }

  // Fonction pour formater les dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // Fonction pour formater le coût
  const formatCost = (cost?: number) => {
    if (cost === undefined || cost === null) return 'N/A'
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XAF' 
    }).format(cost)
  }

  // Composant Skeleton
  const EquipmentSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  tList('table.headers.equipment'),
                  tList('table.headers.type'),
                  tList('table.headers.status'),
                  tList('table.headers.obsolescence'),
                  tList('table.headers.cost'),
                  tList('table.headers.actions')
                ].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(limit)].map((_, index) => (
                <tr key={index} className="h-16">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-gray-200 mr-3"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-8 w-8 ml-auto bg-gray-200 rounded-full"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-60"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
            <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  )

  // Réinitialiser la page quand les filtres changent
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    goToPage(1); // Plus cohérent avec Licenses
  };
  
  // Handler pour le type d'équipement
  const handleTypeFilterChange = (value: string) => {
    setTypeIdFilter(value); 
    goToPage(1); // Plus cohérent avec Licenses
  };
  
  // Handler pour le statut
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    goToPage(1); // Plus cohérent avec Licenses
  };
  
  // Handler pour le client
  const handleClientChange = (value: string) => {
    setSelectedClient(value);
    goToPage(1); // Plus cohérent avec Licenses
  };
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchTerm) count++
    if (typeIdFilter) count++
    if (selectedStatus) count++
    if (selectedClient) count++
    return count
  }, [searchTerm, typeIdFilter, selectedStatus, selectedClient])

  const totalCost = useMemo(
    () => equipment.reduce((sum, item) => sum + (item.cost ?? 0), 0),
    [equipment]
  )
  
  const formattedTotalCost = useMemo(() => formatCost(totalCost), [totalCost])
  
  const kpiCards = useMemo(
    () => [
      {
        title: tList('stats.total.title'),
        value: stats.total,
        description: tList('stats.total.description'),
        icon: Server,
        accent: 'bg-blue-50 text-blue-600',
      },
      {
        title: tList('stats.maintenance.title'),
        value: stats.en_maintenance,
        description: tList('stats.maintenance.description'),
        icon: Wrench,
        accent: 'bg-amber-50 text-amber-600',
      },
      {
        title: tList('stats.soonObsolete.title'),
        value: stats.bientot_obsolete,
        description: tList('stats.soonObsolete.description'),
        icon: AlertTriangle,
        accent: 'bg-orange-50 text-orange-600',
      },
      {
        title: tList('stats.totalCost.title'),
        value: formattedTotalCost,
        description: tList('stats.totalCost.description'),
        icon: CreditCard,
        accent: 'bg-emerald-50 text-emerald-600',
      },
    ],
    [stats, formattedTotalCost, tList]
  )

  // Fonctions de gestion
  const handleDeleteEquipment = (equipmentId: string, equipmentName: string) => {
    setDeleteDialog({ open: true, equipmentId, equipmentName })
  }

  const confirmDelete = async () => {
    if (deleteDialog.equipmentId) {
      try {
        await deleteEquipment(deleteDialog.equipmentId)
        setDeleteDialog({ open: false, equipmentId: null, equipmentName: null })
      } catch (error) {
        // L'erreur est déjà gérée par le hook
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTypeIdFilter('')
    setSelectedStatus('')
    setSelectedClient('')
  }

  const handleRefreshStatus = async () => {
    try {
      await refreshStatuses()
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="h-12 w-12 mx-auto mb-2" />
            <p>{tList('errors.load')}</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <Button onClick={() => refetch()}>
            {tList('errors.retry')}
          </Button>
        </div>
      </div>
    )
  }

  const countText = tList('count')
    .replace('{{count}}', String(pagination?.count || 0))
    .replace('{{plural}}', (pagination?.count || 0) !== 1 ? 's' : '')

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tList('title')}</h1>
          <p className="text-gray-600 mt-1">
            {tList('subtitle')} {countText}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {permissions.can('update', 'equipment') && (
            <Button
              onClick={handleRefreshStatus}
              variant="outline"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {tList('actions.refresh')}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? tList('actions.exporting') : tList('actions.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                <Download className="h-4 w-4 mr-2" />
                {tList('actions.exportExcel')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                {tList('actions.exportCsv')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                {tList('actions.exportJson')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {permissions.can('create', 'equipment') && (
            <Button onClick={() => router.push('/equipment/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {tList('actions.create')}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white border rounded-lg shadow-sm p-4 flex items-start justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {typeof card.value === 'number'
                    ? card.value.toLocaleString('fr-FR')
                    : card.value}
                </p>
                {card.description && (
                  <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                )}
              </div>
              <div className={`p-3 rounded-full ${card.accent}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={tList('search.placeholder')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            {tList('search.filters')}
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <Label htmlFor="type-filter">{tList('filters.type.label')}</Label>
              <select
                id="type-filter"
                value={typeIdFilter}
                onChange={(event) => handleTypeFilterChange(event.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                disabled={loadingTypes}
              >
                <option value="">{tList('filters.type.all')}</option>
                {equipmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="status-filter">{tList('filters.status.label')}</Label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">{tList('filters.status.label')}</option>
                <option value="actif">{tList('filters.status.options.actif')}</option>
                <option value="en_maintenance">{tList('filters.status.options.en_maintenance')}</option>
                <option value="bientot_obsolete">{tList('filters.status.options.bientot_obsolete')}</option>
                <option value="obsolete">{tList('filters.status.options.obsolete')}</option>
                <option value="retire">{tList('filters.status.options.retire')}</option>
              </select>
            </div>

            {permissions.canViewAllData() && (
              <div>
                <Label htmlFor="client-filter">{tList('filters.client.label')}</Label>
                <select
                  id="client-filter"
                  value={selectedClient}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">{tList('filters.client.all')}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                className="w-full"
              >
                {tList('filters.clear')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tableau des équipements */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <EquipmentSkeleton />
        ) : equipment.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tList('table.empty.title')}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeFiltersCount > 0 
                ? tList('table.empty.descriptionFiltered')
                : tList('table.empty.descriptionNoFilters')
              }
            </p>
            {permissions.can('create', 'equipment') && (
              <Button onClick={() => router.push('/equipment/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {tList('table.empty.action')}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tList('table.headers.equipment')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tList('table.headers.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tList('table.headers.status')}
                  </th>
                  {permissions.canViewAllData() && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tList('table.headers.client')}
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tList('table.headers.obsolescence')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tList('table.headers.cost')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {tList('table.headers.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipment.map((item) => {
                  const statusDisplay = getStatusDisplay(item.status)
                  const StatusIcon = statusDisplay.icon
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <LucideIcon 
                            name={item.type_icon} 
                            size={25} 
                            className="mr-1"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.brand} {item.model}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {item.type_name || 'Non défini'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          variant={statusDisplay.color as any}
                          className="flex items-center w-fit text-white"
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusDisplay.label}
                        </Badge>
                      </td>

                      {permissions.canViewAllData() && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {item.client_name || 'N/A'}
                          </span>
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatDate(item.estimated_obsolescence_date)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatCost(item.cost)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/equipment/${item.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {tList('table.dropdown.view')}
                            </DropdownMenuItem>
                            
                            {permissions.can('update', 'equipment', item) && (
                              <DropdownMenuItem onClick={() => router.push(`/equipment/${item.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {tList('table.dropdown.edit')}
                              </DropdownMenuItem>
                            )}
                            
                            {permissions.can('delete', 'equipment', item) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteEquipment(item.id, item.name)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {tList('table.dropdown.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(pagination?.count || 0) > limit && pagination && (
          <div className="flex items-center justify-between mt-6">
            <PaginationInfo
              currentPage={page}
              itemsPerPage={limit}
              totalItems={pagination?.count || 0}
            />
            <PaginationWithLogic
              currentPage={page}
              totalPages={pagination?.totalPages || 1}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tList('deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {tList('deleteDialog.description').replace('{{name}}', deleteDialog.equipmentName || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, equipmentId: null, equipmentName: null })}
              disabled={isDeleting}
            >
              {tList('deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? tList('deleteDialog.deleting') : tList('deleteDialog.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
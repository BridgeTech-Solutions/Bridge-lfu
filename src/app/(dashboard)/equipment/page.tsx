'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Server
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useAuthPermissions } from '@/hooks'
import {  useClients } from '@/hooks/useClients'
import { useEquipments } from '@/hooks/useEquipments'

export default function EquipmentPage() {
  const router = useRouter()
  const permissions = useAuthPermissions()
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; equipmentId: string | null; equipmentName: string | null }>({
    open: false,
    equipmentId: null,
    equipmentName: null
  })

  // Utilisation du hook useEquipments
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
    type: selectedType
  })

  // Récupération des clients pour le filtre
  const {     clients: clientsData } = useClients({
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
        type: selectedType
      },
      format
    })
  } catch (error) {
    // L'erreur est déjà gérée par le hook
  }
}
  // Fonction pour obtenir l'icône et la couleur du statut
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'actif':
        return { icon: CheckCircle, color: 'success', label: 'Actif' }
        return { icon: Clock, color: 'warning', label: 'En maintenance' }
      case 'bientot_obsolete':
        return { icon: AlertTriangle, color: 'warning', label: 'Bientôt obsolète' }
      case 'obsolete':
        return { icon: XCircle, color: 'destructive', label: 'Obsolète' }
      case 'retire':
        return { icon: XCircle, color: 'retired', label: 'Retiré', variant: 'retired' }
      default:
        return { icon: Server, color: 'default', label: status }
    }
  }

// {{ ... }}
  // Fonction pour obtenir l'icône du type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pc':
        return '💻'
      case 'serveur':
        return '🖥️'
      case 'routeur':
        return '📡'
      case 'switch':
        return '🔀'
      case 'imprimante':
        return '🖨️'
      default:
        return '⚙️'
    }
  }

  // Fonction pour formater les dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // Fonction pour formater le coût
  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A'
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XAF' 
    }).format(cost)
  }
  // composant Skeleton
  const EquipmentSkeleton = () => (
    <div className="space-y-6 animate-pulse">


      {/* Squelette du Tableau */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Squelette de l'en-tête du tableau */}
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Équipement', 'Type', 'Statut', 'Obsolescence', 'Coût', 'Actions'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            {/* Squelette des lignes du tableau */}
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(limit)].map((_, index) => ( // Utiliser 'limit' (10) pour simuler 10 lignes
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

      {/* Squelette de la pagination */}
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
  );
  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1)
  }, [searchTerm, selectedType, selectedStatus, selectedClient])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchTerm) count++
    if (selectedType) count++
    if (selectedStatus) count++
    if (selectedClient) count++
    return count
  }, [searchTerm, selectedType, selectedStatus, selectedClient])

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
    setSelectedType('')
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
            <p>Erreur lors du chargement des équipements</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <Button onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipements</h1>
          <p className="text-gray-600 mt-1">
            Gestion des équipements informatiques ({pagination?.count || 0} équipement{(pagination?.count || 0) !== 1 ? 's' : ''})
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
              Rafraîchir statuts
            </Button>
          )}
          

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? 'Export en cours...' : 'Exporter'}
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          {permissions.can('create', 'equipment') && (
            <Button onClick={() => router.push('/equipment/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel équipement
            </Button>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, marque, modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            Filtres
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
              <Label htmlFor="type-filter">Type</Label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous les types</option>
                <option value="pc">PC</option>
                <option value="serveur">Serveur</option>
                <option value="routeur">Routeur</option>
                <option value="switch">Switch</option>
                <option value="imprimante">Imprimante</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status-filter">Statut</Label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="en_maintenance">En maintenance</option>
                <option value="bientot_obsolete">Bientôt obsolète</option>
                <option value="obsolete">Obsolète</option>
                <option value="retire">Retiré</option>
              </select>
            </div>

            {permissions.canViewAllData() && (
              <div>
                <Label htmlFor="client-filter">Client</Label>
                <select
                  id="client-filter"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
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

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                className="w-full"
              >
                Réinitialiser
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun équipement trouvé</h3>
            <p className="text-gray-600 mb-4">
              {activeFiltersCount > 0 
                ? "Aucun équipement ne correspond à vos critères de recherche."
                : "Commencez par ajouter votre premier équipement."
              }
            </p>
            {permissions.can('create', 'equipment') && (
              <Button onClick={() => router.push('/equipment/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un équipement
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Équipement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  {permissions.canViewAllData() && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obsolescence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                          <span className="text-2xl mr-3">{getTypeIcon(item.type)}</span>
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
                          {item.type}
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
                              Voir détails
                            </DropdownMenuItem>
                            
                            {permissions.can('update', 'equipment', item) && (
                              <DropdownMenuItem onClick={() => router.push(`/equipment/${item.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
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
                                  Supprimer
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
        {equipment.length > 0 && pagination && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, pagination.count)} sur {pagination.count} résultats
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Précédent
                </Button>
                
                <span className="text-sm text-gray-700">
                  Page {page} sur {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;équipement &quot;{deleteDialog.equipmentName}&quot; ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, equipmentId: null, equipmentName: null })}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
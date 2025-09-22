'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { toast } from 'sonner'

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

// Types pour les équipements
interface Equipment {
  id: string
  name: string
  type: 'pc' | 'serveur' | 'routeur' | 'switch' | 'imprimante' | 'autre'
  brand?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  warranty_end_date?: string
  estimated_obsolescence_date?: string
  status: 'actif' | 'en_maintenance' | 'obsolete' | 'bientot_obsolete' | 'retire'
  cost?: number
  location?: string
  description?: string
  client_id: string
  client_name?: string
  created_at: string
  updated_at: string
}

interface EquipmentResponse {
  data: Equipment[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

interface Client {
  id: string
  name: string
}

export default function EquipmentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const permissions = useAuthPermissions()
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; equipment: Equipment | null }>({
    open: false,
    equipment: null
  })

  // Récupération des clients pour le filtre
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Erreur lors de la récupération des clients')
      const data = await response.json()
      return data.data || []
    },
    enabled: permissions.canViewAllData()
  })

  // Récupération des équipements
  const { 
    data: equipmentData, 
    isLoading, 
    error,
    refetch 
  } = useQuery<EquipmentResponse>({
    queryKey: ['equipment', { 
      search: searchTerm, 
      type: selectedType, 
      status: selectedStatus,
      client_id: selectedClient,
      page, 
      limit 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedType) params.append('type', selectedType)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedClient) params.append('client_id', selectedClient)

      const response = await fetch(`/api/equipment?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des équipements')
      }
      return response.json()
    }
  })

  // Mutation pour supprimer un équipement
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la suppression')
      }
    },
    onSuccess: () => {
      toast.success('Équipement supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      setDeleteDialog({ open: false, equipment: null })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  })

  // Mutation pour rafraîchir les statuts
  const refreshStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/equipment/refresh-status', {
        method: 'PUT'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors du rafraîchissement')
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Statuts mis à jour')
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du rafraîchissement')
    }
  })

  // Fonction pour obtenir l'icône et la couleur du statut
  const getStatusDisplay = (status: Equipment['status']) => {
    switch (status) {
      case 'actif':
        return { icon: CheckCircle, color: 'success', label: 'Actif' }
      case 'en_maintenance':
        return { icon: Clock, color: 'warning', label: 'En maintenance' }
      case 'bientot_obsolete':
        return { icon: AlertTriangle, color: 'warning', label: 'Bientôt obsolète' }
      case 'obsolete':
        return { icon: XCircle, color: 'destructive', label: 'Obsolète' }
      case 'retire':
        return { icon: XCircle, color: 'secondary', label: 'Retiré' }
      default:
        return { icon: Server, color: 'default', label: status }
    }
  }

  // Fonction pour obtenir l'icône du type
  const getTypeIcon = (type: Equipment['type']) => {
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

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1)
  }, [searchTerm, selectedType, selectedStatus, selectedClient])

  // Calculs dérivés
  const equipment = equipmentData?.data || []
  const totalCount = equipmentData?.count || 0
  const totalPages = equipmentData?.totalPages || 1

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchTerm) count++
    if (selectedType) count++
    if (selectedStatus) count++
    if (selectedClient) count++
    return count
  }, [searchTerm, selectedType, selectedStatus, selectedClient])

  // Fonctions de gestion
  const handleDeleteEquipment = (equipment: Equipment) => {
    setDeleteDialog({ open: true, equipment })
  }

  const confirmDelete = () => {
    if (deleteDialog.equipment) {
      deleteEquipmentMutation.mutate(deleteDialog.equipment.id)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('')
    setSelectedStatus('')
    setSelectedClient('')
  }

  const handleRefreshStatus = () => {
    refreshStatusMutation.mutate()
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Erreur lors du chargement des équipements</p>
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
            Gestion des équipements informatiques ({totalCount} équipement{totalCount !== 1 ? 's' : ''})
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {permissions.can('update', 'equipment') && (
            <Button
              onClick={handleRefreshStatus}
              variant="outline"
              disabled={refreshStatusMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshStatusMutation.isPending ? 'animate-spin' : ''}`} />
              Rafraîchir statuts
            </Button>
          )}
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          
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
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Chargement des équipements...</p>
          </div>
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
              <Button onClick={() => router.push('/equipment/create')}>
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
                          className="flex items-center w-fit"
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
                                  onClick={() => handleDeleteEquipment(item)}
                                  variant="destructive"
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
        {equipment.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, totalCount)} sur {totalCount} résultats
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
                  Page {page} sur {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
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
              Êtes-vous sûr de vouloir supprimer l&apos;équipement &quot;{deleteDialog.equipment?.name}&quot; ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, equipment: null })}
              disabled={deleteEquipmentMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteEquipmentMutation.isPending}
            >
              {deleteEquipmentMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState, useCallback } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Monitor, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaginationWithLogic } from '@/components/ui/pagination'
import { useDebounce, usePagination, useAuthPermissions } from '@/hooks'
import { useSupabase } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import type { EquipmentWithClientView, EquipmentType, EquipmentStatus } from '@/types'

interface EquipmentTableProps {
  equipment: EquipmentWithClientView[]
  onEdit: (equipment: EquipmentWithClientView) => void
  onDelete: (equipment: EquipmentWithClientView) => void
  onView: (equipment: EquipmentWithClientView) => void
}

function EquipmentTable({ equipment, onEdit, onDelete, onView }: EquipmentTableProps) {
  const permissions = useAuthPermissions()

  const getStatusBadge = (status: EquipmentStatus | null) => {
    const statusConfig = {
      'actif': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Actif' },
      'en_maintenance': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, label: 'En maintenance' },
      'obsolete': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Obsolète' },
      'bientot_obsolete': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle, label: 'Bientôt obsolète' },
      'retire': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, label: 'Retiré' }
    }

    if (!status) return null

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: EquipmentType | null) => {
    const typeIcons = {
      'pc': '💻',
      'serveur': '🖥️',
      'routeur': '📡',
      'switch': '🔀',
      'imprimante': '🖨️',
      'autre': '⚙️'
    }

    return typeIcons[type as keyof typeof typeIcons] || '⚙️'
  }

  const getTypeLabel = (type: EquipmentType | null) => {
    const typeLabels = {
      'pc': 'PC',
      'serveur': 'Serveur',
      'routeur': 'Routeur',
      'switch': 'Switch',
      'imprimante': 'Imprimante',
      'autre': 'Autre'
    }

    return typeLabels[type as keyof typeof typeLabels] || 'Autre'
  }

  const getDaysUntilObsolescence = (obsolescenceDate: string | null) => {
    if (!obsolescenceDate) return null
    
    const today = new Date()
    const obsolescence = new Date(obsolescenceDate)
    const diffTime = obsolescence.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XAF' 
    }).format(amount)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Équipement</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Obsolescence</TableHead>
            <TableHead>Coût</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="text-gray-500">
                  <Monitor className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Aucun équipement trouvé</p>
                  <p className="text-sm mt-1">Ajoutez votre premier équipement pour commencer</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            equipment.map((item) => {
              const daysUntilObsolescence = getDaysUntilObsolescence(item.estimated_obsolescence_date)
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.brand && item.model 
                            ? `${item.brand} ${item.model}`
                            : item.brand || item.model || 'Modèle non spécifié'
                          }
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {item.client_name || 'Non assigné'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {getTypeLabel(item.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {item.estimated_obsolescence_date && (
                        <div className="text-sm">
                          {new Date(item.estimated_obsolescence_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {daysUntilObsolescence !== null && (
                        <div className={`text-xs flex items-center gap-1 ${
                          daysUntilObsolescence < 0 ? 'text-red-500' :
                          daysUntilObsolescence <= 90 ? 'text-orange-500' :
                          'text-gray-500'
                        }`}>
                          {daysUntilObsolescence < 0 && <XCircle className="h-3 w-3" />}
                          {daysUntilObsolescence >= 0 && daysUntilObsolescence <= 90 && <AlertTriangle className="h-3 w-3" />}
                          {daysUntilObsolescence < 0 
                            ? `Obsolète depuis ${Math.abs(daysUntilObsolescence)} jour(s)`
                            : `Dans ${daysUntilObsolescence} jour(s)`
                          }
                        </div>
                      )}
                      {item.end_of_sale && (
                        <div className="text-xs text-gray-500 mt-1">
                          Fin vente: {new Date(item.end_of_sale).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(item.cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        {permissions.can('update', 'equipment') && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {permissions.can('delete', 'equipment') && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(item)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const { page, limit, goToPage } = usePagination()
  const permissions = useAuthPermissions()
  const supabase = useSupabase()

  // Récupération des clients pour les filtres
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-equipment-filter'],
    queryFn: async () => {
      let query = supabase.from('clients').select('id, name')
      
      // if (!permissions.canViewAllData()) {
      //   const clientAccess = permissions.getPermissions().clientAccess
      //   if (clientAccess) {
      //     query = query.eq('id', clientAccess)
      //   }
      // }
 if (!permissions.canViewAllData()) {
  const allPermissions = permissions.getPermissions();

  // Vérifiez si 'clientAccess' existe avant de l'utiliser
  if (allPermissions && 'clientAccess' in allPermissions) {
    const clientAccess = allPermissions.clientAccess;
    if (clientAccess) {
      query = query.eq('id', clientAccess);
    }
  }
}     
      const { data, error } = await query.order('name')
      if (error) throw error
      return data || []
    }
  })

  // Fonction pour récupérer les équipements
  const fetchEquipment = useCallback(async () => {
    let query = supabase
      .from('v_equipment_with_client')
      .select('*', { count: 'exact' })

    // Permissions
if (!permissions.canViewAllData()) {
  const allPermissions = permissions.getPermissions();

  // Vérifiez si 'clientAccess' existe avant de l'utiliser
  if (allPermissions && 'clientAccess' in allPermissions) {
    const clientAccess = allPermissions.clientAccess;
    if (clientAccess) {
      query = query.eq('id', clientAccess);
    }
  }
}
    // Filtres de recherche
    if (debouncedSearch) {
      query = query.or(`name.ilike.%${debouncedSearch}%,brand.ilike.%${debouncedSearch}%,model.ilike.%${debouncedSearch}%`);
    }

    if (selectedClient && selectedClient !== 'all-clients') {
      query = query.eq('client_id', selectedClient);
    }

    if (selectedType && selectedType !== 'all-types') {
      query = query.eq('type', selectedType);
    }

    if (selectedStatus && selectedStatus !== 'all-statuses') {
      query = query.eq('status', selectedStatus);
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)
    query = query.order('estimated_obsolescence_date', { ascending: true, nullsFirst: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Erreur lors du chargement des équipements: ${error.message}`)
    }

    return {
      equipment: (data || []).filter(item => item.id !== null) as EquipmentWithClientView[],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }, [supabase, debouncedSearch, selectedClient, selectedType, selectedStatus, page, limit, permissions])

  // Query React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['equipment', debouncedSearch, selectedClient, selectedType, selectedStatus, page, limit],
    queryFn: fetchEquipment,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleEdit = (equipment: EquipmentWithClientView) => {
    console.log('Éditer équipement:', equipment)
  }

  const handleDelete = async (equipment: EquipmentWithClientView) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipement "${equipment.name}" ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', equipment.id)

      if (error) throw error

      refetch()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression de l\'équipement')
    }
  }

  const handleView = (equipment: EquipmentWithClientView) => {
    console.log('Voir équipement:', equipment)
  }

  const handleCreateEquipment = () => {
    console.log('Créer nouvel équipement')
  }

  if (error) {
    return (
      <div className="container mx-auto px-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
          <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipements</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre parc informatique et suivez l&apos;obsolescence
          </p>
        </div>
        {permissions.can('create', 'equipment') && (
          <Button onClick={handleCreateEquipment}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel équipement
          </Button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un équipement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tous les clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-clients">Tous les clients</SelectItem>
              {clientsData?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">Tous les types</SelectItem>
              <SelectItem value="pc">PC</SelectItem>
              <SelectItem value="serveur">Serveur</SelectItem>
              <SelectItem value="routeur">Routeur</SelectItem>
              <SelectItem value="switch">Switch</SelectItem>
              <SelectItem value="imprimante">Imprimante</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">Tous les statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="en_maintenance">En maintenance</SelectItem>
              <SelectItem value="bientot_obsolete">Bientôt obsolète</SelectItem>
              <SelectItem value="obsolete">Obsolète</SelectItem>
              <SelectItem value="retire">Retiré</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">
            {data?.totalCount || 0}
          </div>
          <div className="text-sm text-gray-600">Total équipements</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {data?.equipment.filter(e => e.status === 'actif').length || 0}
          </div>
          <div className="text-sm text-gray-600">Actifs</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">
            {data?.equipment.filter(e => e.status === 'en_maintenance').length || 0}
          </div>
          <div className="text-sm text-gray-600">En maintenance</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">
            {data?.equipment.filter(e => e.status === 'bientot_obsolete').length || 0}
          </div>
          <div className="text-sm text-gray-600">Bientôt obsolètes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">
            {data?.equipment.filter(e => e.status === 'obsolete').length || 0}
          </div>
          <div className="text-sm text-gray-600">Obsolètes</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <EquipmentTable
            equipment={data?.equipment || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="border-t p-4">
            <PaginationWithLogic
              currentPage={page}
              totalPages={data.totalPages}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
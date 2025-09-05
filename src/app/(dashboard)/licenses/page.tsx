'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Filter, Download, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PaginationWithLogic, PaginationInfo } from '@/components/ui/pagination'
import { toast } from 'sonner';
import { 
  useStablePermissions, 
  useLicenses, 
  useLicenseStats, 
  useClients, 
  usePagination, 
  useDebounce 
} from '@/hooks'
import type { LicenseStatus } from '@/types'
import { LicenseTable } from '@/components/tables/LicenseTable';

export default function LicensesPage() {
  const router = useRouter()
  const permissions = useStablePermissions()
  const { page, limit, goToPage } = usePagination(1, 10)

  // États des filtres
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'all'>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [editorFilter, setEditorFilter] = useState('')

  // Valeurs débouncées pour éviter les requêtes excessives
  const debouncedSearch = useDebounce(search, 500)
  const debouncedEditorFilter = useDebounce(editorFilter, 500)

  // Utilisation des hooks de données avec React Query
  const { 
    licenses, 
    loading: isLicensesLoading, 
    error: licensesError, 
    pagination,
    refetch: refetchLicenses 
  } = useLicenses({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter,
    clientId: clientFilter === 'all' ? undefined : clientFilter,
    editor: debouncedEditorFilter
  });
  
  const { 
    data: clientsData, 
    isLoading: isClientsLoading 
  } = useClients({
    page: 1,
    limit: 999, // On charge tous les clients pour les filtres
    search: '',
    sector: ''
  });

  const { 
    stats, 
    loading: isStatsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useLicenseStats();

  // Gestion de l'export
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status: statusFilter,
        clientId: clientFilter,
        editor: debouncedEditorFilter
      });
      
      const response = await fetch(`/api/licenses/export?${params}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de l'exportation des données.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `licenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Le fichier a été téléchargé avec succès.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'exporter les données.");
    }
  };

  // Gestionnaires d'événements du tableau
  const handleEdit = (id: string) => router.push(`/licenses/${id}/edit`);
  const handleDelete = (id: string) => toast.error("La suppression n'est pas encore implémentée.");
  const handleView = (id: string) => router.push(`/licenses/${id}`);

  // Données traitées
  const clients = clientsData?.data || [];
  const totalLicenses = pagination?.count || 0;
  const statsData = stats || { 
    total: 0, 
    byStatus: {}, 
    totalValue: 0, 
    monthlyExpiry: [], 
    chartData: { statuses: [], expiry: [] } 
  };

  // Gestion des changements de filtres avec retour à la page 1
  const handleSearchChange = (value: string) => {
    setSearch(value);
    goToPage(1);
  };

  const handleStatusFilterChange = (value: LicenseStatus | 'all') => {
    setStatusFilter(value);
    goToPage(1);
  };

  const handleClientFilterChange = (value: string) => {
    setClientFilter(value);
    goToPage(1);
  };

  const handleEditorFilterChange = (value: string) => {
    setEditorFilter(value);
    goToPage(1);
  };

  // Affichage du loading global
  if (isLicensesLoading && page === 1) {
    return (
      <div className="space-y-6 mx-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Licences</h1>
            <p className="text-gray-600">Gestion des licences logicielles et matérielles</p>
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
    );
  }

  // Affichage en cas d'erreur
  if (licensesError) {
    return (
      <div className="space-y-6 mx-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Licences</h1>
            <p className="text-gray-600">Gestion des licences logicielles et matérielles</p>
          </div>
        </div>
        
        <div className="text-center py-16">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-600">Erreur de chargement</h2>
          <p className="text-gray-500 mt-2 mb-4">
            Une erreur est survenue lors de la récupération des licences.
          </p>
          <Button onClick={() => refetchLicenses()}>
            Recharger les données
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-4">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Licences</h1>
          <p className="text-gray-600">Gestion des licences logicielles et matérielles</p>
        </div>
        <div className="flex gap-2">
          {permissions.canViewReports && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
          {permissions.can('create', 'licenses') && (
            <Button onClick={() => router.push('/licenses/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle licence
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
                <p className="text-sm font-medium text-gray-600">Total</p>
                <div className="text-3xl font-bold">
                  {isStatsLoading ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    statsData.total
                  )}
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
                <p className="text-sm font-medium text-gray-600">Actives</p>
                <p className="text-3xl font-bold text-green-600">
                  {isStatsLoading ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    statsData.byStatus.active || 0
                  )}
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
                <p className="text-sm font-medium text-gray-600">Bientôt expirées</p>
                <div className="text-3xl font-bold text-orange-600">
                  {isStatsLoading ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    statsData.byStatus.about_to_expire || 0
                  )}
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
                <p className="text-sm font-medium text-gray-600">Expirées</p>
                <div className="text-3xl font-bold text-red-600">
                  {isStatsLoading ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    statsData.byStatus.expired || 0
                  )}
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher une licence..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="about_to_expire">Bientôt expirées</SelectItem>
                <SelectItem value="expired">Expirées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>

            {permissions.canViewAllData && (
              <Select value={clientFilter} onValueChange={handleClientFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {isClientsLoading ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id!}>
                        {client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}

            <Input
              placeholder="Éditeur..."
              value={editorFilter}
              onChange={(e) => handleEditorFilterChange(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Liste des licences</span>
            {isLicensesLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Chargement...
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
          />

          {/* État vide */}
          {licenses.length === 0 && !isLicensesLoading && (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune licence</h3>
              <p className="text-gray-500 mb-4">
                {debouncedSearch || statusFilter !== 'all' || clientFilter !== 'all' || debouncedEditorFilter ?
                  'Aucune licence ne correspond aux critères de recherche.' :
                  'Commencez par ajouter votre première licence.'
                }
              </p>
              {permissions.can('create', 'licenses') && !debouncedSearch && statusFilter === 'all' && clientFilter === 'all' && !debouncedEditorFilter && (
                <Button onClick={() => router.push('/licenses/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une licence
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalLicenses > limit && (
            <div className="flex items-center justify-between mt-6">
              <PaginationInfo
                currentPage={page}
                itemsPerPage={limit}
                totalItems={totalLicenses}
              />
              <PaginationWithLogic
                currentPage={page}
                totalPages={Math.ceil(totalLicenses / limit)}
                onPageChange={goToPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}  
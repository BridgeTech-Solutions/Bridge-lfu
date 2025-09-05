import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSupabase as createSupabaseClient} from '@/lib/supabase/client'
import { usePermissions } from '@/lib/auth/permissions'
import { useQuery } from '@tanstack/react-query'

import type { 
  Profile, 
  Client, 
  License, 
  Equipment, 
  DashboardAlert, 
  DashboardStats,
  PaginatedResponse,
  PaginationParams, 
  LicenseStats,
  EquipmentStats,
  LicenseStatus,
  LicenseWithClientView
} from '@/types'
import { useAuth } from './useAuth';
usePermissions
// Hook pour les permissions - STABILISÉ
import { useSession } from '@/app/context/auth'

export function useAuthPermissions() {
  // Utilisez le hook useSession pour obtenir l'utilisateur et le statut de chargement.
  const { user, loading } = useSession();

  // Si le contexte est toujours en cours de chargement,
  // ou si aucun utilisateur n'est connecté, retournez les permissions par défaut.
  if (loading || !user) {
    return {
      can: () => false,
      canAccessClient: () => false,
      canViewAllData: () => false,
      canManageUsers: () => false,
      canViewActivityLogs: () => false,
      canExportReports: () => false,
      // Changez cette ligne pour retourner un objet de permissions complet
      getPermissions: () => ({
        canManageClients: false,
        canManageLicenses: false,
        canManageEquipment: false,
        canViewReports: false,
        canManageUsers: false,
        canViewAllData: false,
        clientAccess: undefined, // L'accès au client est indéfini
      }),
    };
  }
  // Le hook useSession fournit l'objet utilisateur, qui contient déjà le profil
  // si votre AuthProvider est correctement configuré.
  // Vous n'avez pas besoin de "fusionner" les deux objets.
  const mergedUser = {
    id: user.id,
    email: user.email ?? '',
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null, // Utilisez les données de user
    
    // Champs spécifiques au profil, directement accessibles sur l'objet user
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    phone: user.phone ?? null,
    company: user.company ?? null,
    client_id: user.client_id ?? null,
    role: user.role ?? 'unverified',
  };

  // Utilisez le hook usePermissions avec l'objet utilisateur fusionné
  // Note : L'ESLint-disable n'est plus nécessaire ici car la logique de chargement
  // gère le retour du hook de manière conditionnelle et non réactive.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePermissions(mergedUser);
}

// NOUVEAU : Hook de permissions ultra-stabilisé
export function useStablePermissions() {
  const permissions = useAuthPermissions()
  
  // Mémoriser les valeurs primitives plutôt que les objets
  const canViewAllData = useMemo(() => permissions.canViewAllData(), [permissions])
  const clientAccess = useMemo(() => permissions.getPermissions().clientAccess, [permissions])
  
  return useMemo(() => ({
    canViewAllData,
    clientAccess,
    canManageClients: permissions.can('create', 'clients') || permissions.can('update', 'clients'),
    canManageLicenses: permissions.can('create', 'licenses') || permissions.can('update', 'licenses'),
    canManageEquipment: permissions.can('create', 'equipment') || permissions.can('update', 'equipment'),
    canViewReports: permissions.can('read', 'reports'),
    can: permissions.can
  }), [canViewAllData, clientAccess, permissions.can])
}

// NOUVELLE FONCTION : Fetch pour les licences avec React Query
// Nouvelle version avec l'API
const fetchLicenses = async (
  params: PaginationParams & {
    clientId?: string;
    search?: string;
    status?: string;
    editor?: string;
  },
  permissions: ReturnType<typeof useStablePermissions>
): Promise<PaginatedResponse<LicenseWithClientView>> => {
  // Construction des paramètres de l'URL pour la requête GET
  const urlParams = new URLSearchParams();
  const page = params.page || 1;
  const limit = params.limit || 10;

  urlParams.append('page', page.toString());
  urlParams.append('limit', limit.toString());

  if (params.search) {
    urlParams.append('search', params.search);
  }
  if (params.clientId) {
    urlParams.append('client_id', params.clientId);
  }
  if (params.status && params.status !== 'all') {
    urlParams.append('status', params.status);
  }
  if (params.editor) {
    urlParams.append('editor', params.editor);
  }
  // Les filtres basés sur les permissions utilisateur sont gérés côté API

  try {
    const response = await fetch(`/api/licenses?${urlParams.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des licences');
    }

    const { data, count } = await response.json();

    // Correction ici : Ajoutez les propriétés page, limit et total_pages
    return {
      data: data || [],
      count: count || 0,
      page: page,
      limit: limit,
      total_pages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des licences:', error);
    throw error;
  }
};
// Nouvelle version
export function useLicenses(params: PaginationParams & {
  clientId?: string;
  search?: string;
  status?: string;
  editor?: string;
}) {
  // Remplacez useCurrentUser par useSession
  const { user, loading } = useSession()
  const permissions = useStablePermissions()
  
  const queryKey = [
    'licenses',
    params.page,
    params.limit,
    params.clientId,
    params.search,
    params.status,
    params.editor,
    permissions.canViewAllData,
    permissions.clientAccess,
    user?.id // Important : inclure l'ID de l'utilisateur pour invalider le cache lors du changement d'utilisateur
  ]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchLicenses(params, permissions),
    // Utiliser `!!user` et `!loading` pour activer la requête
    enabled: !!user && !loading,
  })

  return {
    licenses: data?.data || [],
    loading: isLoading,
    error: isError ? (error as Error).message : null,
    pagination: {
      count: data?.count || 0,
      page: params.page || 1,
      totalPages: Math.ceil((data?.count || 0) / (params.limit || 10))
    },
    refetch
  }
}

// NOUVELLE FONCTION : Fetch pour une licence spécifique
const fetchLicenseById = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  id: string
): Promise<LicenseWithClientView> => {
  const { data, error } = await supabase
    .from('v_licenses_with_client')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// NOUVEAU : Hook pour récupérer une licence spécifique
export function useLicense(id: string) {
  const { user, loading } = useSession() // <--- Remplacer useAuth() par useSession()
  const supabase = createSupabaseClient()

  return useQuery({
    queryKey: ['license', id],
    queryFn: () => fetchLicenseById(supabase, id),
    // Utiliser `!!user` et `!loading` pour activer la requête
    enabled: !!user && !loading && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}


// Hook pour le tableau de bord - UTILISE REACT-QUERY
export function useDashboard() {
  const supabase = createSupabaseClient()
  const stablePermissions = useStablePermissions()
  const { canViewAllData, clientAccess } = stablePermissions

  const { user, loading } = useSession() // <--- Ajouter useSession()

  const fetchDashboardData = async () => {
    // Récupération des alertes
    const alertsView = canViewAllData ? 'v_dashboard_alerts' : 'v_client_dashboard'
    let alertsQuery = supabase.from(alertsView).select('*')

    if (!canViewAllData && clientAccess) {
      alertsQuery = alertsQuery.eq('client_id', clientAccess)
    }

    const { data: alertsData, error: alertsError } = await alertsQuery
      .order('alert_date', { ascending: true })
      .limit(10)

    if (alertsError) {
      console.error("Erreur lors de la récupération des alertes:", alertsError)
      throw new Error(`Erreur alertes: ${alertsError.message}`)
    }
    const validAlerts: DashboardAlert[] = alertsData?.filter(alert => 
      alert && alert.id && alert.item_name && alert.alert_type && alert.alert_level && alert.status
    ) as DashboardAlert[] || []

    // Récupération des statistiques
    let dashboardStats: DashboardStats

    if (canViewAllData) {
        const [clientsRes, licensesRes, equipmentRes] = await Promise.allSettled([
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('licenses').select('status', { count: 'exact' }),
          supabase.from('equipment').select('status', { count: 'exact' })
        ]);

        const clientsCount =
          clientsRes.status === 'fulfilled' ? clientsRes.value.count ?? 0 : 0;

        const allLicenses =
          licensesRes.status === 'fulfilled' ? licensesRes.value.data ?? [] : [];

        const allEquipment =
          equipmentRes.status === 'fulfilled' ? equipmentRes.value.data ?? [] : [];

      dashboardStats = {
        total_clients: clientsCount,
        total_licenses: allLicenses.length,
        total_equipment: allEquipment.length,
        expired_licenses: allLicenses.filter(l => l.status === 'expired').length,
        about_to_expire_licenses: allLicenses.filter(l => l.status === 'about_to_expire').length,
        obsolete_equipment: allEquipment.filter(e => e.status === 'obsolete').length,
        soon_obsolete_equipment: allEquipment.filter(e => e.status === 'bientot_obsolete').length
      }
    } else {
      if (!clientAccess) {
        throw new Error("Accès client non défini pour les permissions restreintes.");
      }
      const [licensesRes, equipmentRes] = await Promise.allSettled([
        supabase.from('licenses').select('status').eq('client_id', clientAccess),
        supabase.from('equipment').select('status').eq('client_id', clientAccess)
      ])

      const clientLicenses = licensesRes.status === 'fulfilled' ? (licensesRes.value.data || []) : []
      const clientEquipment = equipmentRes.status === 'fulfilled' ? (equipmentRes.value.data || []) : []

      dashboardStats = {
        total_clients: 1,
        total_licenses: clientLicenses.length,
        total_equipment: clientEquipment.length,
        expired_licenses: clientLicenses.filter(l => l.status === 'expired').length,
        about_to_expire_licenses: clientLicenses.filter(l => l.status === 'about_to_expire').length,
        obsolete_equipment: clientEquipment.filter(e => e.status === 'obsolete').length,
        soon_obsolete_equipment: clientEquipment.filter(e => e.status === 'bientot_obsolete').length
      }
    }

    return {
      stats: dashboardStats,
      alerts: validAlerts,
    }
  }

  const queryKey = ['dashboardData', canViewAllData, clientAccess, user?.id]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchDashboardData,
    enabled: !!user && !loading, // <--- Ajouter la condition `enabled`
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  })

  return {
    stats: data?.stats || null,
    alerts: data?.alerts || [],
    loading: isLoading,
    error: isError ? (error as Error).message : null,
    refetch,
  }
}



// Hook pour les statistiques de licences - UTILISE REACT-QUERY
export function useLicenseStats() {
  const supabase = createSupabaseClient()
  const stablePermissions = useStablePermissions()
  const { canViewAllData, clientAccess } = stablePermissions

  const { user, loading } = useSession() // <--- Ajouter useSession()

  const fetchLicenseStats = async () => {
    let licensesQuery = supabase.from('licenses').select('status, expiry_date, client_id, cost')
    
    if (!canViewAllData && clientAccess) {
      licensesQuery = licensesQuery.eq('client_id', clientAccess)
    }

    const { data: licenses, error: licensesError } = await licensesQuery

    if (licensesError) {
      console.error("Erreur lors de la récupération des licences:", licensesError)
      throw new Error(`Erreur licences: ${licensesError.message}`)
    }

    const validLicenses = licenses?.filter(license => 
      license.status && license.expiry_date
    ) || []

    if (validLicenses.length === 0) {
      return {
        total: 0,
        byStatus: {},
        totalValue: 0,
        monthlyExpiry: [],
        chartData: { statuses: [], expiry: [] }
      } as LicenseStats
    }

    const statusStats = validLicenses.reduce((acc, item) => {
      acc[item.status || 'unknown'] = (acc[item.status || 'unknown'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const monthlyExpiry = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() + i)
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
      
      const count = validLicenses.filter(license => {
        if (!license.expiry_date) return false
        const expiryDate = new Date(license.expiry_date)
        return expiryDate.getMonth() === date.getMonth() &&
                 expiryDate.getFullYear() === date.getFullYear()
      }).length

      return { month: monthKey, count }
    })

    const totalValue = validLicenses.reduce((sum, license) => sum + (license.cost || 0), 0)

    const newStats: LicenseStats = {
      total: validLicenses.length,
      byStatus: statusStats,
      totalValue,
      monthlyExpiry,
      chartData: {
        statuses: Object.entries(statusStats).map(([status, count]) => ({
          name: status,
          value: count,
          percentage: Math.round((count / validLicenses.length) * 100)
        })),
        expiry: monthlyExpiry.filter(item => item.count > 0)
      }
    }
    return newStats
  }
  const queryKey = ['licenseStats', canViewAllData, clientAccess, user?.id]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchLicenseStats,
    enabled: !!user && !loading, // <--- Ajouter la condition `enabled`
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  })

  return { 
    stats: data || null, 
    loading: isLoading, 
    error: isError ? (error as Error).message : null, 
    refetch 
  }
}

// Hook pour les statistiques d'équipements - UTILISE REACT-QUERY
export function useEquipmentStats() {
  const supabase = createSupabaseClient()
  const stablePermissions = useStablePermissions()
  const { canViewAllData, clientAccess } = stablePermissions

  const { user, loading } = useSession() // <--- Ajouter useSession()

  const fetchEquipmentStats = async () => {
    let equipmentQuery = supabase.from('equipment').select('type, status, client_id')
    
    if (!canViewAllData && clientAccess) {
      equipmentQuery = equipmentQuery.eq('client_id', clientAccess)
    }

    const { data: equipment, error: equipmentError } = await equipmentQuery

    if (equipmentError) {
      console.error("Erreur lors de la récupération des équipements:", equipmentError)
      throw new Error(`Erreur équipements: ${equipmentError.message}`)
    }

    const validEquipment = equipment?.filter(item => item.type && item.status) || []

    if (validEquipment.length === 0) {
      return {
        total: 0,
        byType: {},
        byStatus: {},
        chartData: { types: [], statuses: [] }
      } as EquipmentStats
    }

    const typeStats = validEquipment.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusStats = validEquipment.reduce((acc, item) => {
      acc[item.status || 'unknown'] = (acc[item.status || 'unknown'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const newStats: EquipmentStats = {
      total: validEquipment.length,
      byType: typeStats,
      byStatus: statusStats,
      chartData: {
        types: Object.entries(typeStats).map(([type, count]) => ({
          name: type,
          value: count,
          percentage: Math.round((count / validEquipment.length) * 100)
        })),
        statuses: Object.entries(statusStats).map(([status, count]) => ({
          name: status,
          value: count,
          percentage: Math.round((count / validEquipment.length) * 100)
        }))
      }
    }
    return newStats
  }
  const queryKey = ['equipmentStats', canViewAllData, clientAccess, user?.id]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchEquipmentStats,
    enabled: !!user && !loading, // <--- Ajouter la condition `enabled`
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  })

  return { 
    stats: data || null, 
    loading: isLoading, 
    error: isError ? (error as Error).message : null, 
    refetch 
  }
}

// Hook useEquipment - ADAPTÉ AVEC REACT QUERY
const fetchEquipment = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  params: PaginationParams & { 
    clientId?: string; 
    search?: string; 
    type?: string;
    status?: string 
  },
  permissions: ReturnType<typeof useStablePermissions>
): Promise<PaginatedResponse<Equipment>> => {
  let query = supabase
    .from('v_equipment_with_client')
    .select('*', { count: 'exact' });

  if (!permissions.canViewAllData && permissions.clientAccess) {
    query = query.eq('client_id', permissions.clientAccess);
  }

  if (params.clientId) {
    query = query.eq('client_id', params.clientId);
  }
  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  const validTypes = ["pc", "serveur", "routeur", "switch", "imprimante", "autre"] as const;
  if (params.type && validTypes.includes(params.type as typeof validTypes[number])) {
    query = query.eq('type', params.type as typeof validTypes[number]);
  }

  const validStatuses = ["actif", "en_maintenance", "obsolete", "bientot_obsolete", "retire"] as const;
  if (params.status && validStatuses.includes(params.status as typeof validStatuses[number])) {
    query = query.eq('status', params.status as typeof validStatuses[number]);
  }

  const limit = params.limit || 10;
  const page = params.page || 1;
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  query = query.order('estimated_obsolescence_date', { 
    ascending: true,
    nullsFirst: false 
  });

  const { data, error, count } = await query;

  if (error) throw error;

  // **CORRECTION** : Add the missing pagination properties
  return {
    data: (data?.filter(eq => eq.id !== null) as Equipment[]) || [],
    count: count || 0,
    page: page,
    limit: limit,
    total_pages: Math.ceil((count || 0) / limit)
  };
};

export function useEquipment(params: PaginationParams & { 
  clientId?: string; 
  search?: string; 
  type?: string;
  status?: string 
}) {
  const supabase = createSupabaseClient()
  const permissions = useStablePermissions()

  const { user, loading } = useSession() // <--- Remplacer useAuth() par useSession()

  const queryKey = [
    'equipment', 
    params.page, 
    params.limit, 
    params.clientId, 
    params.search, 
    params.type,
    params.status,
    permissions.canViewAllData, 
    permissions.clientAccess,
    user?.id // <--- Ajouter l'ID de l'utilisateur
  ]

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchEquipment(supabase, params, permissions),
    // Utiliser `!!user` et `!loading` pour activer la requête
    enabled: !!user && !loading,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  })

  return {
    equipment: data?.data || [],
    loading: isLoading,
    error: isError ? (error as Error).message : null,
    pagination: {
      count: data?.count || 0,
      page: params.page || 1,
      totalPages: Math.ceil((data?.count || 0) / (params.limit || 10))
    },
    refetch
  }
}
// Fonction de fetching pour useClients (côté client)
// Fonction de fetching mise à jour pour useClients
const fetchClients = async (
  params: PaginationParams & { search?: string; sector?: string },
): Promise<PaginatedResponse<Client>> => {
  const { page, limit, search, sector } = params;
 
  const url = new URL('/api/clients', window.location.origin);
  url.searchParams.set('page', page!.toString());
  url.searchParams.set('limit', limit!.toString());

  if (search) {
    url.searchParams.set('search', search);
  }
  if (sector) {
    url.searchParams.set('sector', sector);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la récupération des clients');
  }

  return response.json();
};

export function useClients(params: PaginationParams & { search?: string; sector?: string }) {
  const { isAuthenticated } = useAuth();
    const { user, loading } = useSession()

  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => fetchClients(params),
    enabled: !!user && !loading,
    // NOTE: `permissions` n'est plus nécessaire dans le queryKey car la logique
    // de permission est gérée côté serveur dans l'API.
  });
}

const fetchClientById = async (id: string): Promise<Client> => {
  const response = await fetch(`/api/clients/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la récupération du client');
  }

  return response.json();
};
export function useClient(id: string) {
  const { user, loading } = useSession() // <--- Remplacer useAuth() par useSession()

  return useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClientById(id),
    // Utiliser `!!user` et `!loading` pour activer la requête
    enabled: !!user && !loading && !!id,
  });
}
const fetchSectors = async (supabase: ReturnType<typeof createSupabaseClient>): Promise<string[]> => {
  const { data, error } = await supabase.from('clients').select('sector').not('sector', 'is', null);

  if (error) {
    throw new Error(error.message);
  }

  const sectors = data.map((item) => item.sector).filter(Boolean) as string[];
  const uniqueSectors = [...new Set(sectors)].sort();

  return uniqueSectors;
};

export function useSectors() {
  const supabase = createSupabaseClient();
  const { user, loading } = useSession() // <--- Remplacer useAuth() par useSession()

  return useQuery({
    queryKey: ['sectors'],
    queryFn: () => fetchSectors(supabase),
    // enabled: true, // <--- Ajouter la condition `enabled`
  });
}

// Hooks utilitaires inchangés
export function useRealtimeSubscription(table: string, callback: (payload: unknown) => void) {
  const supabase = createSupabaseClient()

  useEffect(() => {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table, callback, supabase])
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function usePagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const goToNextPage = useCallback(() => {
    setPage(prev => prev + 1)
  }, [])

  const goToPreviousPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1))
  }, [])

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  const reset = useCallback(() => {
    setPage(initialPage)
    setLimit(initialLimit)
  }, [initialPage, initialLimit])

  return {
    page,
    limit,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changeLimit,
    reset
  }
}
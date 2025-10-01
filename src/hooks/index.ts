import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSupabase as createSupabaseClient} from '@/lib/supabase/client'
import { usePermissions } from '@/lib/auth/permissions'
import { useAuth } from './useAuth';


// Hook pour les permissions - STABILISÉ
import { useSession } from '@/app/context/auth'

export function useAuthPermissions() {
  // Utilisez le hook useSession pour obtenir l'utilisateur et le statut de chargement.
  
  const { user, loading } = useAuth()

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
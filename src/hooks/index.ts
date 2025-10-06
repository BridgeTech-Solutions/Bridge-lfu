import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSupabase as createSupabaseClient} from '@/lib/supabase/client'
import { PermissionChecker, usePermissions } from '@/lib/auth/permissions'
import { useAuthContext } from '@/app/context/auth'

// Hook pour les permissions - STABILISÉ
export function useAuthPermissions() {
  const { user, loading } = useAuthContext()

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
      getPermissions: () => ({
        canManageClients: false,
        canManageLicenses: false,
        canManageEquipment: false,
        canViewReports: false,
        canManageUsers: false,
        canViewAllData: false,
        clientAccess: undefined,
      }),
    }
  }

  const mergedUser = {
    id: user.id,
    email: user.email ?? '',
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    phone: user.phone ?? null,
    company: user.company ?? null,
    client_id: user.client_id ?? null,
    role: user.role ?? 'unverified',
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePermissions(mergedUser)
}

// Hook de permissions ultra-stabilisé
export function useStablePermissions() {
  const { user, permissions } = useAuthContext()

  return useMemo(() => {
    if (!user || !permissions) {
      return {
        canViewAllData: false,
        clientAccess: undefined,
        canManageClients: false,
        canManageLicenses: false,
        canManageEquipment: false,
        canViewReports: false,
        can: () => false
      }
    }

    return {
      canViewAllData: permissions.canViewAllData,
      clientAccess: user.role === 'client' ? user.client_id : undefined,
      canManageClients: permissions.canManageClients,
      canManageLicenses: permissions.canManageLicenses,
      canManageEquipment: permissions.canManageEquipment,
      canViewReports: permissions.canViewReports,
      can: (action: string, resource: string, resourceData?: Record<string, unknown>) => {
        const checker = new PermissionChecker(user)
        return checker.can(action, resource, resourceData)
      }
    }
  }, [user?.id, user?.role, user?.client_id, permissions])
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
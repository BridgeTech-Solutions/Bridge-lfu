import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import {
  licenseSupplierCreateSchema,
  licenseSupplierUpdateSchema,
} from '@/lib/validations'
import type {
  LicenseSupplier,
  LicenseSupplierInsert,
  LicenseSupplierUpdate,
} from '@/types'

interface SuppliersFilters {
  page?: number
  limit?: number
  search?: string
  activeOnly?: boolean
  includeInactive?: boolean
}

interface SupplierPayload {
  name: string
  contactEmail?: string | null
  contactPhone?: string | null
  website?: string | null
  address?: string | null
  notes?: string | null
  isActive?: boolean
}

interface SuppliersResponse {
  data: LicenseSupplier[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

const mapPayloadToApi = (payload: SupplierPayload) => ({
  name: payload.name,
  contactEmail: payload.contactEmail ?? null,
  contactPhone: payload.contactPhone ?? null,
  website: payload.website ?? null,
  address: payload.address ?? null,
  notes: payload.notes ?? null,
  isActive: payload.isActive ?? true,
})

const buildListUrl = (params: SuppliersFilters): string => {
  const url = new URL('/api/license-suppliers', window.location.origin)

  if (params.page) url.searchParams.set('page', params.page.toString())
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.search) url.searchParams.set('search', params.search)
  if (params.activeOnly) url.searchParams.set('active', 'true')
  if (params.includeInactive) url.searchParams.set('include_inactive', 'true')

  return url.toString()
}

const fetchSuppliers = async (params: SuppliersFilters): Promise<SuppliersResponse> => {
  const response = await fetch(buildListUrl(params))

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la récupération des fournisseurs')
  }

  return response.json()
}

const fetchSupplierById = async (id: string): Promise<LicenseSupplier> => {
  const response = await fetch(`/api/license-suppliers/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la récupération du fournisseur')
  }

  return response.json()
}

const createSupplier = async (payload: SupplierPayload): Promise<LicenseSupplier> => {
  const parsed = licenseSupplierCreateSchema.parse(mapPayloadToApi(payload))
  const response = await fetch('/api/license-suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la création du fournisseur')
  }

  return response.json()
}

const updateSupplier = async ({
  id,
  data,
}: {
  id: string
  data: SupplierPayload
}): Promise<LicenseSupplier> => {
  const parsed = licenseSupplierUpdateSchema.parse({ id, ...mapPayloadToApi(data) })
  const response = await fetch(`/api/license-suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la mise à jour du fournisseur')
  }

  return response.json()
}

const deleteSupplier = async ({ id }: { id: string }): Promise<void> => {
  const response = await fetch(`/api/license-suppliers/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la suppression du fournisseur')
  }
}

export function useLicenseSuppliers(params: SuppliersFilters = {}) {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = [
    'license-suppliers',
    params.page,
    params.limit,
    params.search,
    params.activeOnly,
    params.includeInactive,
  ]

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchSuppliers(params),
    enabled: !!user && !loading,
    staleTime: 0,
  })

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, inactive: 0 }

    return data.data.reduce(
      (acc, supplier) => {
        acc.total += 1
        if (supplier.is_active) acc.active += 1
        else acc.inactive += 1
        return acc
      },
      { total: 0, active: 0, inactive: 0 },
    )
  }, [data])

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ['license-suppliers'] })
  }

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      toast.success('Fournisseur créé avec succès')
      invalidateLists()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      toast.success('Fournisseur mis à jour avec succès')
      invalidateLists()
      queryClient.invalidateQueries({ queryKey: ['license-supplier-detail'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      toast.success('Fournisseur supprimé avec succès')
      invalidateLists()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    suppliers: data?.data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    pagination: data
      ? {
          count: data.count,
          page: data.page,
          totalPages: data.totalPages,
          hasMore: data.hasMore,
        }
      : null,
    stats,
    refetch,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export function useLicenseSupplier(supplierId?: string) {
  const { user, loading } = useAuth()

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['license-supplier-detail', supplierId],
    queryFn: () => {
      if (!supplierId) throw new Error('Identifiant manquant')
      return fetchSupplierById(supplierId)
    },
    enabled: !!user && !loading && !!supplierId,
    staleTime: 0,
  })

  return {
    supplier: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}

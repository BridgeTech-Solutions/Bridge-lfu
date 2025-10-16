import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import {
  equipmentBrandCreateSchema,
  equipmentBrandUpdateSchema,
} from '@/lib/validations'
import type { EquipmentBrand } from '@/types'

interface BrandFilters {
  page?: number
  limit?: number
  search?: string
  activeOnly?: boolean
  includeInactive?: boolean
}

interface BrandPayload {
  name: string
  website?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  notes?: string | null
  isActive?: boolean
}

interface BrandsResponse {
  data: EquipmentBrand[]
  count: number
  page: number
  totalPages: number
  hasMore: boolean
}

const mapPayloadToApi = (payload: BrandPayload) => ({
  name: payload.name,
  website: payload.website ?? null,
  supportEmail: payload.supportEmail ?? null,
  supportPhone: payload.supportPhone ?? null,
  notes: payload.notes ?? null,
  isActive: payload.isActive ?? true,
})

const buildListUrl = (params: BrandFilters): string => {
  const url = new URL('/api/equipment-brands', window.location.origin)

  if (params.page) url.searchParams.set('page', params.page.toString())
  if (params.limit) url.searchParams.set('limit', params.limit.toString())
  if (params.search) url.searchParams.set('search', params.search)
  if (params.activeOnly) url.searchParams.set('active', 'true')
  if (params.includeInactive) url.searchParams.set('include_inactive', 'true')

  return url.toString()
}

const fetchBrands = async (params: BrandFilters): Promise<BrandsResponse> => {
  const response = await fetch(buildListUrl(params))

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la récupération des marques')
  }

  return response.json()
}

const fetchBrandById = async (id: string): Promise<EquipmentBrand> => {
  const response = await fetch(`/api/equipment-brands/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la récupération de la marque')
  }

  return response.json()
}

const createBrand = async (payload: BrandPayload): Promise<EquipmentBrand> => {
  const parsed = equipmentBrandCreateSchema.parse(mapPayloadToApi(payload))
  const response = await fetch('/api/equipment-brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la création de la marque')
  }

  return response.json()
}

const updateBrand = async ({
  id,
  data,
}: {
  id: string
  data: BrandPayload
}): Promise<EquipmentBrand> => {
  const parsed = equipmentBrandUpdateSchema.parse({ id, ...mapPayloadToApi(data) })
  const response = await fetch(`/api/equipment-brands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la mise à jour de la marque')
  }

  return response.json()
}

const deleteBrand = async ({ id }: { id: string }): Promise<void> => {
  const response = await fetch(`/api/equipment-brands/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message ?? 'Erreur lors de la suppression de la marque')
  }
}

export function useEquipmentBrands(params: BrandFilters = {}) {
  const { user, loading } = useAuth()
  const queryClient = useQueryClient()

  const queryKey = [
    'equipment-brands',
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
    queryFn: () => fetchBrands(params),
    enabled: !!user && !loading,
    staleTime: 0,
  })

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, inactive: 0 }

    return data.data.reduce(
      (acc, brand) => {
        acc.total += 1
        if (brand.is_active) acc.active += 1
        else acc.inactive += 1
        return acc
      },
      { total: 0, active: 0, inactive: 0 },
    )
  }, [data])

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ['equipment-brands'] })
  }

  const createMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      toast.success('Marque créée avec succès')
      invalidateLists()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateBrand,
    onSuccess: () => {
      toast.success('Marque mise à jour avec succès')
      invalidateLists()
      queryClient.invalidateQueries({ queryKey: ['equipment-brand-detail'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      toast.success('Marque supprimée avec succès')
      invalidateLists()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    brands: data?.data ?? [],
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
    createBrand: createMutation.mutateAsync,
    updateBrand: updateMutation.mutateAsync,
    deleteBrand: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export function useEquipmentBrand(brandId?: string) {
  const { user, loading } = useAuth()

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['equipment-brand-detail', brandId],
    queryFn: () => {
      if (!brandId) throw new Error('Identifiant manquant')
      return fetchBrandById(brandId)
    },
    enabled: !!user && !loading && !!brandId,
    staleTime: 0,
  })

  return {
    brand: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}

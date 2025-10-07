import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface EquipmentTypeItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface EquipmentTypeFilters {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
  includeInactive?: boolean;
}

interface EquipmentTypePayload {
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

interface EquipmentTypeResponse {
  data: EquipmentTypeItem[];
  count: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

const buildListUrl = (params: EquipmentTypeFilters): string => {
  const url = new URL('/api/equipment-types', window.location.origin);

  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.limit) url.searchParams.set('limit', params.limit.toString());
  if (params.search) url.searchParams.set('search', params.search);
  if (params.activeOnly) url.searchParams.set('active', 'true');
  if (params.includeInactive) url.searchParams.set('include_inactive', 'true');

  return url.toString();
};

const fetchEquipmentTypes = async (params: EquipmentTypeFilters): Promise<EquipmentTypeResponse> => {
  const response = await fetch(buildListUrl(params));

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Erreur lors de la récupération des types d'équipement");
  }

  return response.json();
};

const fetchEquipmentTypeById = async (id: string): Promise<EquipmentTypeItem> => {
  const response = await fetch(`/api/equipment-types/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Erreur lors de la récupération du type d'équipement");
  }

  return response.json();
};

const createEquipmentType = async (payload: EquipmentTypePayload): Promise<EquipmentTypeItem> => {
  const response = await fetch('/api/equipment-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Erreur lors de la création du type d'équipement");
  }

  return response.json();
};

const updateEquipmentType = async ({
  id,
  data,
}: {
  id: string;
  data: EquipmentTypePayload;
}): Promise<EquipmentTypeItem> => {
  const response = await fetch(`/api/equipment-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Erreur lors de la mise à jour du type d'équipement");
  }

  return response.json();
};

const deleteEquipmentType = async ({ id }: { id: string }): Promise<void> => {
  const response = await fetch(`/api/equipment-types/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? "Erreur lors de la suppression du type d'équipement");
  }
};

export function useEquipmentTypes(params: EquipmentTypeFilters = {}) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = [
    'equipment-types',
    params.page,
    params.limit,
    params.search,
    params.activeOnly,
    params.includeInactive,
  ];

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchEquipmentTypes(params),
    enabled: !!user && !loading,
    staleTime: 0,
  });

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, inactive: 0 };

    return data.data.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.is_active) acc.active += 1;
        else acc.inactive += 1;
        return acc;
      },
      { total: 0, active: 0, inactive: 0 },
    );
  }, [data]);

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ['equipment-types'] });
  };

  const createMutation = useMutation({
    mutationFn: createEquipmentType,
    onSuccess: () => {
      toast.success("Type d'équipement créé avec succès");
      invalidateLists();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEquipmentType,
    onSuccess: () => {
      toast.success("Type d'équipement mis à jour avec succès");
      invalidateLists();
      queryClient.invalidateQueries({ queryKey: ['equipment-type-detail'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipmentType,
    onSuccess: () => {
      toast.success("Type d'équipement supprimé avec succès");
      invalidateLists();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    types: data?.data ?? [],
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
    createType: createMutation.mutateAsync,
    updateType: updateMutation.mutateAsync,
    deleteType: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useEquipmentType(typeId?: string) {
  const { user, loading } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['equipment-type-detail', typeId],
    queryFn: () => {
      if (!typeId) throw new Error('Identifiant manquant');
      return fetchEquipmentTypeById(typeId);
    },
    enabled: !!user && !loading && !!typeId,
    staleTime: 0,
  });

  return {
    type: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { Equipment, EquipmentFormData } from '@/types'

interface UseEquipmentActionsOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useEquipmentActions(options: UseEquipmentActionsOptions = {}) {
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Mutation pour créer un équipement
  const createEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormData): Promise<Equipment> => {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serial_number,
          purchaseDate: data.purchase_date,
          estimatedObsolescenceDate: data.estimated_obsolescence_date,
          endOfSale: data.end_of_sale,
          cost: data.cost,
          clientId: data.client_id,
          location: data.location,
          description: data.description,
          warrantyEndDate: data.warranty_end_date,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la création de l\'équipement')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      options.onError?.(error.message)
    },
  })

  // Mutation pour mettre à jour un équipement
  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EquipmentFormData }): Promise<Equipment> => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serial_number,
          purchaseDate: data.purchase_date,
          estimatedObsolescenceDate: data.estimated_obsolescence_date,
          endOfSale: data.end_of_sale,
          cost: data.cost,
          clientId: data.client_id,
          location: data.location,
          description: data.description,
          warrantyEndDate: data.warranty_end_date,
          status: data.status, // Important pour permettre le changement de statut
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour de l\'équipement')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      options.onError?.(error.message)
    },
  })

  // Mutation pour supprimer un équipement
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la suppression de l\'équipement')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      options.onError?.(error.message)
    },
  })

  // Mutation pour mettre à jour le statut (maintenance, etc.)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }): Promise<Equipment> => {
      const response = await fetch(`/api/equipment/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la mise à jour du statut')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      options.onError?.(error.message)
    },
  })

  // Mutation pour rafraîchir tous les statuts
  const refreshAllStatusMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (): Promise<any> => {
      const response = await fetch('/api/equipment/refresh-status', {
        method: 'PUT',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors du rafraîchissement des statuts')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipmentStats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
      options.onSuccess?.()
    },
    onError: (error: Error) => {
      options.onError?.(error.message)
    },
  })

  return {
    // Actions
    createEquipment: createEquipmentMutation.mutate,
    updateEquipment: updateEquipmentMutation.mutate,
    deleteEquipment: deleteEquipmentMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    refreshAllStatus: refreshAllStatusMutation.mutate,
    
    // États de chargement
    isCreating: createEquipmentMutation.isPending,
    isUpdating: updateEquipmentMutation.isPending,
    isDeleting: deleteEquipmentMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isRefreshing: refreshAllStatusMutation.isPending,
    
    // Erreurs
    createError: createEquipmentMutation.error?.message,
    updateError: updateEquipmentMutation.error?.message,
    deleteError: deleteEquipmentMutation.error?.message,
    statusError: updateStatusMutation.error?.message,
    refreshError: refreshAllStatusMutation.error?.message,
  }
}
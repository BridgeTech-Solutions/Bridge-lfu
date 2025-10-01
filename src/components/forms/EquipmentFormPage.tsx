/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEquipment, useEquipmentActions } from '@/hooks/useEquipments'
import { useClients } from '@/hooks/useClients'
import { useAuthPermissions } from '@/hooks/index'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Textarea from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  ArrowLeft,
  Save,
  AlertTriangle
} from 'lucide-react'
import { equipmentSchema } from '@/lib/validations'

type EquipmentFormData = z.infer<typeof equipmentSchema>

const EQUIPMENT_TYPES = [
  { value: 'pc', label: 'PC' },
  { value: 'serveur', label: 'Serveur' },
  { value: 'routeur', label: 'Routeur' },
  { value: 'switch', label: 'Switch' },
  { value: 'imprimante', label: 'Imprimante' },
  { value: 'autre', label: 'Autre' },
]

const EQUIPMENT_STATUS = [
  { value: 'actif', label: 'Actif' },
  { value: 'en_maintenance', label: 'En maintenance' },
  { value: 'bientot_obsolete', label: 'Bientôt obsolète' },
  { value: 'obsolete', label: 'Obsolète' },
  { value: 'retire', label: 'Retiré' },
]

interface EquipmentFormPageProps {
  equipmentId?: string // undefined pour création, string pour édition
}

export default function EquipmentFormPage({ equipmentId }: EquipmentFormPageProps) {
  const router = useRouter()
  const permissions = useAuthPermissions()
  const isEditing = !!equipmentId
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Hook pour récupérer l'équipement existant (en mode édition)
  const { data: equipment, isLoading: equipmentLoading } = useEquipment(equipmentId || '')

  // Hook pour récupérer la liste des clients
  const { clients: clientsData, loading: clientsLoading } = useClients({
  page: 1,
  limit: 100,
})

  // Form hook
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      status: 'actif',
    },
  })

  // Hook pour les actions (création et mise à jour)
  const equipmentActions = useEquipmentActions({
    onSuccess: () => {
      router.push(isEditing ? `/equipment/${equipmentId}` : '/equipment')
    },
    onError: (error) => {
      setSubmitError(error)
    },
  })

  // Charger les données de l'équipement dans le formulaire (mode édition)
  useEffect(() => {
    if (equipment && isEditing) {
      reset({
        name: equipment.name || '',
        type: equipment.type as any || 'autre',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        purchase_date: equipment.purchase_date || '',
        estimated_obsolescence_date: equipment.estimated_obsolescence_date || '',
        end_of_sale: equipment.end_of_sale || '',
        warranty_end_date: equipment.warranty_end_date || '',
        cost: equipment.cost || undefined,
        client_id: equipment.client_id || '',
        location: equipment.location || '',
        description: equipment.description || '',
        status: equipment.status as any || 'actif',
      })
    }
  }, [equipment, isEditing, reset])

  const onSubmit = async (data: EquipmentFormData) => {
    setSubmitError(null)

    const formData = {
      name: data.name,
      type: data.type,
      brand: data.brand,
      model: data.model,
      serial_number: data.serial_number,
      purchase_date: data.purchase_date || undefined,
      estimated_obsolescence_date: data.estimated_obsolescence_date || undefined,
      end_of_sale: data.end_of_sale || undefined,
      warranty_end_date: data.warranty_end_date || undefined,
      cost: data.cost,
      client_id: data.client_id,
      location: data.location,
      description: data.description,
      status: data.status || 'actif',
    }

    try {
      if (isEditing && equipmentId) {
        await equipmentActions.updateEquipment({ id: equipmentId, data: formData as any })
      } else {
        // Pour la création, nous devons utiliser une approche différente
        // car useEquipmentActions ne retourne pas createEquipment
        const response = await fetch('/api/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erreur lors de la création')
        }

        // Succès - redirection
        router.push('/equipment')
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Une erreur est survenue')
    }
  }

  if (equipmentLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="hover:bg-slate-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Modifier l\'équipement' : 'Nouvel équipement'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Modifiez les informations de l\'équipement' : 'Créez un nouvel équipement'}
          </p>
        </div>
      </div>

      {/* Erreurs de soumission */}
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Nom de l'équipement"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={watch('type')}
                      onValueChange={(value) => setValue('type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brand">Marque</Label>
                    <Input
                      id="brand"
                      {...register('brand')}
                      placeholder="Marque de l'équipement"
                    />
                  </div>

                  <div>
                    <Label htmlFor="model">Modèle</Label>
                    <Input
                      id="model"
                      {...register('model')}
                      placeholder="Modèle de l'équipement"
                    />
                  </div>

                  <div>
                    <Label htmlFor="serial_number">Numéro de série</Label>
                    <Input
                      id="serial_number"
                      {...register('serial_number')}
                      placeholder="Numéro de série"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Emplacement</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder="Emplacement physique"
                    />
                  </div>

                  {isEditing && (
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={watch('status')}
                        onValueChange={(value) => setValue('status', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_STATUS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Description détaillée de l'équipement"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Dates importantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase_date">Date d&apos;achat</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      {...register('purchase_date')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="warranty_end_date">Fin de garantie</Label>
                    <Input
                      id="warranty_end_date"
                      type="date"
                      {...register('warranty_end_date')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimated_obsolescence_date">Obsolescence estimée</Label>
                    <Input
                      id="estimated_obsolescence_date"
                      type="date"
                      {...register('estimated_obsolescence_date')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_of_sale">Fin de commercialisation</Label>
                    <Input
                      id="end_of_sale"
                      type="date"
                      {...register('end_of_sale')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client */}
            <Card>
              <CardHeader>
                <CardTitle>Client *</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={watch('client_id')}
                  onValueChange={(value) => setValue('client_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Coût */}
            <Card>
              <CardHeader>
                <CardTitle>Informations financières</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="cost">Coût (FCFA)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("cost", { 
                      valueAsNumber: true,
                      setValueAs: (value) => value === "" ? undefined : Number(value)
                    })}
                    placeholder="0.00"
                  />
                  {errors.cost && (
                    <p className="text-sm text-red-600 mt-1">{errors.cost.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    disabled={equipmentActions.isUpdating || submitError !== null}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {equipmentActions.isUpdating ? (
                      'Enregistrement...'
                    ) : (
                      isEditing ? 'Enregistrer les modifications' : 'Créer l\'équipement'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full"
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
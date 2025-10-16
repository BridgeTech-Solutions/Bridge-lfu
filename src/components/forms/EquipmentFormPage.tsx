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
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes' 
import { useEquipmentBrands } from '@/hooks/useEquipmentBrands'
import { useTranslations } from '@/hooks/useTranslations'

type EquipmentFormData = z.infer<typeof equipmentSchema>


const EQUIPMENT_STATUS_VALUES = [
  'actif',
  'en_maintenance',
  'bientot_obsolete',
  'obsolete',
  'retire',
]

interface EquipmentFormPageProps {
  equipmentId?: string // undefined pour création, string pour édition
}

export default function EquipmentFormPage({ equipmentId }: EquipmentFormPageProps) {
  const router = useRouter()
  const permissions = useAuthPermissions()
  const isEditing = !!equipmentId
  const [submitError, setSubmitError] = useState<string | null>(null)
  // AJOUT: État pour s'assurer que le formulaire n'est réinitialisé qu'une fois
  const [hasFormBeenReset, setHasFormBeenReset] = useState(false)

  // Hook pour récupérer l'équipement existant (en mode édition)
  const { data: equipment, isLoading: equipmentLoading } = useEquipment(equipmentId || '')

  // Hook pour récupérer la liste des clients
  const { clients: clientsData, loading: clientsLoading } = useClients({
    page: 1,
    limit: 100,
  })

  // i18n
  const { t: tForm } = useTranslations('equipment.form')
  const { t: tStatus } = useTranslations('equipment.status')
  // On récupère tous les types actifs
  const { 
    types: equipmentTypes, 
    loading: loadingTypes 
  } = useEquipmentTypes({ activeOnly: true, limit: 1000 })

  const {
    brands: equipmentBrands,
    loading: loadingBrands,
  } = useEquipmentBrands({ activeOnly: true, limit: 1000 })
    
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
      // Si on est en édition, on peut initialiser les valeurs à null ou undefined pour 
      // éviter les problèmes de type si les données n'ont pas encore été chargées.
      // Le reset dans l'useEffect prendra le relais.
      client_id: '',
      type_id: '',
      brand_id: '',
    },
  })

  // Hook pour les actions (création et mise à jour)
  const equipmentActions = useEquipmentActions({
    onSuccess: () => {
      // Redirection après succès.
      router.push(isEditing ? `/equipment/${equipmentId}` : '/equipment')
    },
    onError: (error) => {
      setSubmitError(error)
    },
  })

  // Charger les données de l'équipement dans le formulaire (mode édition)
  // MODIFICATION CRITIQUE : 
  // 1. On vérifie que l'équipement est chargé.
  // 2. On vérifie que les listes de SELECT sont chargées (clientsData et equipmentTypes).
  // 3. On utilise l'état local hasFormBeenReset pour ne le faire qu'une seule fois.
  useEffect(() => {
    // S'assurer que les données existent, que nous sommes en édition, et que le reset n'a pas déjà eu lieu
    if (
        equipment && 
        isEditing && 
        clientsData && 
        equipmentTypes.length > 0 && 
        equipmentBrands.length > 0 &&
        !hasFormBeenReset
    ) {
      // Formatage des dates si elles existent (pour les inputs type="date")
      const formatDate = (dateString: string | undefined) => 
        dateString ? new Date(dateString).toISOString().split('T')[0] : ''

      reset({
        name: equipment.name || '',
        type_id: equipment.type_id || '',
        brand_id: equipment.brand_id || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        // Assurez-vous que les dates sont formatées correctement pour les inputs type="date"
        purchase_date: formatDate(equipment.purchase_date),
        estimated_obsolescence_date: formatDate(equipment.estimated_obsolescence_date),
        end_of_sale: formatDate(equipment.end_of_sale),
        warranty_end_date: formatDate(equipment.warranty_end_date),
        cost: equipment.cost || undefined,
        client_id: equipment.client_id || '',
        location: equipment.location || '',
        description: equipment.description || '',
        status: equipment.status as any || 'actif',
      })

      setHasFormBeenReset(true) // Marquer le formulaire comme réinitialisé
    }
    // Dépendances étendues pour inclure les données des Selects
  }, [
    equipment, 
    isEditing, 
    reset, 
    clientsData, 
    equipmentTypes, 
    equipmentBrands,
    hasFormBeenReset
  ])

  const selectedBrandId = watch('brand_id')

  useEffect(() => {
    if (
      isEditing &&
      equipment &&
      equipment.brand_name &&
      !equipment.brand_id &&
      equipmentBrands.length > 0 &&
      !selectedBrandId
    ) {
      const fallbackBrand = equipmentBrands.find((brandItem) => brandItem.name === equipment.brand_name)
      if (fallbackBrand) {
        setValue('brand_id', fallbackBrand.id, { shouldValidate: true })
      }
    }
  }, [isEditing, equipment, equipmentBrands, selectedBrandId, setValue])

  const onSubmit = async (data: EquipmentFormData) => {
    setSubmitError(null)
    // ... votre logique de soumission (inchangée) ...

    const formData = {
      name: data.name,
      type_id: data.type_id, 
      brand_id: data.brand_id,
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

  // MISE À JOUR : On s'assure que TOUTES les données nécessaires sont là avant de continuer.
  // Dans le cas de l'édition, on vérifie aussi que hasFormBeenReset est true, sinon on affiche le spinner 
  // jusqu'à ce que le formulaire ait été réinitialisé avec les valeurs (pour éviter l'affichage vide).
  const isDataLoading = equipmentLoading || clientsLoading || loadingTypes || loadingBrands
  const shouldShowSpinner = isDataLoading || (isEditing && !hasFormBeenReset)

  if (shouldShowSpinner) {
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
          {tForm('header.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? tForm('header.editTitle') : tForm('header.createTitle')}
          </h1>
          <p className="text-gray-500">
            {isEditing ? tForm('header.editSubtitle') : tForm('header.createSubtitle')}
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
                <CardTitle>{tForm('sections.main')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{tForm('fields.name.label')}</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder={tForm('fields.name.placeholder')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type">{tForm('fields.type.label')}</Label>
                    {/* Select Type */}
                    <Select
                      value={watch('type_id') || ''}
                      onValueChange={(value) => setValue('type_id', value as any, { shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={tForm('fields.type.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Vérification que equipmentTypes est prêt */}
                        {equipmentTypes.length > 0 ? (
                          equipmentTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          // Option par défaut si la liste est vide (ne devrait pas être affiché si le spinner fonctionne)
                          <SelectItem value="" disabled>{tForm('fields.type.empty')}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.type_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.type_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="brand_id">{tForm('fields.brand.label')}</Label>
                    <Select
                      value={watch('brand_id') || ''}
                      onValueChange={(value) => {
                        setValue('brand_id', value, { shouldValidate: true })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={tForm('fields.brand.placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentBrands.length > 0 ? (
                          equipmentBrands.map((brandItem) => (
                            <SelectItem key={brandItem.id} value={brandItem.id}>
                              {brandItem.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>{tForm('fields.brand.empty')}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.brand_id && (
                      <p className="text-sm text-red-600 mt-1">{errors.brand_id.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="model">{tForm('fields.model.label')}</Label>
                    <Input
                      id="model"
                      {...register('model')}
                      placeholder={tForm('fields.model.placeholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="serial_number">{tForm('fields.serial.label')}</Label>
                    <Input
                      id="serial_number"
                      {...register('serial_number')}
                      placeholder={tForm('fields.serial.placeholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">{tForm('fields.location.label')}</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder={tForm('fields.location.placeholder')}
                    />
                  </div>

                  {isEditing && (
                    <div>
                      <Label htmlFor="status">{tForm('fields.status.label')}</Label>
                      {/* Select Statut */}
                      <Select
                        value={watch('status')}
                        onValueChange={(value) => setValue('status', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_STATUS_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {tStatus(value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">{tForm('fields.description.label')}</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder={tForm('fields.description.placeholder')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>{tForm('sections.dates')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase_date">{tForm('fields.purchaseDate.label')}</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      {...register('purchase_date')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="warranty_end_date">{tForm('fields.warrantyEnd.label')}</Label>
                    <Input
                      id="warranty_end_date"
                      type="date"
                      {...register('warranty_end_date')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimated_obsolescence_date">{tForm('fields.obsolescence.label')}</Label>
                    <Input
                      id="estimated_obsolescence_date"
                      type="date"
                      {...register('estimated_obsolescence_date')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_of_sale">{tForm('fields.endOfSale.label')}</Label>
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
                <CardTitle>{tForm('sections.client')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Select Client */}
                <Select
                  value={watch('client_id')}
                  onValueChange={(value) => setValue('client_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tForm('fields.client.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Vérification que clientsData est prêt */}
                    {clientsData && clientsData.length > 0 ? (
                      clientsData.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    ) : (
                      // Option par défaut si la liste est vide
                      <SelectItem value="" disabled>{tForm('fields.client.empty')}</SelectItem>
                    )}
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
                <CardTitle>{tForm('sections.finance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="cost">{tForm('fields.cost.label')}</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("cost", { 
                      valueAsNumber: true,
                      setValueAs: (value) => value === "" ? undefined : Number(value)
                    })}
                    placeholder={tForm('fields.cost.placeholder')}
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
                      tForm('actions.saving')
                    ) : (
                      isEditing ? tForm('actions.save') : tForm('actions.create')
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full"
                  >
                    {tForm('actions.cancel')}
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

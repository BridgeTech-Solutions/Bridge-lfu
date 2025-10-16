'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthPermissions } from '@/hooks'
import { useLicense, useLicenses } from '@/hooks/useLicenses'
import { useLicenseSuppliers } from '@/hooks/useLicenseSuppliers'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/useTranslations'

// Schéma de validation
const licenseSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  editor: z.string().optional(),
  version: z.string().optional(),
  licenseKey: z.string().optional(),
  purchaseDate: z.string().optional(),
  expiryDate: z.string().min(1, 'La date d\'expiration est obligatoire'),
  cost: z.number().min(0, 'Le coût doit être positif').optional(),
  clientId: z.string().min(1, 'Le client est obligatoire'),
  supplierId: z.string().uuid('Fournisseur invalide').optional().or(z.literal('')).nullable(),
  description: z.string().optional()
})

type LicenseFormData = z.infer<typeof licenseSchema>

interface LicenseFormPageProps {
  mode: 'create' | 'edit'
}

export default function LicenseFormPage({ mode }: LicenseFormPageProps) {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const permissions = useAuthPermissions()
  const [submitError, setSubmitError] = useState<string | null>(null)
  // AJOUT: État pour s'assurer que le composant est monté côté client
  const [isMounted, setIsMounted] = useState(false) 
  const { t } = useTranslations('licenses')

  const licenseId = mode === 'edit' ? (params.id as string) : ''

  // Hooks pour les données
  const { data: license, isLoading: licenseLoading } = useLicense(licenseId)
  const { clients, loading: clientsLoading } = useClients({ page: 1, limit: 100 })
  const { suppliers, loading: suppliersLoading } = useLicenseSuppliers({ limit: 100, activeOnly: true })
  const { createLicense, updateLicense, isCreating, isUpdating } = useLicenses()

  const form = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      name: '',
      editor: '',
      version: '',
      licenseKey: '',
      purchaseDate: '',
      expiryDate: '',
      cost: undefined,
      clientId: '',
      supplierId: '',
      description: ''
    }
  })

  // Charger les données de la licence en mode édition
  useEffect(() => {
    if (license && mode === 'edit') {
      form.reset({
        name: license.name || '',
        editor: license.editor || '',
        version: license.version || '',
        licenseKey: license.license_key || '',
        purchaseDate: license.purchase_date || '',
        expiryDate: license.expiry_date || '',
        cost: license.cost || undefined,
        clientId: license.client_id || '',
        supplierId: license.supplier_id || '',
        description: license.description || ''
      })
    }
  }, [license, mode, form])

  const selectedSupplierId = form.watch('supplierId')

  useEffect(() => {
    if (!suppliersLoading) {
      const supplier = suppliers.find((item) => item.id === selectedSupplierId)
      form.setValue('editor', supplier?.name || '')
    }
  }, [suppliers, suppliersLoading, selectedSupplierId, form])
  
  // NOUVEAU: Met à jour l'état isMounted après le montage initial
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Pré-sélectionner le client si utilisateur client
  // Ajout de la dépendance isMounted pour ne pas s'exécuter avant l'hydration
  useEffect(() => {
    if (user?.role === 'client' && user.client_id && mode === 'create' && isMounted) {
      form.setValue('clientId', user.client_id)
    }
  }, [user, mode, form, isMounted])

  // Vérification des permissions
    const action = mode === 'create' ? 'create' : 'update'
    const resourceData = mode === 'edit' ? license : undefined

    // On attend le montage complet et le chargement des données pour vérifier les permissions
    if (isMounted && !licenseLoading && !clientsLoading && !suppliersLoading && !permissions.can(action, 'licenses', resourceData)) {
          return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
              <div className="max-w-2xl mx-auto pt-20">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Vous n&apos;avez pas les permissions nécessaires pour {mode === 'create' ? 'créer' : 'modifier'} une licence.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          );
    }

  // Soumission du formulaire
  const onSubmit = async (data: LicenseFormData) => {
    setSubmitError(null)

    try {
      const formData = {
        name: data.name,
        editor: data.editor || undefined,
        version: data.version || undefined,
        licenseKey: data.licenseKey || undefined,
        purchaseDate: data.purchaseDate || undefined,
        expiryDate: data.expiryDate,
        cost: data.cost,
        clientId: data.clientId,
        supplierId: data.supplierId || undefined,
        description: data.description || undefined
      }

      if (mode === 'create') {
        const result = await createLicense(formData)
        toast.success(t('form.toasts.created'))
        router.push(`/licenses/${result.id}`)
      } else {
        const result = await updateLicense({ id: licenseId, data: formData })
        toast.success(t('form.toasts.updated'))
        router.push(`/licenses/${result.id}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('form.toasts.submitError')
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    }
  }

  // Vérification des dates
  const checkExpiryDate = (expiryDate: string) => {
    if (!expiryDate) return null

    const expiry = new Date(expiryDate)
    const today = new Date()
    // Réinitialiser les heures pour une comparaison en jours
    expiry.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { type: 'error', message: t('form.alerts.expired') }
    } else if (daysUntilExpiry === 1) {
      return { type: 'warning', message: t('form.alerts.expiresInOne') }
    } else if (daysUntilExpiry <= 30) {
      return { type: 'info', message: t('form.alerts.expiresIn').replace('{{days}}', String(daysUntilExpiry)) }
    }

    return null
  }

  const expiryDateValue = form.watch('expiryDate')
  const expiryAlert = checkExpiryDate(expiryDateValue)

  // État de chargement initial (pour la récupération des données)
  const initialLoading = (mode === 'edit' && licenseLoading) || clientsLoading || suppliersLoading

  // MODIFICATION: Ajout du contrôle !isMounted. Cela garantit que le code complexe (y compris le Select)
  // n'est exécuté qu'après l'étape de l'hydratation, évitant ainsi les erreurs de portail.
  if (initialLoading || !isMounted) {
    return (
      <div className="space-y-6 mx-auto px-6 pt-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 mx-auto px-6 pt-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="hover:bg-slate-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('form.header.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? t('form.header.createTitle') : t('form.header.editTitle')}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' ? t('form.header.createSubtitle') : t('form.header.editSubtitle')}
          </p>
        </div>
      </div>

      {/* Erreur de soumission */}
      {submitError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.sections.mainInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.name.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.name.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.supplierId.label')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                        value={field.value && field.value.length > 0 ? field.value : 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.fields.supplierId.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">{t('form.fields.supplierId.none')}</SelectItem>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.version.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.fields.version.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.licenseKey.label')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={t('form.fields.licenseKey.placeholder')} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.clientId.label')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={user?.role === 'client'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.fields.clientId.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Dates et coûts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('form.sections.datesAndCosts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.purchaseDate.label')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.expiryDate.label')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.fields.cost.label')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={t('form.fields.cost.placeholder')}
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Alerte date d'expiration */}
              {expiryAlert && (
                <Alert className={
                  expiryAlert.type === 'error' ? 'border-red-200 bg-red-50' :
                  expiryAlert.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className={`h-4 w-4 ${
                    expiryAlert.type === 'error' ? 'text-red-600' :
                    expiryAlert.type === 'warning' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                  <AlertDescription className={
                    expiryAlert.type === 'error' ? 'text-red-800' :
                    expiryAlert.type === 'warning' ? 'text-orange-800' :
                    'text-blue-800'
                  }>
                    {expiryAlert.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.sections.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.description.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('form.fields.description.placeholder')}
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isCreating || isUpdating}
            >
              {t('form.actions.cancel')}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isCreating || isUpdating}>
              {(isCreating || isUpdating) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {mode === 'create' ? t('form.actions.creating') : t('form.actions.updating')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? t('form.actions.create') : t('form.actions.save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

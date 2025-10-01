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
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

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

  const licenseId = mode === 'edit' ? (params.id as string) : ''

  // Hooks pour les données
  const { data: license, isLoading: licenseLoading } = useLicense(licenseId)
  const { clients, loading: clientsLoading } = useClients({ page: 1, limit: 100 })
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
        description: license.description || ''
      })
    }
  }, [license, mode, form])

  // Pré-sélectionner le client si utilisateur client
  useEffect(() => {
    if (user?.role === 'client' && user.client_id && mode === 'create') {
      form.setValue('clientId', user.client_id)
    }
  }, [user, mode, form])

  // Vérification des permissions
    const action = mode === 'create' ? 'create' : 'update'
    const resourceData = mode === 'edit' ? license : undefined

    if (!permissions.can(action, 'licenses', resourceData)) {
      // toast.error('Accès refusé. Vous n\'avez pas les permissions nécessaires')
      // router.push('/licenses')
          return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
              <div className="max-w-2xl mx-auto pt-20">
                <Alert variant="destructive">
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
        description: data.description || undefined
      }

      if (mode === 'create') {
        const result = await createLicense(formData)
        router.push(`/licenses/${result.id}`)
      } else {
        const result = await updateLicense({ id: licenseId, data: formData })
        router.push(`/licenses/${result.id}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      setSubmitError(errorMessage)
    }
  }

  // Vérification des dates
  const checkExpiryDate = (expiryDate: string) => {
    if (!expiryDate) return null

    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { type: 'error', message: 'Cette licence est déjà expirée' }
    } else if (daysUntilExpiry <= 7) {
      return { type: 'warning', message: `Cette licence expire dans ${daysUntilExpiry} jours` }
    } else if (daysUntilExpiry <= 30) {
      return { type: 'info', message: `Cette licence expire dans ${daysUntilExpiry} jours` }
    }

    return null
  }

  const expiryDateValue = form.watch('expiryDate')
  const expiryAlert = checkExpiryDate(expiryDateValue)

  // État de chargement initial
  const initialLoading = (mode === 'edit' && licenseLoading) || clientsLoading

  if (initialLoading) {
    return (
      <div className="space-y-6 mx-auto px-6">
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
    <div className="space-y-6 mx-auto px-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
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
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Nouvelle licence' : 'Modifier la licence'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' ? 
              'Créer une nouvelle licence logicielle ou matérielle' : 
              'Modifier les informations de la licence'
            }
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
              <CardTitle>Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la licence *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Microsoft Office 365" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="editor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Éditeur/Fournisseur</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Microsoft" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 2023" {...field} />
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
                      <FormLabel>Clé de licence</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Clé de licence (masquée)" 
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
                    <FormLabel>Client *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={user?.role === 'client'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
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
                Dates et coûts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;achat</FormLabel>
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
                      <FormLabel>Date d&apos;expiration *</FormLabel>
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
                      <FormLabel>Coût (FCFA)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
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
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informations complémentaires sur la licence..."
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
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {mode === 'create' ? 'Création...' : 'Modification...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Créer la licence' : 'Enregistrer les modifications'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import  Textarea  from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { usePermissions } from '@/lib/auth/permissions'
import { useSupabase as createSupabaseClient } from '@/lib/supabase/client'
import { LicenseWithClientView, Client } from '@/types'
import { toast } from 'sonner';

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
// Définissez un nouveau type pour les clients qui ne contiennent que l'ID et le nom
type ClientForSelect = Pick<Client, 'id' | 'name'>;

export default function LicenseFormPage({ mode }: LicenseFormPageProps) {
  const router = useRouter()
  const params = useParams()
    const { user, profile } = useCurrentUser()
    const permissions = usePermissions(profile)
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(mode === 'edit')
  const [clients, setClients] = useState<ClientForSelect[]>([])
  const [license, setLicense] = useState<LicenseWithClientView | null>(null)

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

  // Chargement des données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {

        // Charger les clients (selon les permissions)
        let clientsQuery = supabase.from('clients').select('id, name').order('name')
        
        // Si utilisateur client, filtrer par son client
        if (profile?.role === 'client' && profile.client_id) {
          clientsQuery = clientsQuery.eq('id', profile.client_id)
        }

        const { data: clientsData } = await clientsQuery
        setClients(clientsData || [])

        // Pré-sélectionner le client si utilisateur client
        if (profile?.role === 'client' && profile.client_id) {
          form.setValue('clientId', profile.client_id)
        }

        // Si mode édition, charger la licence
        if (mode === 'edit' && params.id) {
          const response = await fetch(`/api/licenses/${params.id}`)
          
          if (!response.ok) {
            throw new Error('Licence non trouvée')
          }

          const licenseData: LicenseWithClientView = await response.json()
          setLicense(licenseData)

          // Remplir le formulaire
          form.reset({
            name: licenseData.name || '',
            editor: licenseData.editor || '',
            version: licenseData.version || '',
            licenseKey: licenseData.license_key || '',
            purchaseDate: licenseData.purchase_date || '',
            expiryDate: licenseData.expiry_date || '',
            cost: licenseData.cost || undefined,
            clientId: licenseData.client_id || '',
            description: licenseData.description || ''
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        // toast({
        //   title: 'Erreur',
        //   description: 'Impossible de charger les données',
        //   variant: 'destructive'
        // })
     toast.error(
        'Impossible de charger les données'
      );
        router.push('/licenses')
      } finally {
        setInitialLoading(false)
      }
    }

    loadInitialData()
  }, [mode, params.id, profile, form, router])

  // Vérification des permissions
  useEffect(() => {
    if (!profile) return

    const action = mode === 'create' ? 'create' : 'update'
    const resource = 'licenses'
    const resourceData = mode === 'edit' ? license : undefined

    if (!permissions.can(action, resource, resourceData)) {
    //   toast({
    //     title: 'Accès refusé',
    //     description: 'Vous n\'avez pas les permissions nécessaires',
    //     variant: 'destructive'
    //   })
     toast.error(
        'Accès refusé. Vous n\'avez pas les permissions nécessaires'
      );     
      router.push('/licenses')

    }
  }, [profile, permissions, mode, license, router])

  // Soumission du formulaire
  const onSubmit = async (data: LicenseFormData) => {
    try {
      setLoading(true)

      const url = mode === 'create' ? '/api/licenses' : `/api/licenses/${params.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: data.name,
          editor: data.editor || null,
          version: data.version || null,
          licenseKey: data.licenseKey || null,
          purchaseDate: data.purchaseDate || null,
          expiryDate: data.expiryDate,
          cost: data.cost || null,
          clientId: data.clientId,
          description: data.description || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la sauvegarde')
      }

      const result = await response.json()

      toast.success(
        mode === 'create' 
          ? 'La licence a été créée avec succès' 
          : 'La licence a été modifiée avec succès'
      );
      router.push(`/licenses/${result.id}`)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue lors de la sauvegarde'
      );
    } finally {
      setLoading(false)
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
  const x  = checkExpiryDate(expiryDateValue)

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
                      defaultValue={field.value}
                      disabled={profile?.role === 'client'}
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
              {x && (
                <Alert className={
                  x.type === 'error' ? 'border-red-200 bg-red-50' :
                  x.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className={`h-4 w-4 ${
                    x.type === 'error' ? 'text-red-600' :
                    x.type === 'warning' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                  <AlertDescription className={
                    x.type === 'error' ? 'text-red-800' :
                    x.type === 'warning' ? 'text-orange-800' :
                    'text-blue-800'
                  }>
                    {x.message}
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
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
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
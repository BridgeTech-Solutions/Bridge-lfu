// app/(dashboard)/clients/[id]/edit/page.tsx ou /new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthPermissions } from '@/hooks/index';
import { useClient, useClientActions } from '@/hooks/useClients';
import { clientSchema, type ClientInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Textarea from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Save, Building, User, Mail, Phone, MapPin, Globe, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

interface ClientFormPageProps {
  mode: 'create' | 'edit';
}

export default function ClientFormPage({ mode = 'create' }: ClientFormPageProps) {
  const params = useParams();
  const router = useRouter();
  const { can } = useAuthPermissions();
  
  const clientId = mode === 'edit' ? params.id as string : null;
  
  // Utilisation du nouveau hook useClient pour récupérer les données existantes
  const { data: existingClient, isLoading: loadingClient } = useClient(clientId || '');
  
  // Utilisation du hook useClientActions pour les mutations
  const { updateClient, isUpdating } = useClientActions({
    onSuccess: () => {
      if (mode === 'edit' && clientId) {
        router.push(`/clients/${clientId}`);
      }
    }
  });

  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Cameroun',
      contactEmail: '',
      contactPhone: '',
      contactPerson: '',
      sector: ''
    }
  });

  // Charger les données existantes en mode édition
  useEffect(() => {
    if (mode === 'edit' && existingClient) {
      form.reset({
        name: existingClient.name || '',
        address: existingClient.address || '',
        city: existingClient.city || '',
        postalCode: existingClient.postal_code || '',
        country: existingClient.country || 'Cameroun',
        contactEmail: existingClient.contact_email || '',
        contactPhone: existingClient.contact_phone || '',
        contactPerson: existingClient.contact_person || '',
        sector: existingClient.sector || ''
      });
    }
  }, [existingClient, form, mode]);

  // Vérification des permissions
  const requiredPermission = mode === 'create' ? 'create' : 'update';
  if (!can(requiredPermission, 'clients')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="destructive">
            <AlertDescription>
              Vous n&apos;avez pas les permissions nécessaires pour {mode === 'create' ? 'créer' : 'modifier'} un client.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (mode === 'edit' && loadingClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <p className="text-slate-600 font-medium">Chargement du client...</p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ClientInput) => {
    try {
      if (mode === 'edit' && clientId) {
        // Utilisation du hook pour la mise à jour
        await updateClient({ id: clientId, data });
      } else {
        // Pour la création, appel direct à l'API
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la création');
        }

        const result = await response.json();
        
        toast.success('Client créé avec succès !');
        router.push(`/clients/${result.id}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Une erreur est survenue lors de la sauvegarde'
      );
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && clientId) {
      router.push(`/clients/${clientId}`);
    } else {
      router.push('/clients');
    }
  };

  const secteurOptions = [
    'Informatique',
    'Santé',
    'Education',
    'Finance',
    'Commerce',
    'Industrie',
    'Services',
    'Agriculture',
    'Transport',
    'Télécommunications',
    'Energie',
    'Immobilier',
    'Tourisme',
    'Autre'
  ];

  const isSubmitting = isUpdating;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        {/* En-tête */}
        <div className="mb-8">
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
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                {mode === 'create' ? 'Nouveau client' : 'Modifier le client'}
              </h1>
              <p className="text-slate-600 text-lg">
                {mode === 'create' 
                  ? 'Ajoutez un nouveau client à votre portefeuille' 
                  : 'Modifiez les informations du client'}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informations générales */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Renseignez les informations principales du client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Nom du client *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: TechCorp SARL" 
                            className="bg-white/80"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Nom de l&apos;entreprise ou de l&apos;organisation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Secteur d&apos;activité
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-white/80">
                              <SelectValue placeholder="Sélectionnez un secteur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {secteurOptions.map((secteur) => (
                              <SelectItem key={secteur} value={secteur}>
                                {secteur}
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
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Pays
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Cameroun" 
                            className="bg-white/80"
                            {...field} 
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informations de contact */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Informations de contact
                </CardTitle>
                <CardDescription>
                  Coordonnées du contact principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Contact principal
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Jean Dupont" 
                            className="bg-white/80"
                            {...field}
                            value={field.value ?? ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="contact@exemple.com" 
                            className="bg-white/80"
                            {...field} 
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Téléphone
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: +237 6XX XX XX XX" 
                            className="bg-white/80"
                            {...field} 
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Format: +237 6XXXXXXXX ou 6XXXXXXXX
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Adresse */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Adresse
                </CardTitle>
                <CardDescription>
                  Adresse physique du client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: 123 Rue de la Technologie, Quartier des Affaires"
                          className="bg-white/80 min-h-[100px]"
                          {...field} 
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Douala" 
                            className="bg-white/80"
                            {...field} 
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: BP 1234" 
                            className="bg-white/80"
                            {...field} 
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="order-2 sm:order-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        {mode === 'create' ? 'Création...' : 'Modification...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {mode === 'create' ? 'Créer le client' : 'Enregistrer les modifications'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
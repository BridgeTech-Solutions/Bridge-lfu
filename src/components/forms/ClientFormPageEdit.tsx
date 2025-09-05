// app/components/forms/ClientFormPage.tsx - Formulaire de modification d'un client

'use client';

// --- Importations des modules et composants nécessaires ---
// Hooks de React pour gérer l'état local et les effets de bord
import { useState, useEffect } from 'react';
// Hooks de Next.js pour la navigation et les paramètres d'URL
import { useParams, useRouter } from 'next/navigation';
// Bibliothèques pour la gestion de formulaires et la validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// Hooks et types personnalisés pour l'authentification et la validation
import { useAuthPermissions } from '@/hooks/index';
import { clientSchema, type ClientInput } from '@/lib/validations';
// Composants UI de shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Textarea from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
// Icônes
import { ArrowLeft, Save, Building, User, Mail, Phone, MapPin, Globe, Briefcase } from 'lucide-react';
// Bibliothèque de notifications
import { toast } from 'sonner';
import { Client } from '@/types'; // Import du type Client pour les données récupérées

// Définition des props pour le composant, ici le mode est fixe à 'edit'
interface ClientFormPageProps {
  mode: 'edit';
}

// --- Définition du composant principal ---
export default function ClientFormPageEdit({ mode }: ClientFormPageProps) {
  const params = useParams();
  const router = useRouter();
  // Hook pour vérifier les permissions de l'utilisateur
  const { can } = useAuthPermissions();
  // États locaux pour gérer le chargement lors de la soumission et du chargement initial
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingClient, setLoadingClient] = useState(true);
  const [existingClient, setExistingClient] = useState<Client | null>(null);

  // Récupère l'ID du client depuis l'URL (ex: /clients/edit/123)
  const clientId = params.id as string;

  // --- Initialisation du formulaire avec React Hook Form ---
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    // Les valeurs par défaut sont vides, elles seront remplies par les données de l'API
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

  // --- Effet de chargement initial des données du client ---
  useEffect(() => {
    // Fonction asynchrone pour l'appel API
    const fetchClient = async () => {
      try {
        // Appel à l'API pour récupérer les données du client par son ID
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          throw new Error('Client non trouvé');
        }
        const clientData = await response.json();
        setExistingClient(clientData);

        // Remplir le formulaire avec les données récupérées
        form.reset({
          name: clientData.name || '',
          address: clientData.address || '',
          city: clientData.city || '',
          postalCode: clientData.postal_code || '',
          country: clientData.country || 'Cameroun',
          contactEmail: clientData.contact_email || '',
          contactPhone: clientData.contact_phone || '',
          contactPerson: clientData.contact_person || '',
          sector: clientData.sector || ''
        });
      } catch (error) {
        console.error('Erreur lors du chargement du client:', error);
        toast.error('Impossible de charger les données du client.');
        router.push('/clients'); // Rediriger en cas d'erreur
      } finally {
        setLoadingClient(false);
      }
    };

    fetchClient();
  }, [clientId, form, router]);

  // --- Vérification des permissions de l'utilisateur ---
  // Affiche un message d'erreur si l'utilisateur n'a pas la permission de modifier
  const requiredPermission = 'update';
  if (!can(requiredPermission, 'clients')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="destructive">
            <AlertDescription>
              Vous n&apos;avez pas les permissions nécessaires pour modifier un client.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Affiche un état de chargement tant que les données ne sont pas prêtes
  if (loadingClient) {
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

  // --- Fonction de soumission du formulaire pour la modification ---
  const onSubmit = async (data: ClientInput) => {
    setIsSubmitting(true);

    try {
      // Appel à l'API avec la méthode PUT pour la modification
      const url = `/api/clients/${clientId}`;
      const method = 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Envoi des données du formulaire
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la modification');
      }

      const result = await response.json();
      toast.success('Client modifié avec succès !');
      router.push(`/clients/${result.id}`); // Redirection vers la page du client
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la sauvegarde'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour gérer l'annulation et le retour à la page précédente
  const handleCancel = () => {
    if (clientId) {
      router.push(`/clients/${clientId}`);
    } else {
      router.push('/clients');
    }
  };

  // Options pour le champ "Secteur d'activité"
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

  // --- Rendu du formulaire principal ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="container mx-auto py-8 px-6 max-w-4xl">
        {/* En-tête de la page */}
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
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Modifier le client</h1>
              <p className="text-slate-600 text-lg">Modifiez les informations du client</p>
            </div>
          </div>
        </div>

        {/* Le formulaire en lui-même */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informations générales */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Informations générales
                </CardTitle>
                <CardDescription>Renseignez les informations principales du client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Champ pour le nom du client */}
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
                          <Input placeholder="Ex: TechCorp SARL" className="bg-white/80" {...field} />
                        </FormControl>
                        <FormDescription>Nom de l&apos;entreprise ou de l&apos;organisation</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Champ pour le secteur d'activité */}
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Secteur d&apos;activité
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  {/* Champ pour le pays */}
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
                          <Input placeholder="Cameroun" className="bg-white/80" {...field} />
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
                <CardDescription>Coordonnées du contact principal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Champ pour le nom du contact */}
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
                          <Input placeholder="Ex: Jean Dupont" className="bg-white/80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Champ pour l'email */}
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
                          <Input type="email" placeholder="contact@exemple.com" className="bg-white/80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Champ pour le téléphone */}
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
                          <Input placeholder="Ex: +237 6XX XX XX XX" className="bg-white/80" {...field} />
                        </FormControl>
                        <FormDescription>Format: +237 6XXXXXXXX ou 6XXXXXXXX</FormDescription>
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
                <CardDescription>Adresse physique du client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Champ pour l'adresse complète */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: 123 Rue de la Technologie, Quartier des Affaires" className="bg-white/80 min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Champ pour la ville */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Douala" className="bg-white/80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Champ pour le code postal */}
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: BP 1234" className="bg-white/80" {...field} />
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
                  {/* Bouton d'annulation */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="order-2 sm:order-1"
                  >
                    Annuler
                  </Button>
                  {/* Bouton de soumission */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Modification...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer les modifications
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
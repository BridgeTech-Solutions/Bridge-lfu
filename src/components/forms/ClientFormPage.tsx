// app/(dashboard)/clients/[id]/edit/page.tsx ou /new/page.tsx
'use client';

import { useEffect } from 'react';
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
import { useTranslations } from '@/hooks/useTranslations';
import { getCountryOptions } from '@/lib/utils/countryData';
import { getCode } from 'country-list';

interface ClientFormPageProps {
  mode: 'create' | 'edit';
}

export default function ClientFormPage({ mode = 'create' }: ClientFormPageProps) {
  const params = useParams();
  const router = useRouter();
  const { can } = useAuthPermissions();
  const { t } = useTranslations('clients.form');
  
  const clientId = mode === 'edit' ? params.id as string : null;
  
  const { data: existingClient, isLoading: loadingClient } = useClient(clientId || '');
    // Initialisation de la liste des pays (une fois au montage)
  const countryOptions = getCountryOptions();
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
      country: '',
      contactEmail: '',
      contactPhone: '',
      contactPerson: '',
      sector:undefined
    }
  });

  useEffect(() => {

    if (mode === 'edit' && existingClient) {
      console.log(existingClient?.sector)
      form.reset({
        name: existingClient.name || '',
        address: existingClient.address || '',
        city: existingClient.city || '',
        postalCode: existingClient.postal_code || '',
        country: existingClient.country || 'Cameroun',
        contactEmail: existingClient.contact_email || '',
        contactPhone: existingClient.contact_phone || '',
        contactPerson: existingClient.contact_person || '',
        sector: existingClient.sector || undefined
      });
    }
  }, [existingClient, form, mode]);

  const requiredPermission = mode === 'create' ? 'create' : 'update';
  if (!can(requiredPermission, 'clients')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="destructive">
            <AlertDescription>
              {t(`permission.${mode}`)}
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
            <p className="text-slate-600 font-medium">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ClientInput) => {
    try {
      if (mode === 'edit' && clientId) {
        await updateClient({ id: clientId, data });
      } else {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || t('notifications.errorDefault'));
        }

        const result = await response.json();
        
        toast.success(t('notifications.createSuccess'));
        router.push(`/clients/${result.id}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : t('notifications.errorDefault')
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
    { value: 'Informatique', label: t('options.sectors.informatique') },
    { value: 'Santé', label: t('options.sectors.sante') },
    { value: 'Education', label: t('options.sectors.education') },
    { value: 'Finance', label: t('options.sectors.finance') },
    { value: 'Commerce', label: t('options.sectors.commerce') },
    { value: 'Industrie', label: t('options.sectors.industrie') },
    { value: 'Services', label: t('options.sectors.services') },
    { value: 'Agriculture', label: t('options.sectors.agriculture') },
    { value: 'Transport', label: t('options.sectors.transport') },
    { value: 'Télécommunications', label: t('options.sectors.telecommunications') },
    { value: 'Energie', label: t('options.sectors.energie') },
    { value: 'Immobilier', label: t('options.sectors.immobilier') },
    { value: 'Tourisme', label: t('options.sectors.tourisme') },
    { value: 'Autre', label: t('options.sectors.autre') }
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
              {t('back')}
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                {t(`headings.${mode}Title`)}
              </h1>
              <p className="text-slate-600 text-lg">
                {t(`headings.${mode}Subtitle`)}
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
                  {t('sections.general.title')}
                </CardTitle>
                <CardDescription>
                  {t('sections.general.description')}
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
                          {t('sections.general.fields.name.label')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sections.general.fields.name.placeholder')}
                            className="bg-white/80"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('sections.general.fields.name.description')}
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
                          {t('sections.general.fields.sector.label')}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-white/80">
                              <SelectValue placeholder={t('sections.general.fields.sector.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {secteurOptions.map((secteur) => (
                              <SelectItem key={secteur.value} value={secteur.value}>
                                {secteur.label}
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
                      <FormItem className="sm:col-span-1">
                        <FormLabel>{t('sections.general.fields.country.label')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-white/80">
                              <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder={t('sections.general.fields.country.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  {t('sections.contact.title')}
                </CardTitle>
                <CardDescription>
                  {t('sections.contact.description')}
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
                          {t('sections.contact.fields.contactPerson.label')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sections.contact.fields.contactPerson.placeholder')}
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
                          {t('sections.contact.fields.contactEmail.label')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder={t('sections.contact.fields.contactEmail.placeholder')}
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
                          {t('sections.contact.fields.contactPhone.label')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sections.contact.fields.contactPhone.placeholder')}
                            className="bg-white/80"
                            {...field} 
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('sections.contact.fields.contactPhone.description')}
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
                  {t('sections.address.title')}
                </CardTitle>
                <CardDescription>
                  {t('sections.address.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sections.address.fields.address.label')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('sections.address.fields.address.placeholder')}
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
                        <FormLabel>{t('sections.address.fields.city.label')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sections.address.fields.city.placeholder')}
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
                        <FormLabel>{t('sections.address.fields.postalCode.label')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('sections.address.fields.postalCode.placeholder')}
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
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        {t(`actions.${mode === 'create' ? 'creating' : 'updating'}`)}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t(`actions.${mode === 'create' ? 'create' : 'update'}`)}
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
// components/client/ClientDetail.tsx
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLicenses } from '@/hooks/useLicenses';
import { useEquipments } from '@/hooks/useEquipments';
import { useStablePermissions } from '@/hooks/index';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, MapPin, CheckCircle, AlertTriangle, Clock, Monitor, ArrowLeft, Building, Edit, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';
import { LicenseWithClientView, Client } from '@/types';

const formatMessage = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );

// Composant pour afficher une ligne de licence
const LicenseItem = ({ license }: { license: LicenseWithClientView }) => {
  const { t } = useTranslations('clients.detail.licenseItem');
  const { t: licenseStatusT } = useTranslations('clients.detail.licenseStatus');
  const statusBadge = useMemo(() => {
    const mappings: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: typeof CheckCircle }> = {
      active: { variant: 'default', icon: CheckCircle },
      expired: { variant: 'destructive', icon: AlertTriangle },
      about_to_expire: { variant: 'secondary', icon: Clock },
      actif: { variant: 'default', icon: CheckCircle },
    };
    const key = (license.status ?? '').toString();
    const config = mappings[key] ?? { variant: 'outline', icon: CheckCircle };
    const Icon = config.icon;
    const label = mappings[key]
      ? licenseStatusT(key)
      : formatMessage(licenseStatusT('unknown'), { status: key });
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  }, [license.status, licenseStatusT]);

  const expiryDate = license.expiry_date
    ? new Date(license.expiry_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const editorLabel = license.editor || t('unknownEditor');
  const expiryLabel = expiryDate ? formatMessage(t('expiry'), { date: expiryDate }) : '';
  const description = expiryLabel
    ? formatMessage(t('description'), { editor: editorLabel, expiry: expiryLabel })
    : editorLabel;
  const costLabel = license.cost != null ? formatMessage(t('cost'), { amount: license.cost.toLocaleString('fr-FR') }) : '';

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-slate-800">{license.name}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {statusBadge}
        {costLabel && <Badge variant="outline">{costLabel}</Badge>}
      </div>
    </div>
  );
};

// Composant pour afficher une ligne d'équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EquipmentItem = ({ item }: { item: any }) => {
  const { t } = useTranslations('clients.detail.equipmentItem');
  const { t: equipmentStatusT } = useTranslations('clients.detail.equipmentStatus');

  const statusBadge = useMemo(() => {
    const statusConfig: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'warning'; icon: typeof CheckCircle }> = {
      actif: { variant: 'default', icon: CheckCircle },
      obsolete: { variant: 'destructive', icon: AlertTriangle },
      bientot_obsolete: { variant: 'secondary', icon: Clock },
      en_maintenance: { variant: 'warning', icon: Clock },
      retire: { variant: 'destructive', icon: AlertTriangle },
    };

    const key = (item.status ?? '').toString();
    const config = statusConfig[key] ?? { variant: 'outline', icon: CheckCircle };
    const Icon = config.icon;
    const label = statusConfig[key]
      ? equipmentStatusT(key)
      : formatMessage(equipmentStatusT('unknown'), { status: key });

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  }, [equipmentStatusT, item.status]);

  const description = formatMessage(t('description'), {
    type: item.type || t('unknownType'),
    brand: item.brand || t('unknownBrand'),
    model: item.model || '',
  });

  const obsolescenceLabel = item.estimated_obsolescence_date
    ? formatMessage(t('obsolescence'), {
        date: new Date(item.estimated_obsolescence_date).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
      })
    : '';

  const costLabel = item.cost != null ? formatMessage(t('cost'), { amount: item.cost.toLocaleString('fr-FR') }) : '';

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-slate-800">{item.name}</h4>
        <p className="text-sm text-slate-600">
          {description}
          {obsolescenceLabel && <> • {obsolescenceLabel}</>}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {item.status && statusBadge}
        {costLabel && <Badge variant="outline">{costLabel}</Badge>}
      </div>
    </div>
  );
};

interface ClientDetailProps {
  client: Client;
  showBackButton?: boolean;
  showEditButton?: boolean;
}

export function ClientDetailPage({ client, showBackButton = true, showEditButton = true }: ClientDetailProps) {
  const router = useRouter();
  const { can } = useStablePermissions();
  const headerTranslations = useTranslations('clients.detail.header');
  const contactCardTranslations = useTranslations('clients.detail.contactCard');
  const statsCardTranslations = useTranslations('clients.detail.statsCard');
  const infoCardTranslations = useTranslations('clients.detail.infoCard');
  const tabsTranslations = useTranslations('clients.detail.tabs');

  // Hook pour les licences du client
  const {
    licenses,
    pagination: licensesPagination
  } = useLicenses({
    clientId: client.id,
    limit: 5
  });

  // Hook pour les équipements du client
  const {
    equipment,
    pagination: equipmentPagination
  } = useEquipments({
    clientId: client.id,
    limit: 5
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <div className="container mx-auto py-8 px-6">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/clients')}
                  className="hover:bg-slate-100"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {headerTranslations.t('back')}
                </Button>
              )}
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2">
                  {client.name}
                </h1>
                <p className="text-slate-600 text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {client.sector || headerTranslations.t('sectorFallback')}
                </p>
              </div>
            </div>
            {showEditButton && can('update', 'clients') && (
              <Button
              onClick={() => router.push(`/clients/${client.id}/edit`)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Edit className="mr-2 h-4 w-4" />
                {headerTranslations.t('edit')}
              </Button>
            )}
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Informations de contact */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {contactCardTranslations.t('title')}
              </CardTitle>
              <CardDescription>
                {contactCardTranslations.t('description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">{contactCardTranslations.t('email')}</p>
                      <p className="text-slate-800">{client.contact_email || contactCardTranslations.t('fieldFallback')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">{contactCardTranslations.t('phone')}</p>
                      <p className="text-slate-800">{client.contact_phone || contactCardTranslations.t('fieldFallback')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">{contactCardTranslations.t('contact')}</p>
                      <p className="text-slate-800">{client.contact_person || contactCardTranslations.t('fieldFallback')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">{contactCardTranslations.t('address')}</p>
                      <p className="text-slate-800">
                        {client.address ? (
                          <>
                            {client.address}
                            {client.city && <><br />{client.city}</>}
                            {client.postal_code && ` ${client.postal_code}`}
                            {client.country && <><br />{client.country}</>}
                          </>
                        ) : (
                          contactCardTranslations.t('addressFallback')
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">{statsCardTranslations.t('title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{statsCardTranslations.t('licenses')}</span>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    {licensesPagination?.count || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{statsCardTranslations.t('equipment')}</span>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    {equipmentPagination?.count || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {infoCardTranslations.t('title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">{infoCardTranslations.t('created')}</p>
                  <p className="text-slate-800">
                    {new Date(client.created_at!).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">{infoCardTranslations.t('updated')}</p>
                  <p className="text-slate-800">
                    {new Date(client.updated_at!).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Onglets pour les licences et équipements */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <Tabs defaultValue="licenses" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                <TabsTrigger value="licenses" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {tabsTranslations
                    .t('licensesWithCount')
                    .replace('{{count}}', String(licensesPagination?.count || 0))}
                </TabsTrigger>
                <TabsTrigger value="equipment" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  {tabsTranslations
                    .t('equipmentWithCount')
                    .replace('{{count}}', String(equipmentPagination?.count || 0))}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="licenses" className="space-y-4">
                {licenses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>{tabsTranslations.t('licensesEmpty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {licenses.map((license) => (
                      <LicenseItem key={license.id} license={license} />
                    ))}
                    {licensesPagination && licensesPagination.count > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm">
                          <Link href={`/licenses?clientId=${client.id}`}>
                            {tabsTranslations
                              .t('viewAllLicenses')
                              .replace('{{count}}', String(licensesPagination.count))}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="equipment" className="space-y-4">
                {equipment.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>{tabsTranslations.t('equipmentEmpty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {equipment.map((item) => (
                      <EquipmentItem key={item.id} item={item} />
                    ))}
                    {equipmentPagination && equipmentPagination.count > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm">
                          <Link href={`/equipment?clientId=${client.id}`}>
                            {tabsTranslations
                              .t('viewAllEquipment')
                              .replace('{{count}}', String(equipmentPagination.count))}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
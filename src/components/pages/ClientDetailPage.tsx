// components/client/ClientDetail.tsx
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLicenses } from '@/hooks/useLicenses';
import { useEquipments } from '@/hooks/useEquipments';
import { useStablePermissions } from '@/hooks/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit,
  ArrowLeft,
  Calendar,
  FileText,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { LicenseWithClientView, Client } from '@/types';

// Composant pour afficher une ligne de licence
const LicenseItem = ({ license }: { license: LicenseWithClientView }) => {
  const statusBadge = useMemo(() => {
    const statusConfig = {
      'active': { label: 'Actif', variant: 'default' as const, icon: CheckCircle },
      'expired': { label: 'Expiré', variant: 'destructive' as const, icon: AlertTriangle },
      'about_to_expire': { label: 'Expire bientôt', variant: 'secondary' as const, icon: Clock },
      'actif': { label: 'Actif', variant: 'default' as const, icon: CheckCircle },
    };
    const config = statusConfig[license.status as keyof typeof statusConfig] || {
      label: license.status,
      variant: 'outline' as const,
      icon: CheckCircle
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }, [license.status]);

  return (
    <div key={license.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-slate-800">{license.name}</h4>
        <p className="text-sm text-slate-600">
          {license.editor} • Expire le {new Date(license.expiry_date!).toLocaleDateString('fr-FR')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {statusBadge}
        {license.cost && (
          <Badge variant="outline">
            {license.cost.toLocaleString('fr-FR')} FCFA
          </Badge>
        )}
      </div>
    </div>
  );
};

// Composant pour afficher une ligne d'équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EquipmentItem = ({ item }: { item: any }) => {
  const statusBadge = useMemo(() => {
    const statusConfig = {
      'actif': { label: 'Actif', variant: 'default' as const, icon: CheckCircle },
      'obsolete': { label: 'Obsolète', variant: 'destructive' as const, icon: AlertTriangle },
      'bientot_obsolete': { label: 'Bientôt obsolète', variant: 'secondary' as const, icon: Clock },
      'en_maintenance': { label: 'En maintenance', variant: 'warning' as const, icon: Clock },
      'retire': { label: 'Retiré', variant: 'destructive' as const, icon: AlertTriangle },
    };
    const config = statusConfig[item.status as keyof typeof statusConfig] || {
      label: item.status,
      variant: 'outline' as const,
      icon: CheckCircle
    };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }, [item.status]);

  return (
    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-slate-800">{item.name}</h4>
        <p className="text-sm text-slate-600">
          {item.type} • {item.brand} {item.model}
          {item.estimated_obsolescence_date && (
            <> • Obsolescence prévue le {new Date(item.estimated_obsolescence_date).toLocaleDateString('fr-FR')}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {item.status && statusBadge}
        {item.cost && (
          <Badge variant="outline">
            {item.cost.toLocaleString('fr-FR')} FCFA
          </Badge>
        )}
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
                  Retour
                </Button>
              )}
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2">
                  {client.name}
                </h1>
                <p className="text-slate-600 text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {client.sector || 'Secteur non spécifié'}
                </p>
              </div>
            </div>
            {showEditButton && can('update', 'clients') && (
              <Button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Edit className="mr-2 h-4 w-4" />
                <Link href={`/clients/${client.id}/edit`}>Modifier</Link>
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
                Informations de contact
              </CardTitle>
              <CardDescription>
                Coordonnées et informations principales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Email</p>
                      <p className="text-slate-800">{client.contact_email || 'Non renseigné'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Téléphone</p>
                      <p className="text-slate-800">{client.contact_phone || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <User className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Contact principal</p>
                      <p className="text-slate-800">{client.contact_person || 'Non renseigné'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Adresse</p>
                      <p className="text-slate-800">
                        {client.address ? (
                          <>
                            {client.address}
                            {client.city && <><br />{client.city}</>}
                            {client.postal_code && ` ${client.postal_code}`}
                            {client.country && <><br />{client.country}</>}
                          </>
                        ) : (
                          'Non renseignée'
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
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Licences</span>
                  </div>
                  <Badge variant="outline" className="bg-white">
                    {licensesPagination?.count || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Équipements</span>
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
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">Créé le</p>
                  <p className="text-slate-800">
                    {new Date(client.created_at!).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Dernière mise à jour</p>
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
                  Licences ({licensesPagination?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="equipment" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Équipements ({equipmentPagination?.count || 0})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="licenses" className="space-y-4">
                {licenses.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Aucune licence enregistrée</p>
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
                            Voir toutes les licences ({licensesPagination.count})
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
                    <p>Aucun équipement enregistré</p>
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
                            Voir tous les équipements ({equipmentPagination.count})
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
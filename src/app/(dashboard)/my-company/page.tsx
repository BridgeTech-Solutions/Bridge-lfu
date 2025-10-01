// app/(dashboard)/my-company/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useClient } from '@/hooks/useClients';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { ClientDetailPage } from '@/components/pages/ClientDetailPage';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyCompanyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Rediriger si ce n'est pas un client
  useEffect(() => {
    if (!authLoading && user?.role !== 'client') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  // Récupérer les données du client
  const { data: client, isLoading: loadingClient, error: clientError } = useClient(user?.client_id || '');

  // Skeleton de chargement
  if (authLoading || loadingClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6">
        <div className="container mx-auto">
          <div className="space-y-6">
            {/* Skeleton de l'en-tête */}
            <div className="flex justify-between items-center animate-pulse">
              <div>
                <div className="h-10 bg-gray-200 rounded w-96 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-64"></div>
              </div>
            </div>

            {/* Skeleton des informations principales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-96"></div>
              </div>
              <div className="space-y-6">
                <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-48"></div>
                <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (clientError || !client || !user?.client_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="destructive" className="shadow-lg border-red-200">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="space-y-2">
              <h3 className="font-bold text-lg">Erreur de chargement</h3>
              <p className="mt-2">
                Impossible de charger les informations de votre entreprise. 
                Veuillez contacter votre administrateur si le problème persiste.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Afficher les détails du client
  return (
    <ClientDetailPage 
      client={client} 
      showBackButton={false}
      showEditButton={false}
    />
  );
}
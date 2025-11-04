// app/(dashboard)/clients/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation'
import { useClient } from '@/hooks/useClients'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ClientDetailPage } from '@/components/pages/ClientDetailPage'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useTranslations } from '@/hooks/useTranslations'

export default function ClientDetail() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslations('clients.detail')
  const clientId = params?.id as string

  // Utilisation du hook useClient
  const { data: client, isLoading: loadingClient, error: clientError } = useClient(clientId)

  // Skeleton de chargement
  if (loadingClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6">
        <div className="container mx-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-24 bg-gray-200 rounded" />
                <div>
                  <div className="h-10 bg-gray-200 rounded w-96 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-64" />
                </div>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-96" />
              </div>
              <div className="space-y-6">
                <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-48" />
                <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-48" />
              </div>
            </div>

            <div className="animate-pulse bg-gray-100 rounded-lg p-6 h-64" />
          </div>
        </div>
      </div>
    )
  }

  // Gestion des erreurs
  if (clientError || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="destructive" className="shadow-lg border-red-200">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="space-y-2">
              <h3 className="font-bold text-lg">{t('notFound.title')}</h3>
              <p className="mt-2">{t('notFound.description')}</p>
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('notFound.button')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Afficher les détails du client avec le composant réutilisable
  return (
    <ClientDetailPage
      client={client}
      showBackButton
      showEditButton
    />
  )
}
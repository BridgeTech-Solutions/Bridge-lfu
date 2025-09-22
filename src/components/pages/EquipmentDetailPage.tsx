'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useEquipmentActions } from '@/hooks/useEquipments'
import { useAuthPermissions } from '@/hooks/index'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Upload
} from 'lucide-react'

const EQUIPMENT_TYPES = {
  pc: 'PC',
  serveur: 'Serveur',
  routeur: 'Routeur',
  switch: 'Switch',
  imprimante: 'Imprimante',
  autre: 'Autre',
}

const EQUIPMENT_STATUS = {
  actif: { label: 'Actif', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
  en_maintenance: { label: 'En maintenance', variant: 'warning', icon: Wrench, color: 'text-yellow-600' },
  bientot_obsolete: { label: 'Bientôt obsolète', variant: 'warning', icon: AlertTriangle, color: 'text-orange-600' },
  obsolete: { label: 'Obsolète', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
  retire: { label: 'Retiré', variant: 'secondary', icon: XCircle, color: 'text-gray-600' },
}

interface EquipmentDetailPageProps {
  equipmentId: string
}

export default function EquipmentDetailPage({ equipmentId }: EquipmentDetailPageProps) {
  const router = useRouter()
  const permissions = useAuthPermissions()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Hook pour récupérer les données de l'équipement
  const { data: equipment, isLoading, error, refetch } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de la récupération de l\'équipement')
      }
      return response.json()
    },
    enabled: !!equipmentId,
  })

  // Hook pour récupérer les pièces jointes
  const { data: attachments, isLoading: attachmentsLoading } = useQuery({
    queryKey: ['equipment-attachments', equipmentId],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${equipmentId}/attachments`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des pièces jointes')
      }
      return response.json()
    },
    enabled: !!equipmentId,
  })

  // Hook pour les actions sur les équipements
  const equipmentActions = useEquipmentActions({
    onSuccess: () => {
      refetch()
      if (showDeleteConfirm) {
        router.push('/equipment')
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error('Erreur action équipement:', error)
    },
  })

  const handleStatusChange = async (newStatus: string) => {
    equipmentActions.updateStatus({ id: equipmentId, status: newStatus })
  }

  const handleDelete = () => {
    equipmentActions.deleteEquipment(equipmentId)
  }

  const downloadAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/attachments/${attachmentId}/download`)
      const data = await response.json()
      
      if (response.ok && data.download_url) {
        window.open(data.download_url, '_blank')
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Équipement non trouvé</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusInfo = EQUIPMENT_STATUS[equipment.status as keyof typeof EQUIPMENT_STATUS] || EQUIPMENT_STATUS.actif
  const StatusIcon = statusInfo.icon
  const canManageEquipment = permissions.can('update', 'equipment', equipment)
  const canDeleteEquipment = permissions.can('delete', 'equipment', equipment)

  const isObsolete = equipment.estimated_obsolescence_date && 
    new Date(equipment.estimated_obsolescence_date) < new Date()
  const daysTillObsolete = equipment.estimated_obsolescence_date ? 
    Math.ceil((new Date(equipment.estimated_obsolescence_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            <p className="text-gray-500">
              {EQUIPMENT_TYPES[equipment.type as keyof typeof EQUIPMENT_TYPES]} • {equipment.client_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canManageEquipment && (
            <>
              {equipment.status === 'en_maintenance' ? (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('actif')}
                  disabled={equipmentActions.isUpdatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer actif
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('en_maintenance')}
                  disabled={equipmentActions.isUpdatingStatus}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Mettre en maintenance
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => router.push(`/equipment/${equipmentId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              
              {canDeleteEquipment && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={equipmentActions.isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Alerte de confirmation de suppression */}
      {showDeleteConfirm && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p>Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.</p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={equipmentActions.isDeleting}
                >
                  Confirmer la suppression
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom</label>
                  <p className="text-sm">{equipment.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <div className="text-sm">
                    <Badge variant="outline">
                      {EQUIPMENT_TYPES[equipment.type as keyof typeof EQUIPMENT_TYPES]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Statut</label>
                  <div className="text-sm">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Badge variant={statusInfo.variant as any} className="flex items-center gap-1 w-fit">
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {equipment.serial_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Numéro de série</label>
                    <p className="text-sm font-mono">{equipment.serial_number}</p>
                  </div>
                )}

                {equipment.brand && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Marque</label>
                    <p className="text-sm">{equipment.brand}</p>
                  </div>
                )}

                {equipment.model && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Modèle</label>
                    <p className="text-sm">{equipment.model}</p>
                  </div>
                )}

                {equipment.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emplacement</label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {equipment.location}
                    </p>
                  </div>
                )}

                {equipment.cost && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Coût</label>
                    <p className="text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {equipment.cost}€
                    </p>
                  </div>
                )}
              </div>

              {equipment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm mt-1">{equipment.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipment.purchase_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date d&apos;achat</label>
                    <p className="text-sm">{new Date(equipment.purchase_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}

                {equipment.warranty_end_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fin de garantie</label>
                    <p className="text-sm">{new Date(equipment.warranty_end_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}

                {equipment.estimated_obsolescence_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Obsolescence estimée</label>
                    <div>
                      <p className="text-sm">{new Date(equipment.estimated_obsolescence_date).toLocaleDateString('fr-FR')}</p>
                      {daysTillObsolete !== null && (
                        <p className={`text-xs ${isObsolete ? 'text-red-600' : daysTillObsolete <= 90 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {isObsolete ? 'Déjà obsolète' : `Dans ${daysTillObsolete} jours`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {equipment.end_of_sale && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fin de commercialisation</label>
                    <p className="text-sm">{new Date(equipment.end_of_sale).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{equipment.client_name}</p>
                {equipment.client_email && (
                  <p className="text-sm text-gray-500">{equipment.client_email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pièces jointes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pièces jointes
                </span>
                {canManageEquipment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/equipment/${equipmentId}/attachments/new`)}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachmentsLoading ? (
                <LoadingSpinner />
              ) : attachments && attachments.length > 0 ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {attachments.map((attachment: any) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {attachment.file_size && `${Math.round(attachment.file_size / 1024)} KB`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadAttachment(attachment.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune pièce jointe</p>
              )}
            </CardContent>
          </Card>

          {/* Historique des modifications */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de traçabilité</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {equipment.created_by_name && (
                <div>
                  <span className="text-gray-500">Créé par:</span>
                  <p>{equipment.created_by_name}</p>
                </div>
              )}
              
              {equipment.created_at && (
                <div>
                  <span className="text-gray-500">Créé le:</span>
                  <p>{new Date(equipment.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              
              {equipment.updated_at && equipment.updated_at !== equipment.created_at && (
                <div>
                  <span className="text-gray-500">Modifié le:</span>
                  <p>{new Date(equipment.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
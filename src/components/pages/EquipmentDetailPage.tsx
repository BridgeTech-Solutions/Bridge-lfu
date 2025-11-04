'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  useEquipment, 
  useEquipmentAttachments, 
  useEquipmentActions, 
  useAttachmentActions 
} from '@/hooks/useEquipments'
import { useStablePermissions } from '@/hooks'
import { useAuth } from '@/hooks/useAuth'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import LucideIcon from '@/components/LucideIcon'
import { useTranslations } from '@/hooks/useTranslations'

const EQUIPMENT_STATUS = {
  actif: { label: 'Actif', variant: 'default', icon: CheckCircle, color: 'text-green-600' },
  en_maintenance: { label: 'En maintenance', variant: 'warning', icon: Wrench, color: 'text-yellow-600' },
  bientot_obsolete: { label: 'Bientôt obsolète', variant: 'warning', icon: AlertTriangle, color: 'text-orange-600' },
  obsolete: { label: 'Obsolète', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
  retire: { label: 'Retiré', variant: 'secondary', icon: XCircle, color: 'text-gray-600' },
}

export default function EquipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const permissions = useStablePermissions()
  const { t } = useTranslations('equipment')
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('other')

  const equipmentId = params?.id as string

  // Hooks pour les données et actions
  const { 
    data: equipment, 
    isLoading, 
    isError, 
    error 
  } = useEquipment(equipmentId)

  const { 
    data: attachments = [],
    isLoading: attachmentsLoading,
    refetch: refetchAttachments
  } = useEquipmentAttachments(equipmentId)

  const { 
    updateStatus, 
    deleteEquipment, 
    isUpdatingStatus, 
    isDeleting 
  } = useEquipmentActions({
    onSuccess: () => {
      if (showDeleteConfirm) {
        router.push('/equipment')
      }
    }
  })

  const { 
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    isUploading,
    isDownloading
  } = useAttachmentActions(equipmentId)

  // Gestionnaires d'événements
  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id: equipmentId, status: newStatus })
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEquipment(equipmentId)
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    try {
      await uploadAttachment({ file: selectedFile, fileType })
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setFileType('other')
      refetchAttachments()
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  const handleDownloadAttachment = async (attachmentId: string) => {
    try {
      await downloadAttachment(attachmentId)
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId)
      refetchAttachments()
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  // Fonctions utilitaires
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR')
  }


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 animate-pulse">
        {/* En-tête du Squelette */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Bouton Retour */}
            <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
            <div>
              {/* Titre de l'équipement */}
              <div className="h-7 w-64 bg-gray-200 rounded-md mb-1"></div>
              {/* Type et Client */}
              <div className="h-4 w-40 bg-gray-200 rounded-md"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Boutons d'action (Maintenance, Modifier, Supprimer) */}
            <div className="h-9 w-36 bg-gray-200 rounded-md"></div>
            <div className="h-9 w-28 bg-gray-200 rounded-md"></div>
            <div className="h-9 w-28 bg-gray-200 rounded-md"></div>
          </div>
        </div>
        
        {/* Contenu principal et Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Colonne Principale (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Squelette de la Card "Informations générales" */}
            <Card>
              <CardHeader>
                <CardTitle className="h-6 w-52 bg-gray-200 rounded-md"></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i}>
                      {/* Label */}
                      <div className="h-3 w-20 bg-gray-200 rounded-md mb-1"></div>
                      {/* Valeur */}
                      <div className="h-4 w-full bg-gray-200 rounded-md"></div>
                    </div>
                  ))}
                </div>
                {/* Description (simulée) */}
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-24 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-full bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded-md"></div>
                </div>
              </CardContent>
            </Card>

            {/* Squelette de la Card "Pièces jointes" */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="h-6 w-48 bg-gray-200 rounded-md"></CardTitle>
                <div className="h-8 w-36 bg-gray-200 rounded-md"></div>
              </CardHeader>
              <CardContent>
                {/* Squelette de la Table (3 lignes) */}
                <div className="space-y-2">
                  <div className="h-10 bg-gray-100 rounded"></div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Squelette de la Card "Dates importantes" */}
            <Card>
              <CardHeader>
                <CardTitle className="h-6 w-40 bg-gray-200 rounded-md"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <div className="h-3 w-24 bg-gray-200 rounded-md mb-1"></div>
                      <div className="h-4 w-full bg-gray-200 rounded-md"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
          
          {/* Colonne Sidebar */}
          <div className="space-y-6">
            
            {/* Squelette de la Card "Informations client" */}
            <Card>
              <CardHeader>
                <CardTitle className="h-6 w-24 bg-gray-200 rounded-md"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-4/5 bg-gray-200 rounded-md"></div>
                  <div className="h-3 w-full bg-gray-200 rounded-md"></div>
                </div>
              </CardContent>
            </Card>

            {/* Squelette de la Card "Informations de traçabilité" */}
            <Card>
              <CardHeader>
                <CardTitle className="h-6 w-44 bg-gray-200 rounded-md"></CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-20 bg-gray-200 rounded-md mb-1"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
          </div>
        </div>
      </div>
    )
  }


  if (isError || !equipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isError ? (error as Error)?.message : t('detail.notFound')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/equipment')} className="mt-4">
          {t('detail.backToList')}
        </Button>
      </div>
    )
  }

  const statusInfo = EQUIPMENT_STATUS[equipment.status as keyof typeof EQUIPMENT_STATUS] || EQUIPMENT_STATUS.actif
  const StatusIcon = statusInfo.icon
  const canManageEquipment = permissions.can('update', 'equipment')
  const canDeleteEquipment = permissions.can('delete', 'equipment')

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
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/equipmnents')}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('detail.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            <p className="text-gray-500 flex justify-center items-center gap-2">
               <LucideIcon name={equipment.type_icon} size={18} className="text-primary" /> {equipment.type_name} • {equipment.client_name}
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
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('detail.actions.markActive')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('en_maintenance')}
                  disabled={isUpdatingStatus}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  {t('detail.actions.putMaintenance')}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => router.push(`/equipment/${equipmentId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('detail.actions.edit')}
              </Button>
              
              {canDeleteEquipment && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('detail.actions.delete')}
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
              <p>{t('detail.confirmDelete.message')}</p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? t('detail.confirmDelete.deleting') : t('detail.confirmDelete.confirm')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  {t('detail.confirmDelete.cancel')}
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
                {t('detail.sections.generalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('detail.fields.name')}</Label>
                  <p className="text-sm">{equipment.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('detail.fields.type')}</Label>
                  <div className="text-sm">
                    <Badge variant="outline">
                       {equipment.type_name}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('detail.fields.status')}</Label>
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
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.serialNumber')}</Label>
                    <p className="text-sm font-mono">{equipment.serial_number}</p>
                  </div>
                )}

                {equipment.brand_name && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.brand')}</Label>
                    <p className="text-sm">{equipment.brand_name}</p>
                  </div>
                )}

                {equipment.model && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.model')}</Label>
                    <p className="text-sm">{equipment.model}</p>
                  </div>
                )}

                {equipment.location && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.location')}</Label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {equipment.location}
                    </p>
                  </div>
                )}

                {equipment.cost && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.cost')}</Label>
                    <p className="text-sm flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {equipment.cost} FCFA
                    </p>
                  </div>
                )}
              </div>

              {equipment.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">{t('detail.fields.description')}</Label>
                  <p className="text-sm mt-1">{equipment.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pièces jointes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {t('detail.sections.attachments')} ({attachments.length})
                {attachmentsLoading && (
                  <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                )}
              </CardTitle>
              {canManageEquipment && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t('detail.actions.addFile')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {attachmentsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : attachments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('detail.tableHeaders.fileName')}</TableHead>
                      <TableHead>{t('detail.tableHeaders.type')}</TableHead>
                      <TableHead>{t('detail.tableHeaders.size')}</TableHead>
                      <TableHead>{t('detail.tableHeaders.uploadedBy')}</TableHead>
                      <TableHead>{t('detail.tableHeaders.date')}</TableHead>
                      <TableHead>{t('detail.tableHeaders.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attachments.map((attachment) => (
                      <TableRow key={attachment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            {attachment.file_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {attachment.file_type === 'invoice' ? t('detail.fileTypes.invoice') :
                             attachment.file_type === 'manual' ? t('detail.fileTypes.manual') :
                             attachment.file_type === 'warranty' ? t('detail.fileTypes.warranty') :
                             attachment.file_type === 'spec' ? t('detail.fileTypes.spec') : t('detail.fileTypes.other')}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(attachment.file_size)}</TableCell>
                        <TableCell>
                          {attachment.uploaded_by_profile ? 
                            `${attachment.uploaded_by_profile.first_name} ${attachment.uploaded_by_profile.last_name}` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{formatDate(attachment.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment.id)}
                              disabled={isDownloading}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {canManageEquipment && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('detail.emptyState.noAttachments')}</h3>
                  <p className="text-gray-500 mb-4">
                    {t('detail.emptyState.noFilesAdded')}
                  </p>
                  {canManageEquipment && (
                    <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('detail.emptyState.addFirstFile')}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('detail.sections.importantDates')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipment.purchase_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.purchaseDate')}</Label>
                    <p className="text-sm">{formatDate(equipment.purchase_date)}</p>
                  </div>
                )}

                {equipment.warranty_end_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.warrantyEndDate')}</Label>
                    <p className="text-sm">{formatDate(equipment.warranty_end_date)}</p>
                  </div>
                )}

                {equipment.estimated_obsolescence_date && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.estimatedObsolescenceDate')}</Label>
                    <div>
                      <p className="text-sm">{formatDate(equipment.estimated_obsolescence_date)}</p>
                      {daysTillObsolete !== null && (
                        <p className={`text-xs ${isObsolete ? 'text-red-600' : daysTillObsolete <= 90 ? 'text-orange-600' : 'text-gray-500'}`}>
                          {isObsolete ? t('detail.obsolescence.alreadyObsolete') : `${t('detail.obsolescence.in')} ${daysTillObsolete} ${t('detail.obsolescence.days')}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {equipment.end_of_sale && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{t('detail.fields.endOfSale')}</Label>
                    <p className="text-sm">{formatDate(equipment.end_of_sale)}</p>
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
              <CardTitle>{t('detail.sections.client')}</CardTitle>
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

          {/* Informations de traçabilité */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.sections.trackingInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {equipment.created_by_name && (
                <div>
                  <span className="text-gray-500">{t('detail.fields.createdBy')}:</span>
                  <p>{equipment.created_by_name}</p>
                </div>
              )}
              
              {equipment.created_at && (
                <div>
                  <span className="text-gray-500">{t('detail.fields.createdAt')}:</span>
                  <p>{formatDate(equipment.created_at)}</p>
                </div>
              )}
              
              {equipment.updated_at && equipment.updated_at !== equipment.created_at && (
                <div>
                  <span className="text-gray-500">{t('detail.fields.updatedAt')}:</span>
                  <p>{formatDate(equipment.updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog d'upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detail.uploadDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('detail.uploadDialog.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">{t('detail.uploadDialog.fields.file')}</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="fileType">{t('detail.uploadDialog.fields.fileType')}</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">{t('detail.fileTypes.invoice')}</SelectItem>
                  <SelectItem value="manual">{t('detail.fileTypes.manual')}</SelectItem>
                  <SelectItem value="warranty">{t('detail.fileTypes.warranty')}</SelectItem>
                  <SelectItem value="spec">{t('detail.fileTypes.spec')}</SelectItem>
                  <SelectItem value="other">{t('detail.fileTypes.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)} 
              disabled={isUploading}
            >
              {t('detail.uploadDialog.actions.cancel')}
            </Button>
            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t('detail.uploadDialog.actions.add')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
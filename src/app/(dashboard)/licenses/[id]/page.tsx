// app/licenses/[id]/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Calendar, 
  DollarSign, 
  Key, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useStablePermissions } from '@/hooks'
import { useAuth } from '@/hooks/useAuth'
import { useLicense, useLicenseAttachments, useLicenseActions, useAttachmentActions } from '@/hooks/useLicenses'
import type { LicenseStatus } from '@/types'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function LicenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const permissions = useStablePermissions()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('other')

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [password, setPassword] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const licenseId = params.id as string

  // Utilisation des nouveaux hooks
  const { 
    data: license, 
    isLoading: licenseLoading, 
    isError: licenseError, 
    error 
  } = useLicense(licenseId)

  const { 
    data: attachments = [],
    isLoading: attachmentsLoading,
    refetch: refetchAttachments
  } = useLicenseAttachments(licenseId)

  const { deleteLicense, isDeleting , revealLicenseKey, isRevealing } = useLicenseActions()

  const { 
    uploadAttachment, 
    deleteAttachment, 
    downloadAttachment,
    isUploading,
    isDownloading
  } = useAttachmentActions(licenseId)

  // Gestionnaires d'événements
  const handleEdit = () => {
    router.push(`/licenses/${params.id}/edit`)
  }

  const handleDelete = async () => {
    try {
      await deleteLicense(licenseId)
      router.push('/licenses')
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setDeleteDialogOpen(false)
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

  const handleFileDownload = async (attachmentId: string) => {
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
  const handleHideKey = () => {
    setShowKey(false)
    setRevealedKey(null)
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current)
      autoHideTimer.current = null
    }
  }
  
  const handleRevealKey = async () => {
    if (!licenseId || !password || isRevealing) return
  
    try {
      const { licenseKey } = await revealLicenseKey({ licenseId, password })
      setRevealedKey(licenseKey)
      setShowKey(true)
      setConfirmDialogOpen(false)
      toast.success('Clé visible pendant 60 secondes')
  
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current)
      }
  
      autoHideTimer.current = setTimeout(() => {
        handleHideKey()
      }, 60_000)
    } catch {
      // toast géré par le hook
    } finally {
      setPassword('')
    }
  }
  
  useEffect(() => {
    if (!confirmDialogOpen) {
      setPassword('')
    }
  }, [confirmDialogOpen])
  
  useEffect(() => {
    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current)
      }
    }
  }, [])

  // Fonctions utilitaires
  const getStatusBadge = (status: LicenseStatus | null) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Expirée' },
      about_to_expire: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Bientôt expirée' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Annulée' }
    }

    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.active

    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  // Affichage du loading
  if (licenseLoading) {
    return (
      <div className="space-y-6 m-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Affichage en cas d'erreur
  if (licenseError || !license) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Licence non trouvée</h3>
          <p className="text-gray-500 mb-4">
            {licenseError ? 
              `Erreur: ${(error as Error)?.message}` : 
              'Cette licence n\'existe pas ou vous n\'avez pas les permissions pour la voir.'
            }
          </p>
          <Button onClick={() => router.push('/licenses')}>
            Retour aux licences
          </Button>
        </div>
      </div>
    )
  }

  const daysUntilExpiry = getDaysUntilExpiry(license.expiry_date)

  return (
    <div className="space-y-6 mx-auto px-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold">{license.name}</h1>
            <p className="text-gray-600">
              {license.editor && `${license.editor} • `}
              {license.version && `Version ${license.version} • `}
              Licence {license.status === 'active' ? 'active' : license.status === 'expired' ? 'expirée' : 'inactive'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {permissions.can('update', 'licenses') && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
          {permissions.can('delete', 'licenses') && (
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Alerte expiration */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
        <Alert className={daysUntilExpiry < 0 ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}>
          <AlertTriangle className={`h-4 w-4 ${daysUntilExpiry < 0 ? 'text-red-600' : 'text-orange-600'}`} />
          <AlertDescription className={daysUntilExpiry < 0 ? 'text-red-800' : 'text-orange-800'}>
            {daysUntilExpiry < 0 ? 
              `Cette licence a expiré il y a ${Math.abs(daysUntilExpiry)} jours` :
              `Cette licence expire dans ${daysUntilExpiry} jours`
            }
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nom</Label>
                  <p className="text-sm mt-1">{license.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Statut</Label>
                  <div className="mt-1">{getStatusBadge(license.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Éditeur</Label>
                  <p className="text-sm mt-1">{license.editor || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Version</Label>
                  <p className="text-sm mt-1">{license.version || '-'}</p>
                </div>
                {permissions.canViewAllData && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Client</Label>
                    <p className="text-sm mt-1">{license.client_name || '-'}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Créé par</Label>
                  <p className="text-sm mt-1">{license.created_by_name || '-'}</p>
                </div>
              </div>

              {license.license_key && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Key className="w-4 h-4" />
                    Clé de licence
                  </Label>

                  <div className="flex items-center gap-2">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={showKey ? revealedKey ?? '' : '************'}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRevealing}
                      onClick={() => (showKey ? handleHideKey() : setConfirmDialogOpen(true))}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showKey ? 'Masquer' : 'Afficher'}
                    </Button>
                  </div>
                </div>
              )}

              {license.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{license.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pièces jointes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Pièces jointes ({attachments.length})
                {attachmentsLoading && (
                  <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                )}
              </CardTitle>
              {permissions.can('update', 'licenses') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter un fichier
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
                      <TableHead>Nom du fichier</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Ajouté par</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
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
                            {attachment.file_type === 'contract' ? 'Contrat' :
                             attachment.file_type === 'invoice' ? 'Facture' :
                             attachment.file_type === 'certificate' ? 'Certificat' :
                             attachment.file_type === 'manual' ? 'Manuel' : 'Autre'}
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
                              onClick={() => handleFileDownload(attachment.id)}
                              disabled={isDownloading}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {permissions.can('update', 'licenses') && (
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune pièce jointe</h3>
                  <p className="text-gray-500 mb-4">
                    Aucun fichier n&apos;a été ajouté à cette licence.
                  </p>
                  {permissions.can('update', 'licenses') && (
                    <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Ajouter le premier fichier
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dates importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Date d&apos;achat</Label>
                <p className="text-sm mt-1">{formatDate(license.purchase_date)}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-gray-500">Date d&apos;expiration</Label>
                <p className="text-sm mt-1">{formatDate(license.expiry_date)}</p>
                {daysUntilExpiry !== null && (
                  <p className={`text-xs mt-1 ${
                    daysUntilExpiry < 0 ? 'text-red-600' :
                    daysUntilExpiry <= 7 ? 'text-orange-600' :
                    daysUntilExpiry <= 30 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {daysUntilExpiry < 0 ? 
                      `Expirée depuis ${Math.abs(daysUntilExpiry)} jours` :
                      `Expire dans ${daysUntilExpiry} jours`
                    }
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-gray-500">Créée le</Label>
                <p className="text-sm mt-1">{formatDate(license.created_at)}</p>
              </div>
              {license.updated_at !== license.created_at && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Modifiée le</Label>
                    <p className="text-sm mt-1">{formatDate(license.updated_at)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Informations financières */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informations financières
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Coût total</Label>
                <p className="text-2xl font-bold mt-1">{formatCurrency(license.cost)}</p>
              </div>
              
              {license.purchase_date && license.expiry_date && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Durée de la licence</Label>
                    <p className="text-sm mt-1">
                      {Math.ceil((new Date(license.expiry_date).getTime() - new Date(license.purchase_date).getTime()) / (1000 * 60 * 60 * 24))} jours
                    </p>
                  </div>
                  
                  {license.cost && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Coût par jour</Label>
                      <p className="text-sm mt-1">
                        {formatCurrency(
                          license.cost / Math.ceil((new Date(license.expiry_date).getTime() - new Date(license.purchase_date).getTime()) / (1000 * 60 * 60 * 24))
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {permissions.can('update', 'licenses') && (
                <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier la licence
                </Button>
              )}
              
              {permissions.can('update', 'licenses') && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter un fichier
                </Button>
              )}
              
              
              {permissions.can('delete', 'licenses') && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Dialog show license_key */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer votre identité</DialogTitle>
            <DialogDescription>
              Entrez votre mot de passe pour afficher la clé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="license-password">Mot de passe</Label>
            <Input
              id="license-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRevealKey}
              disabled={!password || isRevealing}
            >
              {isRevealing && <LoadingSpinner size="sm" className="mr-2" />}
              Afficher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la licence</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette licence ? Cette action est irréversible et supprimera également toutes les pièces jointes associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une pièce jointe</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier à ajouter à cette licence. Formats acceptés : PDF, images, documents Office.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Fichier</Label>
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
              <Label htmlFor="fileType">Type de fichier</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contrat</SelectItem>
                  <SelectItem value="invoice">Facture</SelectItem>
                  <SelectItem value="certificate">Certificat</SelectItem>
                  <SelectItem value="manual">Manuel</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
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
              Annuler
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
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
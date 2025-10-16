// app/users/[id]/page.tsx
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useAuthPermissions } from '@/hooks'
import { useUser, useUserActivity, useUserActions, type UserFormData, type UserWithClient } from '@/hooks/useUsers'
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  User,
  Shield,
  Bell,
  Activity,
  AlertCircle
} from 'lucide-react'
import type { UserRole, Client } from '@/types'
import { useTranslations } from '@/hooks/useTranslations'

// Composant pour le formulaire d'édition
function EditUserForm({ 
  user, 
  onClose, 
  onSuccess 
}: { 
  user: UserWithClient
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email,
    phone: user.phone || '',
    company: user.company || '',
    role: user.role ?? 'unverified',
    clientId: user.client_id || ''
  })

  const permissions = useAuthPermissions()
  const { t } = useTranslations('users')

  const { updateUser, isUpdating } = useUserActions()

  // Récupérer la liste des clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: async () => {
      const response = await fetch('/api/clients?limit=1000')
      if (!response.ok) throw new Error('Erreur lors du chargement des clients')
      return response.json()
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    try {
      await updateUser({ id: user.id, data: formData })
      onSuccess()
      onClose()
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  const canEditRole = permissions.can('create', 'users')
  const canEditEmail = permissions.can('create', 'users')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{t('list.form.firstName')}</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">{t('list.form.lastName')}</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">{t('list.form.email')}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          disabled={!canEditEmail}
          required
        />
        {!canEditEmail && (
          <p className="text-xs text-gray-500 mt-1">{t('list.form.onlyAdminsEditEmail')}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">{t('list.form.phone')}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="company">{t('list.form.company')}</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="role">{t('list.form.role')}</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
          disabled={!canEditRole}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t('roles.admin')}</SelectItem>
            <SelectItem value="technicien">{t('roles.technicien')}</SelectItem>
            <SelectItem value="client">{t('roles.client')}</SelectItem>
          </SelectContent>
        </Select>
        {!canEditRole && (
          <p className="text-xs text-gray-500 mt-1">{t('list.form.onlyAdminsEditRole')}</p>
        )}
      </div>

      {formData.role === 'client' && (
        <div>
          <Label htmlFor="clientId">{t('list.form.client')}</Label>
          <Select 
            value={formData.clientId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
            disabled={!canEditRole}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('list.form.clientPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {clientsData?.data?.map((client: Client) => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          {t('list.form.cancel')}
        </Button>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('list.form.save')}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// Fonction pour obtenir le badge de rôle (i18n)
function getRoleBadge(role: UserRole, t: (key: string) => string) {
  const roleConfig = {
    admin: { label: t('roles.admin'), color: 'bg-red-100 text-red-800' },
    technicien: { label: t('roles.technicien'), color: 'bg-blue-100 text-blue-800' },
    client: { label: t('roles.client'), color: 'bg-green-100 text-green-800' },
    unverified: { label: t('roles.unverified'), color: 'bg-yellow-100 text-yellow-800' }
  }

  const config = roleConfig[role] || roleConfig.unverified

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  )
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const permissions = useAuthPermissions()
  const { t, language } = useTranslations('users')
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'

  const [showEditDialog, setShowEditDialog] = useState(false)

  const userId = params.id as string

  // Utilisation des nouveaux hooks
  const { 
    data: user, 
    isLoading, 
    error 
  } = useUser(userId)

  // Query pour récupérer les logs d'activité (si admin)
  const { 
    data: userActivity 
  } = useUserActivity(userId)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">{language === 'fr' ? 'Utilisateur non trouvé' : 'User not found'}</h1>
        <p className="text-gray-600">{language === 'fr' ? "L'utilisateur que vous recherchez n'existe pas ou vous n'avez pas les permissions pour le voir." : 'The requested user does not exist or you do not have permission to view it.'}</p>
        <Button onClick={() => router.push('/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'fr' ? 'Retour à la liste' : 'Back to list'}
        </Button>
      </div>
    )
  }

  const canEdit = permissions.can('update', 'users', user)

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Retour' : 'Back'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        
        {canEdit && (
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Modifier' : 'Edit'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Profil' : 'Profile'}
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Permissions' : 'Permissions'}
          </TabsTrigger>
          {permissions.canViewActivityLogs() && (
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              {language === 'fr' ? 'Activité' : 'Activity'}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations principales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Informations personnelles' : 'Personal information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Prénom</Label>
                    <p className="text-gray-900">{user.first_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nom</Label>
                    <p className="text-gray-900">{user.last_name || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user.phone}</span>
                  </div>
                )}
                
                {user.company && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user.company}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {language === 'fr' ? 'Membre depuis le ' : 'Member since '}{new Date(user.created_at!).toLocaleDateString(locale)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Statut et rôle */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Statut' : 'Status'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">{language === 'fr' ? 'Rôle' : 'Role'}</Label>
                  <div className="mt-1">
                    {getRoleBadge(user.role!, t)}
                  </div>
                </div>
                
                {user.client_id && user.clients && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">{language === 'fr' ? 'Client associé' : 'Linked client'}</Label>
                    <p className="text-gray-900 mt-1">{user.clients.name}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">{language === 'fr' ? 'Dernière mise à jour' : 'Last updated'}</Label>
                  <p className="text-gray-900 mt-1">
                    {new Date(user.updated_at!).toLocaleDateString(locale)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Permissions */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions et accès</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Gestion des clients</h4>
                    <Badge variant={user.role === 'admin' || user.role === 'technicien' ? 'default' : 'secondary'}>
                      {user.role === 'admin' || user.role === 'technicien' ? 'Accès complet' : 'Lecture seule'}
                    </Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Gestion des licences</h4>
                    <Badge variant={user.role === 'admin' || user.role === 'technicien' ? 'default' : 'secondary'}>
                      {user.role === 'admin' || user.role === 'technicien' ? 'Accès complet' : 'Lecture limitée'}
                    </Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Gestion des équipements</h4>
                    <Badge variant={user.role === 'admin' || user.role === 'technicien' ? 'default' : 'secondary'}>
                      {user.role === 'admin' || user.role === 'technicien' ? 'Accès complet' : 'Lecture limitée'}
                    </Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Gestion des utilisateurs</h4>
                    <Badge variant={user.role === 'admin' ? 'default' : 'destructive'}>
                      {user.role === 'admin' ? 'Accès complet' : 'Aucun accès'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Activité */}
        {permissions.canViewActivityLogs() && (
        <TabsContent value="activity">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Journal d&apos;activité
                {userActivity?.data && (
                    <Badge variant="outline" className="ml-auto">
                    {userActivity.data.length} activités
                    </Badge>
                )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {userActivity ? (
                <div className="space-y-6">
                    {userActivity.data.map((log, index: number) => (
                    <div key={log.id} className="relative border-l-2 border-gray-200 pl-6 pb-6 last:pb-0">
                        {/* Point de timeline */}
                        <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-white border-2 border-gray-300">
                        <div className={`h-full w-full rounded-full ${
                            log.action === 'create' ? 'bg-green-500' :
                            log.action === 'update' ? 'bg-blue-500' :
                            log.action === 'delete' ? 'bg-red-500' :
                            log.action === 'validate' ? 'bg-yellow-500' :
                            'bg-gray-500'
                        }`} />
                        </div>

                        <div className="space-y-3">
                        {/* En-tête de l'activité */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant={
                                log.action === 'create' ? 'default' :
                                log.action === 'update' ? 'secondary' :
                                log.action === 'delete' ? 'destructive' :
                                log.action === 'validate' ? 'outline' :
                                'outline'
                                }>
                                {log.actionLabel}
                                </Badge>
                                <span className="text-sm font-medium text-gray-900">
                                {log.tableLabel}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{log.summary}</p>
                            </div>
                            <div className="text-right">
                            <p className="text-sm text-gray-500">
                                {new Date(log.created_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                                })}
                            </p>
                            <p className="text-xs text-gray-400">
                                {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                            </p>
                            </div>
                        </div>

                        {/* Détails techniques */}
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                            <p className="text-gray-500">ID de l&apos;enregistrement:</p>
                            <p className="font-mono text-gray-900 break-all">{log.record_id}</p>
                            </div>
                            <div className="space-y-1">
                            <p className="text-gray-500">Adresse IP:</p>
                            <p className="font-mono text-gray-900">{log.ip_address || 'Non disponible'}</p>
                            </div>
                        </div>

                        {/* Navigateur utilisé */}
                        {log.user_agent && (
                            <div className="text-xs">
                            <p className="text-gray-500 mb-1">Navigateur:</p>
                            <p className="font-mono text-gray-700 bg-gray-50 p-2 rounded text-wrap break-words">
                                {log.user_agent}
                            </p>
                            </div>
                        )}

                        {/* Modifications détaillées pour les updates */}
                        {log.action === 'update' && log.old_values && log.new_values && (
                            <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">Modifications apportées:</h4>
                            <div className="space-y-2">
                                {Object.keys(log.new_values).filter(key => 
                                log.old_values[key] !== log.new_values[key]
                                ).map(field => (
                                <div key={field} className="bg-gray-50 p-3 rounded border">
                                    <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                        {field.replace(/_/g, ' ')}:
                                    </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    <div className="space-y-1">
                                        <p className="text-red-600 font-medium">Ancienne valeur:</p>
                                        <div className="bg-red-50 p-2 rounded border border-red-200">
                                        <code className="text-red-800">
                                            {log.old_values[field] === null ? 'null' : 
                                            log.old_values[field] === '' ? '(vide)' :
                                            String(log.old_values[field])}
                                        </code>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-green-600 font-medium">Nouvelle valeur:</p>
                                        <div className="bg-green-50 p-2 rounded border border-green-200">
                                        <code className="text-green-800">
                                            {log.new_values[field] === null ? 'null' : 
                                            log.new_values[field] === '' ? '(vide)' :
                                            String(log.new_values[field])}
                                        </code>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                            </div>
                        )}

                        {/* Données de création */}
                        {log.action === 'create' && log.new_values && (
                            <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">Données créées:</h4>
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(log.new_values).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                    <p className="text-xs text-green-700 font-medium capitalize">
                                        {key.replace(/_/g, ' ')}:
                                    </p>
                                    <p className="text-xs font-mono text-green-900 bg-white p-1 rounded">
                                        {value === null ? 'null' : 
                                        value === '' ? '(vide)' :
                                        String(value)}
                                    </p>
                                    </div>
                                ))}
                                </div>
                            </div>
                            </div>
                        )}

                        {/* Données supprimées */}
                        {log.action === 'delete' && log.old_values && (
                            <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">Données supprimées:</h4>
                            <div className="bg-red-50 p-3 rounded border border-red-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(log.old_values).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                    <p className="text-xs text-red-700 font-medium capitalize">
                                        {key.replace(/_/g, ' ')}:
                                    </p>
                                    <p className="text-xs font-mono text-red-900 bg-white p-1 rounded line-through">
                                        {value === null ? 'null' : 
                                        value === '' ? '(vide)' :
                                        String(value)}
                                    </p>
                                    </div>
                                ))}
                                </div>
                            </div>
                            </div>
                        )}

                        {/* Données de validation */}
                        {log.action === 'validate' && log.old_values && log.new_values && (
                            <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-900">Détails de la validation:</h4>
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-yellow-800 mb-2">Avant validation:</p>
                                    <div className="space-y-1">
                                    <div className="text-xs">
                                        <span className="font-medium">Rôle:</span> 
                                        <Badge variant="outline" className="ml-1 text-xs">
                                        {log.old_values.role}
                                        </Badge>
                                    </div>
                                    <p className="text-xs">
                                        <span className="font-medium">Client:</span> {log.old_values.client_id || 'Aucun'}
                                    </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-yellow-800 mb-2">Après validation:</p>
                                    <div className="space-y-1">
                                    <p className="text-xs">
                                        <span className="font-medium">Rôle:</span> 
                                        <Badge variant="default" className="ml-1 text-xs">
                                        {log.new_values.role}
                                        </Badge>
                                    </p>
                                    <p className="text-xs">
                                        <span className="font-medium">Client:</span> {log.new_values.client_id || 'Aucun'}
                                    </p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        )}

                        {/* Séparateur entre les activités */}
                        {index < userActivity.data.length - 1 && (
                            <div className="pt-3">
                            <div className="border-t border-gray-100"></div>
                            </div>
                        )}
                        </div>
                    </div>
                    ))}

                    {userActivity.data.length === 0 && (
                    <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Aucune activité enregistrée pour cet utilisateur</p>
                    </div>
                    )}
                </div>
                ) : (
                <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                </div>
                )}
            </CardContent>
            </Card>
        </TabsContent>
        )}
      </Tabs>

      {/* Dialog d'édition */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          <EditUserForm
            user={user}
            onClose={() => setShowEditDialog(false)}
            onSuccess={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
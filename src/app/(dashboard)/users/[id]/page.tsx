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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthPermissions } from '@/hooks'
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
import type { Profile, UserRole, Client } from '@/types'

interface UserWithClient extends Profile {
  clients?: Pick<Client, 'id' | 'name'>
}

interface UserFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  role: UserRole
  clientId?: string
}

// Fonction pour récupérer un utilisateur
const fetchUser = async (id: string): Promise<UserWithClient> => {
  const response = await fetch(`/api/users/${id}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération de l\'utilisateur')
  }

  return response.json()
}

// Fonction pour mettre à jour un utilisateur
const updateUser = async (id: string, data: UserFormData): Promise<UserWithClient> => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la mise à jour de l\'utilisateur')
  }

  return response.json()
}

// Fonction pour récupérer les logs d'activité d'un utilisateur
const fetchUserActivity = async (userId: string) => {
  const response = await fetch(`/api/users/${userId}/activity`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erreur lors de la récupération des logs')
  }

  const result = await response.json()
  return result.data || []   // 🔥 renvoie toujours un tableau
}


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
    role: user.role ?? 'unverified', // ⬅️ Change this line
    clientId: user.client_id || ''
  })

  const queryClient = useQueryClient()
  const permissions = useAuthPermissions()

  // Récupérer la liste des clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: async () => {
      const response = await fetch('/api/clients?limit=1000')
      if (!response.ok) throw new Error('Erreur lors du chargement des clients')
      return response.json()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: UserFormData }) => updateUser(id, data),
    onSuccess: () => {
      toast.success('Utilisateur mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['user', user.id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    updateMutation.mutate({ id: user.id, data: formData })
  }

  const canEditRole = permissions.can('create', 'users')
  const canEditEmail = permissions.can('create', 'users')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          disabled={!canEditEmail}
          required
        />
        {!canEditEmail && (
          <p className="text-xs text-gray-500 mt-1">Seuls les administrateurs peuvent modifier l&apos;email</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="company">Entreprise</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="role">Rôle</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
          disabled={!canEditRole}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrateur</SelectItem>
            <SelectItem value="technicien">Technicien</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
        {!canEditRole && (
          <p className="text-xs text-gray-500 mt-1">Seuls les administrateurs peuvent modifier le rôle</p>
        )}
      </div>

      {formData.role === 'client' && (
        <div>
          <Label htmlFor="clientId">Client associé</Label>
          <Select 
            value={formData.clientId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
            disabled={!canEditRole}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
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
          Annuler
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// Fonction pour obtenir le badge de rôle
function getRoleBadge(role: UserRole) {
  const roleConfig = {
    admin: { label: 'Administrateur', color: 'bg-red-100 text-red-800' },
    technicien: { label: 'Technicien', color: 'bg-blue-100 text-blue-800' },
    client: { label: 'Client', color: 'bg-green-100 text-green-800' },
    unverified: { label: 'Non vérifié', color: 'bg-yellow-100 text-yellow-800' }
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
  const queryClient = useQueryClient()

  const [showEditDialog, setShowEditDialog] = useState(false)

  const userId = params.id as string

  // Query pour récupérer l'utilisateur
  const { 
    data: user, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId
  })

  // Query pour récupérer les logs d'activité (si admin)
  const { 
    data: userActivity 
  } = useQuery({
    queryKey: ['user-activity', userId],
    queryFn: () => fetchUserActivity(userId),
    enabled: !!userId && permissions.canViewActivityLogs()
  })

  // Vérifier les permissions
//   if (!permissions.can('read', 'users')) {
//     router.push('/dashboard')
//     return null
//   }

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
        <h1 className="text-2xl font-bold text-gray-900">Utilisateur non trouvé</h1>
        <p className="text-gray-600">L&apos;utilisateur que vous recherchez n&apos;existe pas ou vous n&apos;avez pas les permissions pour le voir.</p>
        <Button onClick={() => router.push('/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
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
            Retour
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
            Modifier
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          {permissions.canViewActivityLogs() && (
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activité
            </TabsTrigger>
          )}
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations principales */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
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
                    Membre depuis le {new Date(user.created_at!).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Statut et rôle */}
            <Card>
              <CardHeader>
                <CardTitle>Statut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Rôle</Label>
                  <div className="mt-1">
                    {getRoleBadge(user.role!)}
                  </div>
                </div>
                
                {user.client_id && user.clients && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Client associé</Label>
                    <p className="text-gray-900 mt-1">{user.clients.name}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Dernière mise à jour</Label>
                  <p className="text-gray-900 mt-1">
                    {new Date(user.updated_at!).toLocaleDateString('fr-FR')}
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

        {/* Onglet Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Configuration des notifications à implémenter...</p>
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
                {userActivity && (
                    <Badge variant="outline" className="ml-auto">
                    {userActivity.length} activités
                    </Badge>
                )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {userActivity ? (
                <div className="space-y-6">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {userActivity.map((log: any, index: number) => (
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
                        {index < userActivity.length - 1 && (
                            <div className="pt-3">
                            <div className="border-t border-gray-100"></div>
                            </div>
                        )}
                        </div>
                    </div>
                    ))}

                    {userActivity.length === 0 && (
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
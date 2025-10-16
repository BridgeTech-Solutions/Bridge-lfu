'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationInfo, PaginationWithLogic } from '@/components/ui/pagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from "next/link"
import { useQuery } from '@tanstack/react-query'
import { useAuthPermissions, usePagination } from '@/hooks'
import { useUsers, useUserActions, type UserFormData, type ValidationData, type UserWithClient } from '@/hooks/useUsers'
import { 
  UserPlus, 
  Search, 
  Filter, 
  Eye, 
  Save,
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Mail,
  Phone,
  Building,
  Calendar,

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
            onChange={(e) => setFormData((prev: UserFormData) => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">{t('list.form.lastName')}</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData((prev: UserFormData) => ({ ...prev, lastName: e.target.value }))}
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

// Composant pour le formulaire de création d'utilisateur
function CreateUserForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: 'client',
    clientId: '',
    password: ''
  })

  const { createUser, isCreating } = useUsers()
  const { t } = useTranslations('users')

  // Récupérer la liste des clients pour la sélection
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
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    try {
      await createUser(formData)
      onSuccess()
      onClose()
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

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
          required
        />
      </div>

      <div>
        <Label htmlFor="password">{t('list.form.password')}</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
        />
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
        <Label htmlFor="role">{t('list.form.role')}</Label>
        <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t('roles.admin')}</SelectItem>
            <SelectItem value="technicien">{t('roles.technicien')}</SelectItem>
            <SelectItem value="client">{t('roles.client')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.role === 'client' && (
        <div>
          <Label htmlFor="clientId">{t('list.form.client')}</Label>
          <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
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
          {t('list.form.cancel')}
        </Button>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? <LoadingSpinner size="sm" /> : t('list.form.create')}
        </Button>
      </div>
    </form>
  )
}

// Composant pour valider un utilisateur
function ValidateUserDialog({ 
  user, 
  onClose, 
  onSuccess 
}: { 
  user: UserWithClient
  onClose: () => void
  onSuccess: () => void 
}) {
  const [validationData, setValidationData] = useState<ValidationData>({
    role: 'client',
    clientId: ''
  })

  const { validateUser, isValidating } = useUserActions()
  const { t } = useTranslations('users')

  // Récupérer la liste des clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: async () => {
      const response = await fetch('/api/clients?limit=1000')
      if (!response.ok) throw new Error('Erreur lors du chargement des clients')
      return response.json()
    }
  })

  const handleValidate = async () => {
    if (validationData.role === 'client' && !validationData.clientId) {
      toast.error('Veuillez sélectionner un client')
      return
    }
    
    try {
      await validateUser({ userId: user.id, data: validationData })
      onSuccess()
      onClose()
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <h4 className="font-medium text-yellow-800">{t('list.validateNotice.title')}</h4>
            <p className="text-sm text-yellow-700">
              {t('list.validateNotice.text')
                .replace('{{firstName}}', user.first_name || '')
                .replace('{{lastName}}', user.last_name || '')
                .replace('{{email}}', user.email || '')}
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="role">{t('list.form.role')}</Label>
        <Select value={validationData.role} onValueChange={(value: UserRole) => 
          setValidationData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">{t('roles.admin')}</SelectItem>
            <SelectItem value="technicien">{t('roles.technicien')}</SelectItem>
            <SelectItem value="client">{t('roles.client')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {validationData.role === 'client' && (
        <div>
          <Label htmlFor="clientId">{t('list.form.client')}</Label>
          <Select value={validationData.clientId} onValueChange={(value) => 
            setValidationData(prev => ({ ...prev, clientId: value }))}>
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
        <Button variant="outline" onClick={onClose}>
          {t('list.form.cancel')}
        </Button>
        <Button onClick={handleValidate} disabled={isValidating}>
          {isValidating ? <LoadingSpinner size="sm" /> : t('list.form.validate')}
        </Button>
      </div>
    </div>
  )
}

// Fonction pour obtenir le badge de rôle
function getRoleBadge(role: UserRole, t: (k: string) => string) {
  const roleConfig = {
    admin: { labelKey: 'roles.admin', variant: 'default' as const, color: 'bg-red-100 text-red-800' },
    technicien: { labelKey: 'roles.technicien', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
    client: { labelKey: 'roles.client', variant: 'outline' as const, color: 'bg-green-100 text-green-800' },
    unverified: { labelKey: 'roles.unverified', variant: 'destructive' as const, color: 'bg-yellow-100 text-yellow-800' }
  }

  const config = roleConfig[role] || roleConfig.unverified

  return (
    <Badge variant={config.variant} className={config.color}>
      {t(config.labelKey)}
    </Badge>
  )
}
// Dans un fichier séparé si vous préférez, ou juste au-dessus de UsersPage
// Composant de Squelette pour le tableau
function UserTableSkeleton({ count = 10 }: { count?: number }) {
  // Un tableau pour générer 'count' lignes
  const skeletonRows = Array.from({ length: count }, (_, index) => (
    <TableRow key={index}>
      {/* Colonne Utilisateur/Company */}
      <TableCell>
        <div className="space-y-2">
          {/* Nom de l'utilisateur (ligne plus large) */}
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          {/* Compagnie (ligne plus étroite) */}
          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
        </div>
      </TableCell>
      {/* Colonne Contact */}
      <TableCell>
        <div className="space-y-1">
          {/* Email */}
          <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
          {/* Téléphone */}
          <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>
      </TableCell>
      {/* Colonne Rôle */}
      <TableCell>
        <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
      </TableCell>
      {/* Colonne Client associé */}
      <TableCell>
        <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
      </TableCell>
      {/* Colonne Créé le */}
      <TableCell>
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
      </TableCell>
      {/* Colonne Actions */}
      <TableCell>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </TableCell>
    </TableRow>
  ));

  return (
    <Table>
      {/* Gardez l'en-tête du tableau pour conserver la structure */}
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead>Client associé</TableHead>
          <TableHead>Créé le</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skeletonRows}
      </TableBody>
    </Table>
  );
}

export default function UsersPage() {
  const permissions = useAuthPermissions()
  const { t, language } = useTranslations('users')
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'

  // États locaux
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editUser, setEditUser] = useState<UserWithClient | null>(null)
  const [validateDialogUser, setValidateDialogUser] = useState<UserWithClient | null>(null)

  // Pagination
  const { page, limit, goToPage, goToNextPage, goToPreviousPage } = usePagination(1)

  // Utilisation du hook useUsers
  const { users, loading, error, stats, pagination, deleteUser, isDeleting } = useUsers({
    page,
    limit,
    search,
    role: roleFilter
  })

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`)) {
      try {
        await deleteUser(userId)
      } catch (error) {
        // L'erreur est déjà gérée par le hook
      }
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('list.header.title')}</h1>
          <p className="text-gray-600">{t('list.header.subtitle')}</p>
        </div>
        
        {permissions.can('create', 'users') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('list.actions.new')}
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">{t('list.stats.total')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.unverified}</div>
            <div className="text-sm text-gray-600">{t('list.stats.pending')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">{t('list.stats.admins')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.technicians}</div>
            <div className="text-sm text-gray-600">{t('list.stats.technicians')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
            <div className="text-sm text-gray-600">{t('list.stats.clients')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('list.filters.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('list.filters.roleAll')}</SelectItem>
                  <SelectItem value="unverified">{t('list.filters.roleUnverified')}</SelectItem>
                  <SelectItem value="admin">{t('list.filters.roleAdmin')}</SelectItem>
                  <SelectItem value="technicien">{t('list.filters.roleTechnician')}</SelectItem>
                  <SelectItem value="client">{t('list.filters.roleClient')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>{t('list.header.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
             <UserTableSkeleton count={10} />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{t('list.table.errors.load')}</p>
              <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                {t('list.table.errors.retry')}
              </Button>
            </div>
          ) : !users?.length ? (
            <div className="text-center py-8 text-gray-500">
              {t('list.table.empty')}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('list.table.headers.user')}</TableHead>
                    <TableHead>{t('list.table.headers.contact')}</TableHead>
                    <TableHead>{t('list.table.headers.role')}</TableHead>
                    <TableHead>{t('list.table.headers.client')}</TableHead>
                    <TableHead>{t('list.table.headers.created')}</TableHead>
                    <TableHead>{t('list.table.headers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          {user.company && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {user.company}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm flex items-center text-gray-500">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role!, t)}
                      </TableCell>
                      <TableCell>
                        {user.clients?.name || (user.role === 'client' ? t('list.notAssigned') : '-')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center text-gray-500">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(user.created_at!).toLocaleDateString(locale)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {user.role === 'unverified' && permissions.can('create', 'users') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setValidateDialogUser(user)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Link href={`/users/${user.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {permissions.can('update', 'users', user) && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {permissions.can('delete', 'users', user) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      </TableRow>
                ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {(pagination?.count || 0) > limit && pagination && (
                <div className="flex items-center justify-between mt-6">
                  <PaginationInfo
                    currentPage={page}
                    itemsPerPage={limit}
                    totalItems={pagination?.count || 0}
                  />
                  <PaginationWithLogic
                    currentPage={page}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={goToPage}
                  />
                </div>
              )}
              
            </>
          )}
        </CardContent>
      </Card>
      {/* Dialog de création d'utilisateur */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('list.dialogs.createTitle')}</DialogTitle>
          </DialogHeader>
          <CreateUserForm
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {}}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de validation d'utilisateur */}
      <Dialog open={!!validateDialogUser} onOpenChange={() => setValidateDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('list.dialogs.validateTitle')}</DialogTitle>
          </DialogHeader>
          {validateDialogUser && (
            <ValidateUserDialog
              user={validateDialogUser}
              onClose={() => setValidateDialogUser(null)}
              onSuccess={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('list.dialogs.editTitle')}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <EditUserForm
              user={editUser}
              onClose={() => setEditUser(null)}
              onSuccess={() => setEditUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
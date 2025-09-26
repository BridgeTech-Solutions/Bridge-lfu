// app/users/page.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { UserRole, Client } from '@/types'

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
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? (
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
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Mot de passe *</Label>
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
        <Label htmlFor="role">Rôle *</Label>
        <Select value={formData.role} onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrateur</SelectItem>
            <SelectItem value="technicien">Technicien</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.role === 'client' && (
        <div>
          <Label htmlFor="clientId">Client associé *</Label>
          <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
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
          Annuler
        </Button>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? <LoadingSpinner size="sm" /> : 'Créer'}
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
            <h4 className="font-medium text-yellow-800">Validation d&apos;utilisateur</h4>
            <p className="text-sm text-yellow-700">
              Validez {user.first_name} {user.last_name} ({user.email})
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="role">Rôle à attribuer *</Label>
        <Select value={validationData.role} onValueChange={(value: UserRole) => 
          setValidationData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrateur</SelectItem>
            <SelectItem value="technicien">Technicien</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {validationData.role === 'client' && (
        <div>
          <Label htmlFor="clientId">Client associé *</Label>
          <Select value={validationData.clientId} onValueChange={(value) => 
            setValidationData(prev => ({ ...prev, clientId: value }))}>
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
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={handleValidate} disabled={isValidating}>
          {isValidating ? <LoadingSpinner size="sm" /> : 'Valider'}
        </Button>
      </div>
    </div>
  )
}

// Fonction pour obtenir le badge de rôle
function getRoleBadge(role: UserRole) {
  const roleConfig = {
    admin: { label: 'Administrateur', variant: 'default' as const, color: 'bg-red-100 text-red-800' },
    technicien: { label: 'Technicien', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
    client: { label: 'Client', variant: 'outline' as const, color: 'bg-green-100 text-green-800' },
    unverified: { label: 'Non vérifié', variant: 'destructive' as const, color: 'bg-yellow-100 text-yellow-800' }
  }

  const config = roleConfig[role] || roleConfig.unverified

  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
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
  const router = useRouter()

  // États locaux
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editUser, setEditUser] = useState<UserWithClient | null>(null)
  const [validateDialogUser, setValidateDialogUser] = useState<UserWithClient | null>(null)

  // Pagination
  const { page, limit, goToPage, goToNextPage, goToPreviousPage } = usePagination(1, 10)

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Gérer les comptes utilisateurs et leurs permissions</p>
        </div>
        
        {permissions.can('create', 'users') && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total utilisateurs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.unverified}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Administrateurs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.technicians}</div>
            <div className="text-sm text-gray-600">Techniciens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.clients}</div>
            <div className="text-sm text-gray-600">Clients</div>
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
                  placeholder="Rechercher par nom, email ou entreprise..."
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
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="unverified">Non vérifiés</SelectItem>
                  <SelectItem value="admin">Administrateurs</SelectItem>
                  <SelectItem value="technicien">Techniciens</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
             <UserTableSkeleton count={10} />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Erreur lors du chargement des utilisateurs</p>
              <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : !users?.length ? (
            <div className="text-center py-8 text-gray-500">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <>
              <Table>
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
                        {getRoleBadge(user.role!)}
                      </TableCell>
                      <TableCell>
                        {user.clients?.name || (user.role === 'client' ? 'Non assigné' : '-')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center text-gray-500">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(user.created_at!).toLocaleDateString('fr-FR')}
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
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-gray-700">
                    Page {pagination.page} sur {pagination.totalPages} ({pagination.count} utilisateurs au total)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
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
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
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
            <DialogTitle>Valider l&apos;utilisateur</DialogTitle>
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
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
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
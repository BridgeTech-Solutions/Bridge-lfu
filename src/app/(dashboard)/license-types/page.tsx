'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { licenseTypeCreateSchema, licenseTypeUpdateSchema } from '@/lib/validations'
import { useTranslations } from '@/hooks/useTranslations'
import { 
  useLicenseTypes, 
  useCreateLicenseType, 
  useUpdateLicenseType, 
  useLicenseTypesActions,
  type LicenseType,
  type LicenseTypeInsert,
  type LicenseTypeUpdate
} from '@/hooks/useLicenseTypes'
import { useDebounce } from '@/hooks'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ListPageSkeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Plus, Search, MoreHorizontal, Edit, Download, Trash2, AlertTriangle } from 'lucide-react'

export default function LicenseTypesPage() {
  const { t } = useTranslations('licenseTypes')
  
  // Data hooks
  const { data: types, isLoading, error } = useLicenseTypes()
  const { create: createLicenseType, isCreating } = useCreateLicenseType()
  const { update: updateLicenseType, isUpdating } = useUpdateLicenseType()
  const { delete: deleteMutation, isDeleting } = useLicenseTypesActions().delete

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<LicenseType | null>(null)

  // Create Form
  const createForm = useForm<LicenseTypeInsert>({
    resolver: zodResolver(licenseTypeCreateSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      is_active: true,
    },
  })

  // Edit Form
  const editForm = useForm<LicenseTypeUpdate>({
    resolver: zodResolver(licenseTypeUpdateSchema),
    defaultValues: {
      id: '',
      name: '',
      code: '',
      description: '',
      is_active: true,
    },
  })

  // Update edit form when selectedType changes
  useEffect(() => {
    if (selectedType && editDialogOpen) {
      editForm.reset({
        id: selectedType.id,
        name: selectedType.name,
        code: selectedType.code,
        description: selectedType.description || '',
        is_active: selectedType.is_active,
      })
    }
  }, [selectedType, editDialogOpen, editForm])

  // Filtered data
  const filteredTypes = useMemo(() => {
    if (!types) return []
    return types.filter(type => {
      const matchesSearch = 
        type.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        type.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (type.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ?? false)
      const matchesStatus = showInactive || type.is_active
      return matchesSearch && matchesStatus
    })
  }, [types, debouncedSearchTerm, showInactive])

  // Statistics
  const stats = useMemo(() => ({
    total: types?.length || 0,
    active: types?.filter(t => t.is_active).length || 0,
    inactive: types?.filter(t => !t.is_active).length || 0,
  }), [types])

  // Handlers
  const handleCreate = () => {
    createForm.reset()
    setCreateDialogOpen(true)
  }

  const handleEdit = (type: LicenseType) => {
    setSelectedType(type)
    setEditDialogOpen(true)
  }

  const handleDelete = (type: LicenseType) => {
    setSelectedType(type)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (!selectedType) return
    deleteMutation(selectedType.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSelectedType(null)
      },
      onError: () => {
        setDeleteDialogOpen(false)
        setSelectedType(null)
      },
    })
  }

  const handleCreateSubmit = (data: LicenseTypeInsert) => {
    const dataToSend = {
      ...data,
      description: data.description === '' ? null : data.description,
    }
    createLicenseType(dataToSend as LicenseTypeInsert, {
      onSuccess: () => {
        setCreateDialogOpen(false)
        createForm.reset()
      }
    })
  }

  const handleEditSubmit = (data: LicenseTypeUpdate) => {
    if (!selectedType) return
    const dataToSend = {
      ...data,
      id: selectedType.id,
      description: data.description === '' ? null : data.description,
    }
    updateLicenseType(dataToSend as LicenseTypeUpdate, {
      onSuccess: () => {
        setEditDialogOpen(false)
        setSelectedType(null)
        editForm.reset()
      }
    })
  }

  const handleExport = async (format: 'csv' | 'xlsx' = 'csv') => {
    try {
      const response = await fetch(
        `/api/license-types/export?format=${format}&includeInactive=${showInactive}`
      )
      if (!response.ok) throw new Error('Erreur lors de l\'export')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `types-licences-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  // Loading & Error states
  if (isLoading) {
    return <ListPageSkeleton showStats={true} showFilters={true} statsCount={3} tableRows={5} tableColumns={5} />
  }

  if (error) {
    return <div className="p-6 text-red-600">Erreur: {error}</div>
  }

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCreate} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {t('buttons.newType')}
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline" size="lg">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('stats.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('stats.active')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('stats.inactive')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          variant={showInactive ? "secondary" : "outline"}
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? t('buttons.hideInactive') : t('buttons.showInactive')}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.columns.name')}</TableHead>
                <TableHead>{t('table.columns.code')}</TableHead>
                <TableHead>{t('table.columns.description')}</TableHead>
                <TableHead>{t('table.columns.status')}</TableHead>
                <TableHead>{t('table.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.code}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={type.description || ''}>
                      {type.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.is_active ? 'success' : 'secondary'}>
                      {type.is_active ? t('status.active') : t('status.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(type)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('table.actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(type)}
                          className="text-red-600 focus:text-red-600"
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('table.actions.delete') || 'Supprimer'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dialogs.create.title') || 'Créer un type de licence'}</DialogTitle>
            <DialogDescription>
              {t('dialogs.create.description') || 'Créez un nouveau type de licence pour organiser vos licences.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('form.name.label') || 'Nom'}</Label>
                <Input
                  id="name"
                  {...createForm.register('name')}
                  placeholder={t('form.name.placeholder') || 'Ex: Logiciel'}
                />
                {createForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">{t('form.code') || 'Code'}</Label>
                <Input
                  id="code"
                  {...createForm.register('code')}
                  placeholder={t('form.code.placeholder') || 'Ex: SOFTWARE'}
                />
                {createForm.formState.errors.code && (
                  <p className="text-red-500 text-sm">{createForm.formState.errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('form.description') || 'Description'}</Label>
                <Textarea
                  id="description"
                  {...createForm.register('description')}
                  placeholder={t('form.description.placeholder') || 'Description du type de licence'}
                />
                {createForm.formState.errors.description && (
                  <p className="text-red-500 text-sm">{createForm.formState.errors.description.message}</p>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-4 justify-between">
                <Label htmlFor="is-active">{t('form.isActive') || 'Type de licence actif'}</Label>
                <Controller
                  control={createForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <Switch
                      id="is-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {t('form.actions.cancel') || 'Annuler'}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  t('form.actions.create') || 'Créer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dialogs.edit.title') || 'Modifier le type de licence'}</DialogTitle>
            <DialogDescription>
              {t('dialogs.edit.description') || 'Modifiez les informations du type de licence.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('form.name') || 'Nom'}</Label>
                <Input
                  id="edit-name"
                  {...editForm.register('name')}
                  placeholder={t('form.name.placeholder') || 'Ex: Logiciel'}
                />
                {editForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">{t('form.code.label') || 'Code'}</Label>
                <Input
                  id="edit-code"
                  {...editForm.register('code')}
                  placeholder={t('form.code.placeholder') || 'Ex: SOFTWARE'}
                />
                {editForm.formState.errors.code && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('form.description.label') || 'Description'}</Label>
                <Textarea
                  id="edit-description"
                  {...editForm.register('description')}
                  placeholder={t('form.description.placeholder') || 'Description du type de licence'}
                />
                {editForm.formState.errors.description && (
                  <p className="text-red-500 text-sm">{editForm.formState.errors.description.message}</p>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-4 justify-between">
                <Label htmlFor="edit-is-active">{t('form.isActive') || 'Type de licence actif'}</Label>
                <Controller
                  control={editForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <Switch
                      id="edit-is-active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t('form.actions.cancel') || 'Annuler'}
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Modification...
                  </>
                ) : (
                  t('form.actions.save') || 'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialogs.delete.title') || 'Confirmer la suppression'}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center space-x-2 text-yellow-600 mt-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Attention:</span>
              </div>
              <p className="mt-2">
                {t('dialogs.delete.confirm') || 'Voulez-vous vraiment supprimer le type de licence : '}
                <span className="font-bold text-foreground">{selectedType?.name}</span> ?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cette action est irréversible.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t('form.actions.cancel') || 'Annuler'}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : t('dialogs.delete.title') || 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
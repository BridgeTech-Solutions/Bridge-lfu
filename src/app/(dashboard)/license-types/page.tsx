'use client'

import { useForm } from 'react-hook-form'
import { useState, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { licenseTypeCreateSchema, licenseTypeUpdateSchema } from '@/lib/validations'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { useLicenseTypes, useCreateLicenseType, useUpdateLicenseType, type LicenseType, type LicenseTypeInsert, type LicenseTypeUpdate } from '@/hooks/useLicenseTypes'
import { useDebounce } from '@/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import { Plus, Search, MoreHorizontal, Edit, Eye, Download } from 'lucide-react'
import { ListPageSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function LicenseTypesPage() {
  const { t } = useTranslations('licenseTypes')
  const router = useRouter()
  const { data: types, isLoading, error } = useLicenseTypes()
  const { create: createLicenseType, isCreating } = useCreateLicenseType()
  const { update: updateLicenseType, isUpdating } = useUpdateLicenseType()

  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // États pour les modales de création et modification
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<LicenseType | null>(null)

  const createForm = useForm<LicenseTypeInsert>({
    resolver: zodResolver(licenseTypeCreateSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      is_active: true,
    },
  })

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

  const { handleSubmit: handleCreateSubmit, register: registerCreate, formState: { errors: createErrors }, reset: resetCreate } = createForm
  const { handleSubmit: handleEditSubmit, register: registerEdit, formState: { errors: editErrors }, reset: resetEdit } = editForm

  // Gestionnaires pour les modales
  const handleCreateClick = () => {
    resetCreate()
    setCreateDialogOpen(true)
  }

  const handleEditClick = (type: LicenseType) => {
    setEditingType(type)
    resetEdit({
      id: type.id,
      name: type.name,
      code: type.code,
      description: type.description || '',
      is_active: type.is_active,
    })
    setEditDialogOpen(true)
  }

  const handleModalClose = () => {
    setCreateDialogOpen(false)
    setEditDialogOpen(false)
    setEditingType(null)
    resetCreate()
    resetEdit()
  }

  // Wrapper pour gérer le cast de type en toute sécurité
  const handleCreateSubmitWrapper = (data: LicenseTypeInsert) => {
    return createLicenseType(data)
  }

  // Utiliser useDebounce pour différer la recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Filtrage optimisé avec useMemo
  const filteredTypes = useMemo(() => {
    if (!types) return []

    return types.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           type.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           (type.description && type.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

      const matchesStatus = showInactive || type.is_active

      return matchesSearch && matchesStatus
    })
  }, [types, debouncedSearchTerm, showInactive])

  const handleExport = async (format: 'csv' | 'xlsx' = 'csv') => {
    try {
      const response = await fetch(`/api/license-types/export?format=${format}&includeInactive=${showInactive}`);
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `types-licences-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      // Ici vous pourriez afficher un toast d'erreur
    }
  }

  if (isLoading) {
    return <ListPageSkeleton showStats={true} showFilters={true} statsCount={3} tableRows={5} tableColumns={5} />
  }

  if (error) {
    return <div className="p-6 text-red-600">Erreur: {error}</div>
  }

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCreateClick} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {t('buttons.newType')}
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline" size="lg">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('stats.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{types?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('stats.active')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {types?.filter(t => t.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('stats.inactive')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {types?.filter(t => !t.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
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

      {/* Tableau */}
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
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/license-types/${type.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('table.actions.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(type)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t('table.actions.edit')}
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

      {/* Modal de création */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dialogs.create.title') || 'Créer un type de licence'}</DialogTitle>
            <DialogDescription>
              {t('dialogs.create.description') || 'Créez un nouveau type de licence pour organiser vos licences.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('form.name') || 'Nom'}</Label>
              <Input
                id="name"
                {...registerCreate('name')}
                placeholder={t('form.name.placeholder') || 'Ex: Logiciel'}
              />
              {createErrors.name && <p className="text-red-500 text-sm">{createErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">{t('form.code') || 'Code'}</Label>
              <Input
                id="code"
                {...registerCreate('code')}
                placeholder={t('form.code.placeholder') || 'Ex: SOFTWARE'}
              />
              {createErrors.code && <p className="text-red-500 text-sm">{createErrors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('form.description') || 'Description'}</Label>
              <Textarea
                id="description"
                {...registerCreate('description')}
                placeholder={t('form.description.placeholder') || 'Description du type de licence'}
              />
              {createErrors.description && <p className="text-red-500 text-sm">{createErrors.description.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleModalClose}>
              {t('form.actions.cancel') || 'Annuler'}
            </Button>
            <Button
              type="button"
              onClick={handleCreateSubmit((data) => {
                handleCreateSubmitWrapper(data)
              })}
              disabled={isCreating}
            >
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
        </DialogContent>
      </Dialog>

      {/* Modal de modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dialogs.edit.title') || 'Modifier le type de licence'}</DialogTitle>
            <DialogDescription>
              {t('dialogs.edit.description') || 'Modifiez les informations du type de licence.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('form.name') || 'Nom'}</Label>
              <Input
                id="edit-name"
                {...registerEdit('name')}
                placeholder={t('form.name.placeholder') || 'Ex: Logiciel'}
              />
              {editErrors.name && <p className="text-red-500 text-sm">{editErrors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">{t('form.code') || 'Code'}</Label>
              <Input
                id="edit-code"
                {...registerEdit('code')}
                placeholder={t('form.code.placeholder') || 'Ex: SOFTWARE'}
              />
              {editErrors.code && <p className="text-red-500 text-sm">{editErrors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('form.description') || 'Description'}</Label>
              <Textarea
                id="edit-description"
                {...registerEdit('description')}
                placeholder={t('form.description.placeholder') || 'Description du type de licence'}
              />
              {editErrors.description && <p className="text-red-500 text-sm">{editErrors.description.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleModalClose}>
              {t('form.actions.cancel') || 'Annuler'}
            </Button>
            <Button
              type="button"
              onClick={handleEditSubmit((data) => editingType && updateLicenseType({...data, id: editingType.id}))}
              disabled={isUpdating}
            >
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

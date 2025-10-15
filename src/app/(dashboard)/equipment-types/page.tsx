'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes'
import { useAuthPermissions, useDebounce } from '@/hooks'
import { useTranslations } from '@/hooks/useTranslations'
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  Eye,
  EyeOff,
  Monitor,
  Server,
  Router,
  Network,
  Printer,
  Shield,
  Wifi,
  Phone,
  Tablet,
  HelpCircle,
  Laptop,
  HardDrive,
  Smartphone,
  Watch,
  Camera,
  Headphones,
  Keyboard,
  Mouse,
  Cpu,
  MemoryStick,
  type LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import  Textarea  from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { EquipmentTypeItem } from '@/hooks/useEquipmentTypes'

interface FormData {
  name: string
  code: string
  description: string
  icon: string
  is_active: boolean
}

const INITIAL_FORM_STATE: FormData = {
  name: '',
  code: '',
  description: '',
  icon: '',
  is_active: true
}

// Liste des icônes disponibles
const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Monitor', icon: Monitor },
  { name: 'Server', icon: Server },
  { name: 'Router', icon: Router },
  { name: 'Network', icon: Network },
  { name: 'Printer', icon: Printer },
  { name: 'Shield', icon: Shield },
  { name: 'Wifi', icon: Wifi },
  { name: 'Phone', icon: Phone },
  { name: 'Tablet', icon: Tablet },
  { name: 'Laptop', icon: Laptop },
  { name: 'HardDrive', icon: HardDrive },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Watch', icon: Watch },
  { name: 'Camera', icon: Camera },
  { name: 'Headphones', icon: Headphones },
  { name: 'Keyboard', icon: Keyboard },
  { name: 'Mouse', icon: Mouse },
  { name: 'Cpu', icon: Cpu },
  { name: 'MemoryStick', icon: MemoryStick },
  { name: 'HelpCircle', icon: HelpCircle },
]

export default function EquipmentTypesPage() {
  const { t } = useTranslations('equipmentTypes')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [editingType, setEditingType] = useState<EquipmentTypeItem | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE)

  const permissions = useAuthPermissions()
  const canCreate = permissions.can('create', 'equipment')
  const canUpdate = permissions.can('update', 'equipment')
  const canDelete = permissions.can('delete', 'equipment')

  const { 
    types, 
    loading, 
    stats,
    createType, 
    updateType, 
    deleteType,
    isCreating,
    isUpdating,
    isDeleting,
    refetch
  } = useEquipmentTypes({
    search: debouncedSearch,
    includeInactive: showInactive
  })

  const handleOpenModal = (type?: EquipmentTypeItem) => {
    if (type) {
      setEditingType(type)
      setFormData({
        name: type.name,
        code: type.code,
        description: type.description || '',
        icon: type.icon || '',
        is_active: type.is_active
      })
    } else {
      setEditingType(null)
      setFormData(INITIAL_FORM_STATE)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingType(null)
    setFormData(INITIAL_FORM_STATE)
    setShowIconPicker(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingType) {
        await updateType({
          id: editingType.id,
          data: {
            ...formData,
            description: formData.description || null,
            icon: formData.icon || null
          }
        })
      } else {
        await createType({
          ...formData,
          description: formData.description || null,
          icon: formData.icon || null
        })
      }
      handleCloseModal()
      refetch()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const handleDelete = async (type: EquipmentTypeItem) => {
    const confirmMsg = type.is_active 
      ? t('confirmations.disable').replace('{{name}}', type.name)
      : t('confirmations.delete').replace('{{name}}', type.name)
    
    if (!confirm(confirmMsg)) {
      return
    }

    try {
      await deleteType({ id: type.id })
      refetch()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.active')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.inactive')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'actions */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchInput}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showInactive ? t('buttons.hideInactive') : t('buttons.showInactive')}
            </Button>

            {canCreate && (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('buttons.newType')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des types */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.columns.name')}</TableHead>
                <TableHead>{t('table.columns.code')}</TableHead>
                <TableHead>{t('table.columns.description')}</TableHead>
                <TableHead>{t('table.columns.status')}</TableHead>
                <TableHead className="text-right">{t('table.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                types.map((type) => (
                  <TableRow key={type.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {type.icon && (() => {
                          const IconComponent = AVAILABLE_ICONS.find((item) => item.name === type.icon)?.icon
                          return IconComponent ? <IconComponent className="h-5 w-5 text-muted-foreground" /> : null
                        })()}
                        <span className="text-sm font-medium text-foreground">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold uppercase">
                        {type.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {type.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? 'success' : 'secondary'}>
                        {type.is_active ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(type)}
                            disabled={isUpdating}
                            title={t('table.actions.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(type)}
                            disabled={isDeleting}
                            title={type.is_active ? t('table.actions.disable') : t('table.actions.delete')}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : handleCloseModal())}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingType ? t('modal.editTitle') : t('modal.createTitle')}</DialogTitle>
            <DialogDescription>{t('modal.description')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type-name">{t('modal.fields.name.label')} {t('modal.fields.name.required')}</Label>
              <Input
                id="type-name"
                type="text"
                required
                value={formData.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={t('modal.fields.name.placeholder')}
              />
            </div>

            <div>
              <Label htmlFor="type-code">{t('modal.fields.code.label')} {t('modal.fields.code.required')}</Label>
              <Input
                id="type-code"
                type="text"
                required
                value={formData.code}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
                placeholder={t('modal.fields.code.placeholder')}
                maxLength={10}
              />
            </div>

            <div>
              <Label htmlFor="type-description">{t('modal.fields.description.label')}</Label>
              <Textarea
                id="type-description"
                value={formData.description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder={t('modal.fields.description.placeholder')}
                rows={3}
              />
            </div>

            <div>
              <Label>{t('modal.fields.icon.label')}</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                >
                  <div className="flex items-center gap-2">
                    {formData.icon && (() => {
                      const IconComponent = AVAILABLE_ICONS.find((item) => item.name === formData.icon)?.icon
                      return IconComponent ? <IconComponent className="h-5 w-5 text-muted-foreground" /> : null
                    })()}
                    <span className="text-sm text-foreground">
                      {formData.icon || t('modal.fields.icon.placeholder')}
                    </span>
                  </div>
                  <span className="text-muted-foreground">▼</span>
                </Button>

                {showIconPicker && (
                  <div className="absolute z-10 mt-2 w-full bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                        <Button
                          key={name}
                          type="button"
                          variant={formData.icon === name ? 'secondary' : 'ghost'}
                          className={cn(
                            'flex flex-col items-center justify-center gap-2 border',
                            formData.icon === name ? 'border-primary' : 'border-border'
                          )}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, icon: name }))
                            setShowIconPicker(false)
                          }}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-xs truncate w-full text-center">{name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="type-active">{t('modal.fields.isActive')}</Label>
              <Switch
                id="type-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                {t('modal.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? t('modal.actions.saving') : t('modal.actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
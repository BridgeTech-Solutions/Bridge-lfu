'use client'

import { useMemo, useState } from 'react'
import { useEquipmentBrands } from '@/hooks/useEquipmentBrands'
import { useAuthPermissions, useDebounce } from '@/hooks'
import { useTranslations } from '@/hooks/useTranslations'
import { Plus, Search, Edit2, Trash2, Mail, Phone, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Textarea from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ListPageSkeleton } from '@/components/ui/skeleton'
import type { EquipmentBrand } from '@/types'

interface FormData {
  name: string
  website: string
  supportEmail: string
  supportPhone: string
  notes: string
  isActive: boolean
}

const INITIAL_FORM_STATE: FormData = {
  name: '',
  website: '',
  supportEmail: '',
  supportPhone: '',
  notes: '',
  isActive: true,
}

export default function EquipmentBrandsPage() {
  const { t } = useTranslations('equipmentBrands')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<EquipmentBrand | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE)

  const permissions = useAuthPermissions()
  const canCreate = permissions.can('create', 'equipment_brands')
  const canUpdate = permissions.can('update', 'equipment_brands')
  const canDelete = permissions.can('delete', 'equipment_brands')

  const {
    brands,
    loading,
    stats,
    createBrand,
    updateBrand,
    deleteBrand,
    isCreating,
    isUpdating,
    isDeleting,
    refetch,
  } = useEquipmentBrands({
    search: debouncedSearch,
    includeInactive: showInactive,
  })

  const displayedBrands = useMemo(() => brands, [brands])

  const handleOpenModal = (brand?: EquipmentBrand) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({
        name: brand.name,
        website: brand.website || '',
        supportEmail: brand.support_email || '',
        supportPhone: brand.support_phone || '',
        notes: brand.notes || '',
        isActive: brand.is_active ?? true,
      })
    } else {
      setEditingBrand(null)
      setFormData(INITIAL_FORM_STATE)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBrand(null)
    setFormData(INITIAL_FORM_STATE)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      name: formData.name.trim(),
      website: formData.website.trim() || null,
      supportEmail: formData.supportEmail.trim() || null,
      supportPhone: formData.supportPhone.trim() || null,
      notes: formData.notes.trim() || null,
      isActive: formData.isActive,
    }

    if (!payload.name) return

    try {
      if (editingBrand) {
        await updateBrand({
          id: editingBrand.id,
          data: payload,
        })
      } else {
        await createBrand(payload)
      }
      handleCloseModal()
      refetch()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la marque:', error)
    }
  }

  const handleDelete = async (brand: EquipmentBrand) => {
    const confirmMessage = brand.is_active
      ? t('confirmations.disable').replace('{{name}}', brand.name)
      : t('confirmations.delete').replace('{{name}}', brand.name)

    if (!confirm(confirmMessage)) return

    try {
      await deleteBrand({ id: brand.id })
      refetch()
    } catch (error) {
      console.error('Erreur lors de la suppression de la marque:', error)
    }
  }

  if (loading) {
    return <ListPageSkeleton showStats={true} showFilters={true} statsCount={3} tableRows={5} tableColumns={5} />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.active')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.inactive')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? t('buttons.hideInactive') : t('buttons.showInactive')}
            </Button>

            {canCreate && (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('buttons.newBrand')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3">{t('table.columns.name')}</TableHead>
                <TableHead className="px-6 py-3">{t('table.columns.contact')}</TableHead>
                <TableHead className="px-6 py-3">{t('table.columns.website')}</TableHead>
                <TableHead className="px-6 py-3">{t('table.columns.status')}</TableHead>
                {canUpdate && (
                <TableHead className="px-6 py-3 text-right">{t('table.columns.actions')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedBrands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                displayedBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="px-6 py-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {brand.name}
                        </span>
                        {brand.notes && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {brand.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 align-top">
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {brand.support_email && (
                          <span className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            {brand.support_email}
                          </span>
                        )}
                        {brand.support_phone && (
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            {brand.support_phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          {brand.website}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant={brand.is_active ? 'success' : 'secondary'}>
                        {brand.is_active ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenModal(brand)}
                            disabled={isUpdating}
                            title={t('table.actions.edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDelete(brand)}
                            disabled={isDeleting}
                            title={brand.is_active ? t('table.actions.disable') : t('table.actions.delete')}
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

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal()
          } else {
            setIsModalOpen(true)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? t('modal.editTitle') : t('modal.createTitle')}
              </DialogTitle>
              <DialogDescription>{t('modal.description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">
                  {t('modal.fields.name.label')} {t('modal.fields.name.required')}
                </Label>
                <Input
                  id="brand-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder={t('modal.fields.name.placeholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-support-email">
                    {t('modal.fields.supportEmail.label')}
                  </Label>
                  <Input
                    id="brand-support-email"
                    type="email"
                    value={formData.supportEmail}
                    onChange={(event) => setFormData({ ...formData, supportEmail: event.target.value })}
                    placeholder={t('modal.fields.supportEmail.placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand-support-phone">
                    {t('modal.fields.supportPhone.label')}
                  </Label>
                  <Input
                    id="brand-support-phone"
                    type="text"
                    value={formData.supportPhone}
                    onChange={(event) => setFormData({ ...formData, supportPhone: event.target.value })}
                    placeholder={t('modal.fields.supportPhone.placeholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-website">
                  {t('modal.fields.website.label')}
                </Label>
                <Input
                  id="brand-website"
                  type="url"
                  value={formData.website}
                  onChange={(event) => setFormData({ ...formData, website: event.target.value })}
                  placeholder={t('modal.fields.website.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-notes">
                  {t('modal.fields.notes.label')}
                </Label>
                <Textarea
                  id="brand-notes"
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  placeholder={t('modal.fields.notes.placeholder')}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('modal.fields.isActive.label')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.isActive ? t('status.active') : t('status.inactive')}
                  </p>
                </div>
                <Switch
                  id="brand-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                {t('modal.actions.cancel')}
              </Button>
              <Button
                type="submit"
                loading={editingBrand ? isUpdating : isCreating}
              >
                {editingBrand ? t('modal.actions.save') : t('modal.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

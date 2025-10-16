'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useLicenseSuppliers } from '@/hooks/useLicenseSuppliers'
import { useAuthPermissions, useDebounce } from '@/hooks'
import { useTranslations } from '@/hooks/useTranslations'
import {
  Plus,
  Search,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit
} from 'lucide-react'
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
import type { LicenseSupplier } from '@/types'

interface FormData {
  name: string
  contactEmail: string
  contactPhone: string
  website: string
  address: string
  notes: string
  isActive: boolean
}

const INITIAL_FORM_STATE: FormData = {
  name: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  address: '',
  notes: '',
  isActive: true,
}

export default function LicenseSuppliersPage() {
  const { t } = useTranslations('licenseSuppliers')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<LicenseSupplier | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE)

  const permissions = useAuthPermissions()
  const canCreate = permissions.can('create', 'license_suppliers')
  const canUpdate = permissions.can('update', 'license_suppliers')
  const canDelete = permissions.can('delete', 'license_suppliers')

  const {
    suppliers,
    loading,
    stats,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    isCreating,
    isUpdating,
    isDeleting,
    refetch,
  } = useLicenseSuppliers({
    search: debouncedSearch,
    includeInactive: showInactive,
  })

  const displayedSuppliers = useMemo(() => suppliers, [suppliers])

  const handleOpenModal = (supplier?: LicenseSupplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        contactEmail: supplier.contact_email || '',
        contactPhone: supplier.contact_phone || '',
        website: supplier.website || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
        isActive: supplier.is_active ?? true,
      })
    } else {
      setEditingSupplier(null)
      setFormData(INITIAL_FORM_STATE)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
    setFormData(INITIAL_FORM_STATE)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const payload = {
      name: formData.name.trim(),
      contactEmail: formData.contactEmail.trim() || null,
      contactPhone: formData.contactPhone.trim() || null,
      website: formData.website.trim() || null,
      address: formData.address.trim() || null,
      notes: formData.notes.trim() || null,
      isActive: formData.isActive,
    }

    if (!payload.name) return

    try {
      if (editingSupplier) {
        await updateSupplier({
          id: editingSupplier.id,
          data: payload,
        })
      } else {
        await createSupplier(payload)
      }
      handleCloseModal()
      refetch()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du fournisseur:', error)
    }
  }

  const handleDelete = async (supplier: LicenseSupplier) => {
    const confirmMessage = supplier.is_active
      ? t('confirmations.disable').replace('{{name}}', supplier.name)
      : t('confirmations.delete').replace('{{name}}', supplier.name)

    if (!confirm(confirmMessage)) return

    try {
      await deleteSupplier({ id: supplier.id })
      refetch()
    } catch (error) {
      console.error('Erreur lors de la suppression du fournisseur:', error)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
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
              {showInactive ? t('buttons.hideInactive') : t('buttons.showInactive')}
            </Button>

            {canCreate && (
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('buttons.newSupplier')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.columns.name')}</TableHead>
                <TableHead>{t('table.columns.contact')}</TableHead>
                <TableHead>{t('table.columns.details')}</TableHead>
                <TableHead>{t('table.columns.status')}</TableHead>
                {canUpdate && (
                <TableHead className="text-right">{t('table.columns.actions')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                displayedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{supplier.name}</span>
                        {supplier.notes && (
                          <span className="text-xs text-muted-foreground mt-1">{supplier.notes}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {supplier.contact_email && (
                          <span className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            {supplier.contact_email}
                          </span>
                        )}
                        {supplier.contact_phone && (
                          <span className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            {supplier.contact_phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-muted-foreground max-w-xs">
                        {supplier.website && (
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-indigo-500" />
                            <a
                              href={supplier.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              {supplier.website}
                            </a>
                          </span>
                        )}
                        {supplier.address && (
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            {supplier.address}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? 'success' : 'secondary'}>
                        {supplier.is_active ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(supplier)}
                            disabled={isUpdating}
                            title={t('table.actions.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier)}
                            disabled={isDeleting}
                            title={supplier.is_active ? t('table.actions.disable') : t('table.actions.delete')}
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

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : handleCloseModal())}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? t('modal.editTitle') : t('modal.createTitle')}</DialogTitle>
            <DialogDescription>{t('modal.description')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="supplier-name">{t('modal.fields.name.label')} {t('modal.fields.name.required')}</Label>
              <Input
                id="supplier-name"
                type="text"
                required
                value={formData.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={t('modal.fields.name.placeholder')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier-email">{t('modal.fields.contactEmail.label')}</Label>
                <Input
                  id="supplier-email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, contactEmail: event.target.value }))
                  }
                  placeholder={t('modal.fields.contactEmail.placeholder')}
                />
              </div>
              <div>
                <Label htmlFor="supplier-phone">{t('modal.fields.contactPhone.label')}</Label>
                <Input
                  id="supplier-phone"
                  type="text"
                  value={formData.contactPhone}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, contactPhone: event.target.value }))
                  }
                  placeholder={t('modal.fields.contactPhone.placeholder')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplier-website">{t('modal.fields.website.label')}</Label>
              <Input
                id="supplier-website"
                type="url"
                value={formData.website}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, website: event.target.value }))
                }
                placeholder={t('modal.fields.website.placeholder')}
              />
            </div>

            <div>
              <Label htmlFor="supplier-address">{t('modal.fields.address.label')}</Label>
              <Textarea
                id="supplier-address"
                value={formData.address}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder={t('modal.fields.address.placeholder')}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{t('modal.fields.status.label')}</Label>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {formData.isActive ? t('modal.fields.status.active') : t('modal.fields.status.inactive')}
                </span>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                  aria-label={t('modal.fields.status.label')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                {t('modal.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) ? <LoadingSpinner size="sm" /> : t('modal.actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useLicenseSuppliers } from '@/hooks/useLicenseSuppliers'
import { useAuthPermissions, useDebounce } from '@/hooks'
import { useTranslations } from '@/hooks/useTranslations'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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

  const handleSubmit = async (event: React.FormEvent) => {
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
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('stats.total')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('stats.active')}</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('stats.inactive')}</p>
          <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                'px-4 py-2 rounded-lg border transition-colors flex items-center gap-2',
                showInactive
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {showInactive ? t('buttons.hideInactive') : t('buttons.showInactive')}
            </button>

            {canCreate && (
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('buttons.newSupplier')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.contact')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.details')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.status')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedSuppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              displayedSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {supplier.name}
                      </span>
                      {supplier.notes && (
                        <span className="text-xs text-gray-500 mt-1">
                          {supplier.notes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1 text-sm text-gray-600">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1 text-sm text-gray-600 max-w-xs">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-semibold rounded',
                        supplier.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {supplier.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <button
                          onClick={() => handleOpenModal(supplier)}
                          disabled={isUpdating}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title={t('table.actions.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(supplier)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title={supplier.is_active ? t('table.actions.disable') : t('table.actions.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSupplier ? t('modal.editTitle') : t('modal.createTitle')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.fields.name.label')} {t('modal.fields.name.required')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('modal.fields.name.placeholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('modal.fields.contactEmail.label')}
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(event) => setFormData({ ...formData, contactEmail: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('modal.fields.contactEmail.placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('modal.fields.contactPhone.label')}
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(event) => setFormData({ ...formData, contactPhone: event.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('modal.fields.contactPhone.placeholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.fields.website.label')}
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(event) => setFormData({ ...formData, website: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('modal.fields.website.placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.fields.address.label')}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('modal.fields.address.placeholder')}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.fields.notes.label')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('modal.fields.notes.placeholder')}
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.isActive}
                  onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  {t('modal.fields.isActive')}
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('modal.actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isCreating || isUpdating ? t('modal.actions.saving') : t('modal.actions.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

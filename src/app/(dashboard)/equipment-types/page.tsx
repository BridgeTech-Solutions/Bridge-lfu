'use client'

import { useState } from 'react'
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

      {/* Barre d'actions */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                "px-4 py-2 rounded-lg border transition-colors flex items-center gap-2",
                showInactive
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showInactive ? t('buttons.hideInactive') : t('buttons.showInactive')}
            </button>

            {canCreate && (
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('buttons.newType')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des types */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.code')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.columns.description')}
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
            {types.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              types.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {type.icon && (() => {
                        const IconComponent = AVAILABLE_ICONS.find(i => i.name === type.icon)?.icon
                        return IconComponent ? <IconComponent className="h-5 w-5 text-gray-600" /> : null
                      })()}
                      <span className="text-sm font-medium text-gray-900">
                        {type.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                      {type.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {type.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 text-xs font-semibold rounded",
                      type.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    )}>
                      {type.is_active ? t('status.active') : t('status.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {canUpdate && (
                        <button
                          onClick={() => handleOpenModal(type)}
                          disabled={isUpdating}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title={t('table.actions.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(type)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title={type.is_active ? t('table.actions.disable') : t('table.actions.delete')}
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

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingType ? t('modal.editTitle') : t('modal.createTitle')}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('modal.fields.name.placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.fields.code.label')} {t('modal.fields.code.required')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('modal.fields.code.placeholder')}
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.fields.description.label')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('modal.fields.description.placeholder')}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('modal.fields.icon.label')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {formData.icon && (() => {
                        const IconComponent = AVAILABLE_ICONS.find(i => i.name === formData.icon)?.icon
                        return IconComponent ? <IconComponent className="h-5 w-5 text-gray-600" /> : null
                      })()}
                      <span className="text-gray-700">
                        {formData.icon || t('modal.fields.icon.placeholder')}
                      </span>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showIconPicker && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-4 gap-2 p-3">
                        {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, icon: name })
                              setShowIconPicker(false)
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:bg-blue-50",
                              formData.icon === name
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            )}
                            title={name}
                          >
                            <Icon className="h-6 w-6 text-gray-700" />
                            <span className="text-xs mt-1 text-gray-600 truncate w-full text-center">
                              {name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
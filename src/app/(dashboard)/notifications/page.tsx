'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Settings, 
  Filter, 
  Search, 
  CheckCheck, 
  Trash2,
  AlertTriangle,
  Shield,
  Server,
  Info,
  UserPlus,
  Eye,
  EyeOff,
  Calendar,
  MoreVertical
} from 'lucide-react'

import { 
  useNotifications, 
  useNotificationStats, 
  useNotificationSettings,
  useNotificationFilters,
  Notification,
  NotificationSettings
} from '@/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/hooks/useTranslations'


// Composant principal
export default function NotificationsPage() {

  const { user,loading: userLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslations('notifications.page')

  
  // États
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all')
  const [showFilters, setShowFilters] = useState(false)
   // Utilisez le hook de filtres pour gérer l'état
  const { filters, updateFilter, setAllNotifications, setUnreadOnly } = useNotificationFilters();
 // Utilisez les hooks pour les statistiques, les notifications et les paramètres
  const { data: stats, isLoading: statsLoading } = useNotificationStats();

  const {
    notifications: notificationsData,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    pagination,
    isMarkingAsRead,
    isDeleting,
    isMarkingAllRead,
  } = useNotifications(filters);

  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    isUpdating
  } = useNotificationSettings();

  const handleUpdateSettings = (settings: Partial<NotificationSettings>) => {
    // Use a fallback for any settings that might be missing
    const completeSettings = {
      licenseAlertDays: settings.license_alert_days ?? [], // Provide a default empty array
      equipmentAlertDays: settings.equipment_alert_days ?? [], // Provide a default empty array
      emailEnabled: settings.email_enabled ?? false, // Provide a default false value
    };
    
    // Now, call the useMutation function with the complete object
    updateSettings(completeSettings);
  };
  // Fonctions utilitaires
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'license_expiry': return <Shield className="h-5 w-5 text-orange-500" />
      case 'equipment_obsolescence': return <Server className="h-5 w-5 text-red-500" />
      case 'new_unverified_user': return <UserPlus className="h-5 w-5 text-blue-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'license_expiry': return 'Expiration licence'
      case 'equipment_obsolescence': return 'Obsolescence équipement'
      case 'new_unverified_user': return 'Nouvel utilisateur'
      default: return 'Général'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fonction pour naviguer vers les détails
  const handleNotificationClick = (notification: Notification) => {
    if (notification.related_id && notification.related_type) {
      if (notification.related_type === 'license') {
        router.push(`/licenses/${notification.related_id}`)
      } else if (notification.related_type === 'equipment') {
        router.push(`/equipment/${notification.related_id}`)
      }
    }
  }

  // Effet pour mettre à jour les filtres selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'unread') {
      setUnreadOnly();
    } else if (activeTab === 'all') {
      setAllNotifications();
    }
    // Note : Pas besoin de gérer les filtres pour 'settings' ici car le hook useNotifications ne sera pas activé.
  }, [activeTab, setUnreadOnly, setAllNotifications]);
  
    // Si l'utilisateur n'est pas authentifié, vous pouvez retourner un état de chargement ou une redirection.
  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-600">Chargement de l&apos;utilisateur...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {t('title')}
          </h1>
          {stats && (
            <p className="text-sm text-gray-600 mt-1">
              {t('unreadCount', {
                unread: stats.unread,
                total: stats.total,
                plural: stats.unread > 1 ? 's' : '',
                totalPlural: stats.total > 1 ? 's' : ''
              })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          {stats && stats.unread > 0 && (
            <button
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllRead}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              {t('actions.markAllAsRead')}
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition-colors",
              showFilters 
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="h-4 w-4" />
            {t('actions.filter')}
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats && !statsLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.unread')}</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.licenses')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.by_type.license_expiry}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('stats.equipment')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.by_type.equipment_obsolescence}</p>
              </div>
              <Server className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === 'all'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {t('tabs.all', { count: stats?.total || 0 })}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === 'unread'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {t('tabs.unread', { count: stats?.unread || 0 })}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === 'settings'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('tabs.settings')}
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && activeTab !== 'settings' && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('filters.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type */}
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('filters.typePlaceholder')}</option>
              <option value="license_expiry">{t('filters.typeOptions.license_expiry')}</option>
              <option value="equipment_obsolescence">{t('filters.typeOptions.equipment_obsolescence')}</option>
              <option value="general">{t('filters.typeOptions.general')}</option>
              <option value="new_unverified_user">{t('filters.typeOptions.new_unverified_user')}</option>
            </select>

            {/* Statut de lecture */}
            <select
              value={filters.is_read === undefined ? '' : filters.is_read.toString()}
              onChange={(e) =>updateFilter('is_read', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('filters.statusPlaceholder')}</option>
              <option value="false">{t('filters.statusOptions.unread')}</option>
              <option value="true">{t('filters.statusOptions.read')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'settings' ? (
        <NotificationSettingsPanel 
          settings={settings}
          onUpdate={handleUpdateSettings}
          isUpdating={isUpdating}
        />
      ) : (
        <NotificationsList
          notifications={notificationsData || []}
          isLoading={notificationsLoading}
          pagination={pagination}
          onPageChange={(page) => updateFilter('page', page)}
          onMarkAsRead={(id, isRead) => markAsRead({ id, isRead })}
          onDelete={(id) => deleteNotification(id)}
          // Les fonctions utilitaires peuvent rester ici ou être déplacées
          getNotificationIcon={getNotificationIcon}
          getNotificationTypeLabel={getNotificationTypeLabel}
          formatDate={formatDate}
          onNotificationClick={handleNotificationClick}
        />
      )}
    </div>
  )
}

// Composant Liste des notifications
function NotificationsList({
  notifications,
  isLoading,
  pagination,
  onPageChange,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getNotificationTypeLabel,
  formatDate,
  onNotificationClick
}: {
  notifications: Notification[]
  isLoading: boolean
  pagination: { page: number; totalPages: number; hasMore: boolean }
  onPageChange: (page: number) => void
  onMarkAsRead: (id: string, isRead: boolean) => void
  onDelete: (id: string) => void
  getNotificationIcon: (type: string) => React.ReactNode
  getNotificationTypeLabel: (type: string) => string
  formatDate: (date: string) => string
  onNotificationClick: (notification: Notification) => void
}) {
  const { t } = useTranslations('notifications.page')
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">{t('list.loading')}</span>
        </div>
      </div>
    )
  }

  if (!notifications.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('list.empty')}</h3>
        <p className="text-gray-600">{t('list.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Liste des notifications */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "p-4 hover:bg-gray-50 transition-colors cursor-pointer",
              !notification.is_read && "bg-blue-50 border-l-4 border-l-blue-500"
            )}
            onClick={() => onNotificationClick(notification)}
            title={t('list.actions.viewDetails')}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Icône */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      "text-sm font-medium truncate",
                      notification.is_read ? "text-gray-900" : "text-gray-900 font-semibold"
                    )}>
                      {notification.title}
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getNotificationTypeLabel(notification.type)}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  
                  <p className={cn(
                    "text-sm mb-2",
                    notification.is_read ? "text-gray-600" : "text-gray-700"
                  )}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(notification.created_at)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id, !notification.is_read); }}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title={notification.is_read ? t('list.actions.markAsUnread') : t('list.actions.markAsRead')}
                >
                  {notification.is_read ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title={t('list.actions.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center text-sm text-gray-700">
            {t('pagination.page', { current: pagination.page, total: pagination.totalPages })}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pagination.previous')}
            </button>
            
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant Paramètres des notifications
function NotificationSettingsPanel({
  settings,
  onUpdate,
  isUpdating
}: {
  settings?: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => void
  isUpdating: boolean
}) {
  const { t } = useTranslations('notifications.page')
  const [localSettings, setLocalSettings] = useState({
    license_alert_days: [7, 30],
    equipment_alert_days: [30, 90],
    email_enabled: true
  })

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        license_alert_days: settings.license_alert_days,
        equipment_alert_days: settings.equipment_alert_days,
        email_enabled: settings.email_enabled
      })
    }
  }, [settings])

  const handleSave = () => {
    onUpdate({
      license_alert_days: localSettings.license_alert_days,
      equipment_alert_days: localSettings.equipment_alert_days,
      email_enabled: localSettings.email_enabled
    })
  } 

  const addAlertDay = (type: 'license' | 'equipment') => {
    const key = type === 'license' ? 'license_alert_days' : 'equipment_alert_days'
    const newDay = prompt(`Ajouter une alerte ${type === 'license' ? 'licence' : 'équipement'} (nombre de jours):`)
    
    if (newDay && !isNaN(Number(newDay))) {
      const dayNumber = Number(newDay)
      if (dayNumber > 0 && dayNumber <= 365) {
        setLocalSettings(prev => ({
          ...prev,
          [key]: [...prev[key], dayNumber].sort((a, b) => a - b)
        }))
      }
    }
  }

  const removeAlertDay = (type: 'license' | 'equipment', day: number) => {
    const key = type === 'license' ? 'license_alert_days' : 'equipment_alert_days'
    setLocalSettings(prev => ({
      ...prev,
      [key]: prev[key].filter(d => d !== day)
    }))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.title')}</h2>
      
      <div className="space-y-6">
        {/* Notifications par email */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">{t('settings.emailLabel')}</h3>
            <p className="text-sm text-gray-600">{t('settings.emailDescription')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.email_enabled}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, email_enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Alertes licences */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('settings.licenseAlertsLabel')}</h3>
          <p className="text-sm text-gray-600 mb-3">{t('settings.licenseAlertsDescription')}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {localSettings.license_alert_days.map((day) => (
              <span
                key={day}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {day} {t('settings.daySuffix', { plural: day > 1 ? 's' : '' })}
                <button
                  onClick={() => removeAlertDay('license', day)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <button
            onClick={() => addAlertDay('license')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            {t('settings.addButton')}
          </button>
        </div>

        {/* Alertes équipements */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">{t('settings.equipmentAlertsLabel')}</h3>
          <p className="text-sm text-gray-600 mb-3">{t('settings.equipmentAlertsDescription')}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {localSettings.equipment_alert_days.map((day) => (
              <span
                key={day}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
              >
                {day} {t('settings.daySuffix', { plural: day > 1 ? 's' : '' })}
                <button
                  onClick={() => removeAlertDay('equipment', day)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <button
            onClick={() => addAlertDay('equipment')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            {t('settings.addButton')}
          </button>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {isUpdating ? t('settings.saving') : t('settings.saveButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
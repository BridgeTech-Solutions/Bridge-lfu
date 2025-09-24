'use client'

import { useState, useRef, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationStats, useNotifications, useNotificationFilters } from '@/hooks/useNotifications'
import { Bell, Search, User, Settings, LogOut, ChevronDown, Check, Trash2, Eye, EyeOff, Shield, Server, UserPlus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  // const { filters, updateFilter } = useNotificationFilters()
  // Créez des filtres spécifiques pour le menu déroulant
  const headerFilters = {
    page: 1,
    limit: 10, // Limite les notifications à 10
    is_read: false // Affiche uniquement les notifications non lues
  };
  const { notifications, markAsRead, deleteNotification, markAllAsRead, isMarkingAsRead, isDeleting, isMarkingAllRead } = useNotifications(headerFilters)
  const { data: stats, refetch: refetchStats } = useNotificationStats()

  if (!isOpen) return null

  const handleMarkAsRead = async (id: string, currentStatus: boolean) => {
    try {
      await markAsRead({ id, isRead: !currentStatus })
      toast.success(`Notification marquée comme ${!currentStatus ? 'lue' : 'non lue'}`)
      refetchStats()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la notification')
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      toast.success('Notification supprimée')
      refetchStats()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('Toutes les notifications marquées comme lues')
      refetchStats()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      console.error(error)
    }
  }


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'license_expiry': return <Shield className="h-5 w-5 text-orange-500" />
      case 'equipment_obsolescence': return <Server className="h-5 w-5 text-red-500" />
      case 'new_unverified_user': return <UserPlus className="h-5 w-5 text-blue-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'license_expiry':
        return 'text-orange-600'
      case 'equipment_obsolescence':
        return 'text-red-600'
      case 'new_unverified_user':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div className="py-1">
        {/* Header avec filtres */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Notifications
              {stats && (
                <span className="ml-2 text-xs text-gray-500">
                  ({stats.unread} non lue{stats.unread !== 1 ? 's' : ''})
                </span>
              )}
            </h3>
            <div className="flex space-x-2">
              {/* <button
                onClick={() => updateFilter('is_read', filters.is_read === false ? undefined : false)}
                className={cn(
                  "text-xs px-2 py-1 rounded transition-colors",
                  filters.is_read === false 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-500 hover:text-gray-700"
                )}
                title="Afficher uniquement les non lues"
              >
                <EyeOff className="h-3 w-3" />
              </button> */}
              {stats && stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllRead}
                  className="text-xs text-blue-600 hover:text-blue-500 disabled:opacity-50"
                  title="Tout marquer comme lu"
                >
                  <Check className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
               &apos;Aucune notification non lue&apos;
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors',
                  !notification.is_read && 'bg-blue-50'
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.is_read ? "text-gray-900" : "text-gray-700"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          <div className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            getNotificationColor(notification.type),
                            'bg-current bg-opacity-10'
                          )}>
                            {notification.type === 'license_expiry' && 'Licence'}
                            {notification.type === 'equipment_obsolescence' && 'Équipement'}
                            {notification.type === 'new_unverified_user' && 'Utilisateur'}
                            {notification.type === 'general' && 'Général'}
                          </div>
                        </div>
                      </div>

                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full ml-3 mt-1 flex-shrink-0"></div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 mt-2">
                      <button
                        onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                        disabled={isMarkingAsRead}
                        className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                        title={notification.is_read ? 'Marquer comme non lue' : 'Marquer comme lue'}
                      >
                        {notification.is_read ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        disabled={isDeleting}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200">
          <button 
            onClick={() => {
              onClose()
              // Router vers la page complète des notifications
              window.location.href = '/notifications'
            }}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors w-full text-center"
          >
            Voir toutes les notifications
          </button>
        </div>
      </div>
    </div>
  )
}

interface UserDropdownProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  onSignOut: () => void
}

function UserDropdown({ isOpen, onClose, user, onSignOut }: UserDropdownProps) {
  const router = useRouter()
  
  if (!isOpen) return null

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div className="py-1">
        <div className="px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        
        <button     
          onClick={() => {
            router.push('/profile')
            onClose()
          }}    
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <User className="h-4 w-4 mr-3" />
          Mon profil
        </button>
        
        <button 
          onClick={() => {
            router.push('/settings')
            onClose()
          }}    
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="h-4 w-4 mr-3" />
          Paramètres
        </button>
        
        <div className="border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

export function Header() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  
  const notificationRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  
  const { user, signOut } = useAuth()
  const { data: stats } = useNotificationStats()
  const router = useRouter()

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      toast.error('Erreur lors de la déconnexion')
      console.error(error)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrateur',
      technicien: 'Technicien',
      client: 'Client',
      unverified: 'Non vérifié'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row-reverse items-center h-16">
          {/* Right side now on the left */}
          <div className="ml-4 flex items-center md:ml-6 space-x-4">
            {/* User info */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role && getRoleDisplayName(user.role)}
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors"
              >
                <Bell className="h-6 w-6" />
                {stats && stats.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {stats.unread > 99 ? '99+' : stats.unread}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
              />
            </div>

            {/* User dropdown */}
            <div ref={userDropdownRef} className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
              </button>
              <UserDropdown
                isOpen={userDropdownOpen}
                onClose={() => setUserDropdownOpen(false)}
                user={user}
                onSignOut={handleSignOut}
              />
            </div>
          </div>

          {/* Search removed - empty div to take up space and align content if needed */}
          <div className="flex-1"></div>
        </div>
      </div>
    </header>
  )
}
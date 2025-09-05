// components/notifications/NotificationItem.tsx
'use client'

import { useState } from 'react'
import { 
  Shield, 
  Server, 
  Info, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Calendar,
  MoreVertical,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Notification } from '@/types'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string, isRead: boolean) => void
  onDelete: (id: string) => void
  onNavigateToRelated?: (relatedType: string, relatedId: string) => void
}

export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onNavigateToRelated 
}: NotificationItemProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getIcon = () => {
    switch (notification.type) {
      case 'license_expiry': 
        return <Shield className="h-5 w-5 text-orange-500" />
      case 'equipment_obsolescence': 
        return <Server className="h-5 w-5 text-red-500" />
      case 'new_unverified_user': 
        return <UserPlus className="h-5 w-5 text-blue-500" />
      default: 
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'license_expiry': return 'Licence'
      case 'equipment_obsolescence': return 'Équipement'
      case 'new_unverified_user': return 'Utilisateur'
      default: return 'Général'
    }
  }

  const getTypeColor = () => {
    switch (notification.type) {
      case 'license_expiry': return 'bg-orange-100 text-orange-800'
      case 'equipment_obsolescence': return 'bg-red-100 text-red-800'
      case 'new_unverified_user': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return "À l'instant"
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`
    } else if (diffInHours < 48) {
      return "Hier"
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const handleNavigateToRelated = () => {
    if (notification.related_id && notification.related_type && onNavigateToRelated) {
      onNavigateToRelated(notification.related_type, notification.related_id)
    }
  }

  return (
    <div className={cn(
      "p-4 hover:bg-gray-50 transition-colors border-l-4",
      notification.is_read 
        ? "border-l-transparent" 
        : "border-l-blue-500 bg-blue-50"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icône */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
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
              
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                getTypeColor()
              )}>
                {getTypeLabel()}
              </span>
              
              {!notification.is_read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
              )}
            </div>
            
            <p className={cn(
              "text-sm mb-2 line-clamp-2",
              notification.is_read ? "text-gray-600" : "text-gray-700"
            )}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(notification.created_at!)}
              </div>

              {/* Lien vers l'élément lié */}
              {notification.related_id && notification.related_type && (
                <button
                  onClick={handleNavigateToRelated}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Voir détails
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Menu d'actions */}
        <div className="relative ml-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  onMarkAsRead(notification.id, !notification.is_read)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                {notification.is_read ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Marquer comme non lue
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Marquer comme lue
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  onDelete(notification.id)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          )}

          {/* Overlay pour fermer le menu */}
          {showMenu && (
            <div 
              className="fixed inset-0 z-0"
              onClick={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
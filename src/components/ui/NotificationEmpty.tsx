import { Bell } from "lucide-react"

// components/notifications/NotificationEmpty.tsx
export function NotificationEmpty({ 
  type = 'all' 
}: { 
  type?: 'all' | 'unread' | 'filtered' 
}) {
  const getEmptyMessage = () => {
    switch (type) {
      case 'unread':
        return {
          title: 'Aucune notification non lue',
          description: 'Toutes vos notifications ont été lues.'
        }
      case 'filtered':
        return {
          title: 'Aucun résultat',
          description: 'Aucune notification ne correspond à vos critères de recherche.'
        }
      default:
        return {
          title: 'Aucune notification',
          description: 'Vous n\'avez aucune notification pour le moment.'
        }
    }
  }

  const { title, description } = getEmptyMessage()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
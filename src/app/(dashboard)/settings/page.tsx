// app/dashboard/settings/page.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Info,
  RotateCcw,
  Shield,
  ExternalLink
} from 'lucide-react'
import { useAuthPermissions } from '@/hooks'
import Link from 'next/link'

// Composant pour afficher les informations générales (lecture seule)
function ApplicationInfo() {
  const { settings, isLoading } = useSettings('general', true) // publicOnly = true
  
  if (isLoading) {
    return <LoadingSpinner className="mx-auto" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Informations de l&apos;application
        </CardTitle>
        <CardDescription>
          Informations générales sur l&apos;application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Nom de l&apos;application</label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-900">
              {settings.app_name?.value || 'Bridge LFU'}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Version</label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-900">
              {settings.app_version?.value || '1.0.0'}
            </div>
          </div>
        </div>
        
        {settings.app_description?.value && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Description</label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-900">
              {settings.app_description.value}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Composant pour les notifications simplifiées
function NotificationSettings() {
  const { preferences, updatePreferences } = useUserPreferences()

  const handleToggleEmailNotifications = () => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        email: !preferences.notifications.email
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Gérez vos préférences de notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Notifications par email</div>
            <div className="text-sm text-gray-500">
              Recevoir les notifications importantes par email
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.notifications.email}
            onChange={handleToggleEmailNotifications}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <strong>Note:</strong> Les autres paramètres de notification (alertes, rapports, etc.) 
          sont disponibles dans la section &quot;Notifications&quot; du menu principal.
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour les préférences utilisateur simplifiées
function UserPreferences() {
  const { preferences, updatePreferences, resetPreferences } = useUserPreferences()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Préférences personnelles
        </CardTitle>
        <CardDescription>
          Personnalisez votre expérience d&apos;utilisation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Thème</label>
            <select
              value={preferences.theme}
              onChange={(e) => updatePreferences({ theme: e.target.value as 'light' | 'dark' | 'system' })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="system">Système</option>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Langue</label>
            <select
              value={preferences.language}
              onChange={(e) => updatePreferences({ language: e.target.value as 'fr' | 'en' })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Éléments par page</label>
            <select
              value={preferences.dashboard.itemsPerPage}
              onChange={(e) => updatePreferences({
                dashboard: {
                  ...preferences.dashboard,
                  itemsPerPage: parseInt(e.target.value)
                }
              })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            variant="outline"
            onClick={resetPreferences}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser les préférences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Page principale des paramètres utilisateur
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('info')
  const permissions = useAuthPermissions()

  const tabs = [
    { id: 'info', label: 'Informations', icon: Info },
    { id: 'preferences', label: 'Préférences', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-gray-600 mt-2">
              Gérez vos préférences personnelles et paramètres de notification
            </p>
          </div>
          
          {/* Lien vers la configuration avancée - Admin uniquement */}
          {permissions.canManageUsers() && (
            <Link href="settings/admin/settings">
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configuration avancée
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1">
          {activeTab === 'info' && <ApplicationInfo />}
          {activeTab === 'preferences' && <UserPreferences />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  )
}
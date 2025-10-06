'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  User,
  Bell,
  Info,
  RotateCcw,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { useAuthPermissions } from '@/hooks'
import Link from 'next/link'
import { useTranslations } from '@/hooks/useTranslations'
import { useLanguage } from '@/app/context/language'
import type { SupportedLanguage } from '@/hooks/useTranslations'

function ApplicationInfo() {
  const { t } = useTranslations('settings.info')
  const { settings, isLoading } = useSettings('general', true)

  if (isLoading) {
    return <LoadingSpinner className="mx-auto" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">{t('appNameLabel')}</label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-900">
              {settings.app_name?.value || t('defaultName')}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">{t('versionLabel')}</label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-900">
              {settings.app_version?.value || t('defaultVersion')}
            </div>
          </div>
        </div>

        {settings.app_description?.value && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">{t('descriptionLabel')}</label>
            <div className="p-2 bg-gray-50 rounded-md text-gray-900">
              {settings.app_description.value}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NotificationSettings() {
  const { t } = useTranslations('settings.notifications')
  const { preferences, updatePreferences } = useUserPreferences()

  const handleToggleEmailNotifications = () => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        email: !preferences.notifications.email,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">{t('emailLabel')}</div>
            <div className="text-sm text-gray-500">{t('emailDescription')}</div>
          </div>
          <input
            type="checkbox"
            checked={preferences.notifications.email}
            onChange={handleToggleEmailNotifications}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          <strong>{t('noteTitle')}:</strong> {t('note')}
        </div>
      </CardContent>
    </Card>
  )
}

function UserPreferences() {
  const { t } = useTranslations('settings.preferences')
  const { preferences, updatePreferences, resetPreferences } = useUserPreferences()
  const { language, setLanguage, isLoading: languageLoading } = useLanguage()

  const handleLanguageChange = (nextLanguage: SupportedLanguage) => {
    void setLanguage(nextLanguage)
    void updatePreferences({ language: nextLanguage })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('themeLabel')}</label>
            <select
              value={preferences.theme}
              onChange={(e) =>
                updatePreferences({ theme: e.target.value as 'light' | 'dark' | 'system' })
              }
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="system">{t('themeOptions.system')}</option>
              <option value="light">{t('themeOptions.light')}</option>
              <option value="dark">{t('themeOptions.dark')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('languageLabel')}</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              disabled={languageLoading}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fr">{t('languageOptions.fr')}</option>
              <option value="en">{t('languageOptions.en')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('itemsPerPageLabel')}</label>
            <select
              value={preferences.dashboard.itemsPerPage}
              onChange={(e) =>
                updatePreferences({
                  dashboard: {
                    ...preferences.dashboard,
                    itemsPerPage: Number(e.target.value),
                  },
                })
              }
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
          <Button variant="outline" onClick={resetPreferences} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            {t('resetButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'preferences' | 'notifications'>('info')
  const permissions = useAuthPermissions()
  const { t } = useTranslations('settings')

  const tabs = [
    { id: 'info' as const, label: t('tabs.info'), icon: Info },
    { id: 'preferences' as const, label: t('tabs.preferences'), icon: User },
    { id: 'notifications' as const, label: t('tabs.notifications'), icon: Bell },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-2">{t('subtitle')}</p>
          </div>

          {permissions.canManageUsers() && (
            <Link href="settings/admin/settings">
              <Button variant="outline" className="flex items-center gap-2" title={t('adminLinkHint')}>
                <Shield className="h-4 w-4" />
                {t('adminLink')}
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
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

        <div className="flex-1">
          {activeTab === 'info' && <ApplicationInfo />}
          {activeTab === 'preferences' && <UserPreferences />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  )
}
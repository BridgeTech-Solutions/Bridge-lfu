// app/settings/admin/settings/page.tsx - Page avancée pour les administrateurs
'use client'

import { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useAuthPermissions } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Settings as SettingsIcon, 
  Save,
  AlertCircle,
  Mail,
  Shield,
  Palette,
  Bell,
  FileText,
  Database,
  CheckCircle,
  Upload,
  Download,
  AlertTriangle
} from 'lucide-react'

interface CategoryConfig {
  name: string
  displayName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>
  description: string
  color: string
}

const CATEGORIES: Record<string, CategoryConfig> = {
  general: {
    name: 'general',
    displayName: 'Général',
    icon: SettingsIcon,
    description: 'Configuration générale de l\'application',
    color: 'text-blue-600'
  },
  email: {
    name: 'email',
    displayName: 'Email',
    icon: Mail,
    description: 'Configuration SMTP et notifications email',
    color: 'text-green-600'
  },
  security: {
    name: 'security',
    displayName: 'Sécurité',
    icon: Shield,
    description: 'Paramètres de sécurité et authentification',
    color: 'text-red-600'
  },
  ui: {
    name: 'ui',
    displayName: 'Interface',
    icon: Palette,
    description: 'Personnalisation de l\'interface utilisateur',
    color: 'text-purple-600'
  },
  alerts: {
    name: 'alerts',
    displayName: 'Alertes',
    icon: Bell,
    description: 'Configuration des alertes et notifications',
    color: 'text-yellow-600'
  },
  files: {
    name: 'files',
    displayName: 'Fichiers',
    icon: FileText,
    description: 'Gestion des fichiers et téléchargements',
    color: 'text-indigo-600'
  },
  backup: {
    name: 'backup',
    displayName: 'Sauvegarde',
    icon: Database,
    description: 'Configuration des sauvegardes automatiques',
    color: 'text-teal-600'
  }
}

interface SettingFormProps {
  category: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (settings: Record<string, any>) => void
  isLoading: boolean
}

function EmailSettings({ settings, onSave, isLoading }: Omit<SettingFormProps, 'category'>) {
  const [formData, setFormData] = useState({
    smtp_enabled: settings.smtp_enabled?.value || false,
    smtp_host: settings.smtp_host?.value || '',
    smtp_port: settings.smtp_port?.value || 587,
    smtp_user: settings.smtp_user?.value || '',
    smtp_password: settings.smtp_password?.value || ''
  })

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.smtp_enabled}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smtp_enabled: checked }))}
        />
        <Label>Activer SMTP</Label>
      </div>

      {formData.smtp_enabled && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="smtp_host">Serveur SMTP</Label>
            <Input
              id="smtp_host"
              value={formData.smtp_host}
              onChange={(e) => setFormData(prev => ({ ...prev, smtp_host: e.target.value }))}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="smtp_port">Port SMTP</Label>
            <Input
              id="smtp_port"
              type="number"
              value={formData.smtp_port}
              onChange={(e) => setFormData(prev => ({ ...prev, smtp_port: parseInt(e.target.value) }))}
              placeholder="587"
            />
          </div>

          <div>
            <Label htmlFor="smtp_user">Utilisateur SMTP</Label>
            <Input
              id="smtp_user"
              value={formData.smtp_user}
              onChange={(e) => setFormData(prev => ({ ...prev, smtp_user: e.target.value }))}
              placeholder="votre-email@domain.com"
            />
          </div>

          <div>
            <Label htmlFor="smtp_password">Mot de passe SMTP</Label>
            <Input
              id="smtp_password"
              type="password"
              value={formData.smtp_password}
              onChange={(e) => setFormData(prev => ({ ...prev, smtp_password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading && <LoadingSpinner size="sm" />}
        <Save className="h-4 w-4 mr-2" />
        Sauvegarder la configuration email
      </Button>
    </div>
  )
}

function GeneralSettings({ settings, onSave, isLoading }: Omit<SettingFormProps, 'category'>) {
  const [formData, setFormData] = useState({
    app_name: settings.app_name?.value || 'Bridge LFU',
    app_version: settings.app_version?.value || '1.0.0',
    default_language: settings.default_language?.value || 'fr',
    maintenance_mode: settings.maintenance_mode?.value || false
  })

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="app_name">Nom de l&apos;application</Label>
        <Input
          id="app_name"
          value={formData.app_name}
          onChange={(e) => setFormData(prev => ({ ...prev, app_name: e.target.value }))}
          placeholder="Bridge LFU"
        />
      </div>

      <div>
        <Label htmlFor="app_version">Version</Label>
        <Input
          id="app_version"
          value={formData.app_version}
          onChange={(e) => setFormData(prev => ({ ...prev, app_version: e.target.value }))}
          placeholder="1.0.0"
        />
      </div>

      <div>
        <Label htmlFor="default_language">Langue par défaut</Label>
        <select
          id="default_language"
          value={formData.default_language}
          onChange={(e) => setFormData(prev => ({ ...prev, default_language: e.target.value }))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.maintenance_mode}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenance_mode: checked }))}
        />
        <Label>Mode maintenance</Label>
      </div>

      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading && <LoadingSpinner size="sm" />}
        <Save className="h-4 w-4 mr-2" />
        Sauvegarder les paramètres généraux
      </Button>
    </div>
  )
}

function AlertSettings({ settings, onSave, isLoading }: Omit<SettingFormProps, 'category'>) {
  const [formData, setFormData] = useState({
    default_license_alert_days: JSON.stringify(settings.default_license_alert_days?.value || [7, 30]),
    default_equipment_alert_days: JSON.stringify(settings.default_equipment_alert_days?.value || [30, 90]),
    email_notifications: settings.email_notifications?.value || true
  })

  const handleSubmit = () => {
    const parsedData = {
      ...formData,
      default_license_alert_days: JSON.parse(formData.default_license_alert_days),
      default_equipment_alert_days: JSON.parse(formData.default_equipment_alert_days)
    }
    onSave(parsedData)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="license_alerts">Jours d&apos;alerte pour les licences</Label>
        <Input
          id="license_alerts"
          value={formData.default_license_alert_days}
          onChange={(e) => setFormData(prev => ({ ...prev, default_license_alert_days: e.target.value }))}
          placeholder="[7, 30]"
        />
        <p className="text-sm text-gray-500 mt-1">Format JSON: [jours1, jours2]</p>
      </div>

      <div>
        <Label htmlFor="equipment_alerts">Jours d&apos;alerte pour les équipements</Label>
        <Input
          id="equipment_alerts"
          value={formData.default_equipment_alert_days}
          onChange={(e) => setFormData(prev => ({ ...prev, default_equipment_alert_days: e.target.value }))}
          placeholder="[30, 90]"
        />
        <p className="text-sm text-gray-500 mt-1">Format JSON: [jours1, jours2]</p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.email_notifications}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications: checked }))}
        />
        <Label>Notifications par email</Label>
      </div>

      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading && <LoadingSpinner size="sm" />}
        <Save className="h-4 w-4 mr-2" />
        Sauvegarder les paramètres d&apos;alerte
      </Button>
    </div>
  )
}
  function BackupSettings({ settings, onSave, isLoading }: Omit<SettingFormProps, 'category'>) {
  const [formData, setFormData] = useState({
    // Sauvegardes automatiques
    auto_backup_enabled: settings.auto_backup_enabled?.value || false,
    backup_frequency: settings.backup_frequency?.value || 'daily', // daily, weekly, monthly
    backup_retention_days: settings.backup_retention_days?.value || 30,
    backup_time: settings.backup_time?.value || '02:00', // Heure de sauvegarde
    
    // Types de données à sauvegarder
    backup_include_files: settings.backup_include_files?.value || true,
    backup_include_database: settings.backup_include_database?.value || true,
    backup_include_logs: settings.backup_include_logs?.value || false,
    backup_include_settings: settings.backup_include_settings?.value || true,
    
    // Stockage des sauvegardes
    backup_storage_location: settings.backup_storage_location?.value || 'local', // local, cloud, both
    backup_cloud_provider: settings.backup_cloud_provider?.value || 'supabase', // supabase, aws, google
    backup_max_local_size_gb: settings.backup_max_local_size_gb?.value || 10,
    
    // Compression et chiffrement
    backup_compression_enabled: settings.backup_compression_enabled?.value || true,
    backup_encryption_enabled: settings.backup_encryption_enabled?.value || true,
    
    // Notifications de sauvegarde
    backup_success_notification: settings.backup_success_notification?.value || false,
    backup_failure_notification: settings.backup_failure_notification?.value || true,
    backup_notification_emails: settings.backup_notification_emails?.value || '',
    
    // Restauration automatique
    auto_restore_enabled: settings.auto_restore_enabled?.value || false,
    restore_point_retention: settings.restore_point_retention?.value || 7 // jours
  })

  const handleSubmit = () => {
    onSave(formData)
  }

  const formatLastBackup = () => {
    const lastBackup = settings.last_backup_date?.value
    if (!lastBackup) return "Aucune sauvegarde effectuée"
    
    const date = new Date(lastBackup)
    return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`
  }

  return (
    <div className="space-y-8">
      {/* Statut des sauvegardes */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">État des sauvegardes</h3>
          {settings.last_backup_status?.value === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Dernière sauvegarde :</span>
            <span className="ml-2 text-gray-600">{formatLastBackup()}</span>
          </div>
          <div>
            <span className="font-medium">Taille totale :</span>
            <span className="ml-2 text-gray-600">
              {settings.backup_total_size?.value || '0 MB'}
            </span>
          </div>
          <div>
            <span className="font-medium">Nombre de sauvegardes :</span>
            <span className="ml-2 text-gray-600">
              {settings.backup_count?.value || 0}
            </span>
          </div>
          <div>
            <span className="font-medium">Prochaine sauvegarde :</span>
            <span className="ml-2 text-gray-600">
              {settings.next_backup_date?.value || 'Non programmée'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration automatique */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Sauvegardes automatiques</h3>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.auto_backup_enabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_backup_enabled: checked }))}
          />
          <Label>Activer les sauvegardes automatiques</Label>
        </div>

        {formData.auto_backup_enabled && (
          <div className="space-y-4 ml-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="backup_frequency">Fréquence</Label>
                <select
                  id="backup_frequency"
                  value={formData.backup_frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, backup_frequency: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>

              <div>
                <Label htmlFor="backup_time">Heure de sauvegarde</Label>
                <Input
                  id="backup_time"
                  type="time"
                  value={formData.backup_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, backup_time: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="backup_retention_days">Rétention (jours)</Label>
                <Input
                  id="backup_retention_days"
                  type="number"
                  value={formData.backup_retention_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, backup_retention_days: parseInt(e.target.value) }))}
                  placeholder="30"
                />
                <p className="text-sm text-gray-500 mt-1">Durée de conservation des sauvegardes</p>
              </div>

              <div>
                <Label htmlFor="backup_max_local_size_gb">Taille max locale (GB)</Label>
                <Input
                  id="backup_max_local_size_gb"
                  type="number"
                  value={formData.backup_max_local_size_gb}
                  onChange={(e) => setFormData(prev => ({ ...prev, backup_max_local_size_gb: parseInt(e.target.value) }))}
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenu des sauvegardes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Contenu des sauvegardes</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_include_database}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_include_database: checked }))}
            />
            <Label>Base de données (clients, licences, équipements)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_include_files}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_include_files: checked }))}
            />
            <Label>Fichiers attachés (factures, documents)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_include_settings}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_include_settings: checked }))}
            />
            <Label>Paramètres de l&apos;application</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_include_logs}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_include_logs: checked }))}
            />
            <Label>Journaux d&apos;activité</Label>
          </div>
        </div>
      </div>

      {/* Stockage */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Stockage des sauvegardes</h3>
        
        <div>
          <Label htmlFor="backup_storage_location">Emplacement de stockage</Label>
          <select
            id="backup_storage_location"
            value={formData.backup_storage_location}
            onChange={(e) => setFormData(prev => ({ ...prev, backup_storage_location: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="local">Local uniquement</option>
            <option value="cloud">Cloud uniquement</option>
            <option value="both">Local + Cloud (recommandé)</option>
          </select>
        </div>

        {(formData.backup_storage_location === 'cloud' || formData.backup_storage_location === 'both') && (
          <div>
            <Label htmlFor="backup_cloud_provider">Fournisseur cloud</Label>
            <select
              id="backup_cloud_provider"
              value={formData.backup_cloud_provider}
              onChange={(e) => setFormData(prev => ({ ...prev, backup_cloud_provider: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="supabase">Supabase Storage</option>
              <option value="aws">Amazon S3</option>
              <option value="google">Google Cloud Storage</option>
            </select>
          </div>
        )}
      </div>

      {/* Sécurité */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Sécurité des sauvegardes</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_compression_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_compression_enabled: checked }))}
            />
            <Label>Compression des sauvegardes</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_encryption_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_encryption_enabled: checked }))}
            />
            <Label>Chiffrement des sauvegardes</Label>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Notifications de sauvegarde</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_success_notification}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_success_notification: checked }))}
            />
            <Label>Notifier en cas de succès</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.backup_failure_notification}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, backup_failure_notification: checked }))}
            />
            <Label>Notifier en cas d&apos;échec</Label>
          </div>

          {(formData.backup_success_notification || formData.backup_failure_notification) && (
            <div>
              <Label htmlFor="backup_notification_emails">Emails de notification</Label>
              <Input
                id="backup_notification_emails"
                value={formData.backup_notification_emails}
                onChange={(e) => setFormData(prev => ({ ...prev, backup_notification_emails: e.target.value }))}
                placeholder="admin@bridge.com, it@bridge.com"
              />
              <p className="text-sm text-gray-500 mt-1">Emails séparés par des virgules</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions manuelles */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Actions manuelles</h3>
        
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Créer une sauvegarde maintenant
          </Button>
          
          <Button variant="outline" className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Restaurer depuis un fichier
          </Button>
          
          <Button variant="outline" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Vérifier l&apos;intégrité
          </Button>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="pt-6 border-t">
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full md:w-auto">
          {isLoading && <LoadingSpinner size="sm" />}
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder la configuration de sauvegarde
        </Button>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const permissions = useAuthPermissions()
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const {
    settings,
    categories,
    isLoading,
    error,
    updateSettings,
    getSettingsByCategory,
    isUpdating,
    canManage
  } = useSettings()

  // Vérification des permissions admin
  if (!canManage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Accès administrateur requis</h2>
            <p className="text-gray-600">
              Vous devez être administrateur pour accéder à cette page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveSettings = async (newSettings: Record<string, any>) => {
    try {
      await updateSettings(newSettings)
      setToast({ message: 'Paramètres sauvegardés avec succès', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setToast({ message: `Erreur: ${error.message}`, type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const categorySettings = getSettingsByCategory(selectedCategory)
  const categoryConfig = CATEGORIES[selectedCategory]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-center p-4 border rounded-lg shadow-sm ${
              toast.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-3 text-red-500" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuration Avancée</h1>
        <p className="text-gray-600">
          Paramètres détaillés pour les administrateurs système
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar des catégories */}
        <div className="space-y-2">
          {Object.values(CATEGORIES).map((category) => {
            const Icon = category.icon
            const isActive = selectedCategory === category.name
            
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${category.color}`} />
                <div>
                  <div className="font-medium">{category.displayName}</div>
                  <div className="text-sm text-gray-500">{category.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center">
                {categoryConfig && (
                  <categoryConfig.icon className={`h-6 w-6 mr-3 ${categoryConfig.color}`} />
                )}
                <div>
                  <CardTitle>{categoryConfig?.displayName || 'Paramètres'}</CardTitle>
                  <CardDescription>
                    {categoryConfig?.description || 'Configuration des paramètres'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {selectedCategory === 'email' && (
                <EmailSettings
                  settings={categorySettings}
                  onSave={handleSaveSettings}
                  isLoading={isUpdating}
                />
              )}
              
              {selectedCategory === 'general' && (
                <GeneralSettings
                  settings={categorySettings}
                  onSave={handleSaveSettings}
                  isLoading={isUpdating}
                />
              )}
              
              {selectedCategory === 'alerts' && (
                <AlertSettings
                  settings={categorySettings}
                  onSave={handleSaveSettings}
                  isLoading={isUpdating}
                />
              )}
              {/* NOUVELLE SECTION À AJOUTER */}
              {selectedCategory === 'backup' && (
                <BackupSettings
                  settings={categorySettings}
                  onSave={handleSaveSettings}
                  isLoading={isUpdating}
                />
              )}
              {/* MODIFIER CETTE CONDITION */}
              {!['email', 'general', 'alerts', 'backup'].includes(selectedCategory) && (
                <div className="text-center py-8">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Configuration à venir
                  </h3>
                  <p className="text-gray-600">
                    Les paramètres pour &quot;{categoryConfig?.displayName}&quot; seront bientôt disponibles.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
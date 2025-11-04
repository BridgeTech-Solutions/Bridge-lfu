'use client'

import { useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield, 
  KeyRound, 
  Edit, 
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react'
import { useTranslations } from '@/hooks/useTranslations'

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { 
    profile, 
    isLoading, 
    isUpdating,
    updateProfile, 
    updatePassword, 
    getInitials, 
    getFullName, 
    getRoleDisplayName 
  } = useProfile()
  const { t } = useTranslations('profile')

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: ''
  })

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Initialize form with profile data
  const initializeProfileForm = () => {
    if (profile) {
      setProfileForm({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        company: profile.company || ''
      })
    }
  }

  const handleEditProfile = () => {
    initializeProfileForm()
    setIsEditDialogOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileForm)
      setIsEditDialogOpen(false)
    } catch (error) {
      // Error is already handled by the hook
    }
  }

  const handleChangePassword = async () => {
    try {
      await updatePassword(passwordForm)
      setIsPasswordDialogOpen(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      // Error is already handled by the hook
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'technicien':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'client':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'unverified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('status.notFoundTitle')}
            </h2>
            <p className="text-gray-500">
              {t('status.notFoundDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('header.title')}
        </h1>
        <p className="text-gray-600">
          {t('header.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Carte profil principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('cards.personalInfo.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.personalInfo.description')}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditProfile}
                  disabled={isUpdating}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('cards.personalInfo.fields.fullName')}</p>
                    <p className="text-gray-900">{getFullName()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('cards.personalInfo.fields.email')}</p>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('cards.personalInfo.fields.phone')}</p>
                    <p className="text-gray-900">{profile.phone || t('cards.personalInfo.fields.phoneFallback')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('cards.personalInfo.fields.company')}</p>
                    <p className="text-gray-900">{profile.company || t('cards.personalInfo.fields.companyFallback')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carte sécurité */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('cards.security.title')}</CardTitle>
                  <CardDescription>
                    {t('cards.security.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('cards.security.passwordLabel')}</p>
                      <p className="text-sm text-gray-500">{t('cards.security.maskedValue')}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPasswordDialogOpen(true)}
                    disabled={isUpdating}
                  >
                    {t('common.edit')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre latérale */}
        <div className="space-y-6">
          {/* Carte avatar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-semibold text-xl">
                    {getInitials()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {getFullName()}
                </h3>
                <Badge 
                  variant="secondary" 
                  className={getRoleBadgeColor(profile.role)}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleDisplayName(profile.role)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Carte informations compte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('cards.account.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('cards.account.memberSince')}</p>
                  <p className="text-sm text-gray-900">
                    {profile.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : t('cards.account.memberSinceFallback')
                    }
                  </p>
                </div>
              </div>

              {profile.client_id && profile.clients && (
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('cards.account.client')}</p>
                    <p className="text-sm text-gray-900">
                      {typeof profile.clients === 'object' && profile.clients.name 
                        ? profile.clients.name 
                        : t('cards.account.clientFallback')
                      }
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de modification du profil */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.edit.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('dialogs.edit.fields.firstName.label')}</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder={t('dialogs.edit.fields.firstName.placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('dialogs.edit.fields.lastName.label')}</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder={t('dialogs.edit.fields.lastName.placeholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('dialogs.edit.fields.email.label')}</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('dialogs.edit.fields.email.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('dialogs.edit.fields.phone.label')}</Label>
              <Input
                id="phone"
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t('dialogs.edit.fields.phone.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">{t('dialogs.edit.fields.company.label')}</Label>
              <Input
                id="company"
                value={profileForm.company}
                onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                placeholder={t('dialogs.edit.fields.company.placeholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('dialogs.edit.actions.cancel')}
            </Button>
            <Button onClick={handleSaveProfile} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('dialogs.edit.actions.saving')}
                </>
              ) : (
                t('dialogs.edit.actions.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification du mot de passe */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dialogs.password.title')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.password.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('dialogs.password.fields.current.label')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder={t('dialogs.password.fields.current.placeholder')}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('dialogs.password.fields.new.label')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder={t('dialogs.password.fields.new.placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('dialogs.password.fields.confirm.label')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={t('dialogs.password.fields.confirm.placeholder')}
              />
            </div>
            {passwordForm.newPassword && passwordForm.confirmPassword && 
             passwordForm.newPassword !== passwordForm.confirmPassword && (
              <div className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {t('dialogs.password.validations.mismatch')}
              </div>
            )}
            {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
              <div className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {t('dialogs.password.validations.minLength')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPasswordDialogOpen(false)
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              })
            }}>
              {t('dialogs.password.actions.cancel')}
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={
                isUpdating || 
                !passwordForm.currentPassword || 
                !passwordForm.newPassword || 
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword ||
                passwordForm.newPassword.length < 6
              }
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('dialogs.password.actions.submitting')}
                </>
              ) : (
                t('dialogs.password.actions.submit')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
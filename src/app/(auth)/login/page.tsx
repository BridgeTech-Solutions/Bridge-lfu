'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Shield, Bell, FileText, Server } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { loginSchema, LoginInput } from '@/lib/validations'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  
  const { signIn } = useAuth({ isPublicPage: true })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success('Connexion réussie')
      router.push(redirectTo)
    } catch (error: unknown) {
      console.error('Erreur de connexion:', error)
      if (error instanceof Error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect'
            : 'Erreur de connexion. Veuillez réessayer.'
        )
      } else {
        toast.error('Erreur inconnue')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Section gauche - Présentation de l'application */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Pattern de fond décoratif */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative z-10">
          {/* Logo et nom */}
          <div className="flex items-center space-x-3 mb-12">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-bold text-2xl">B</span>
            </div>
            <span className="text-white font-bold text-2xl">Bridge LFU</span>
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Gérez vos licences et équipements en toute simplicité
          </h1>
          <p className="text-blue-100 text-lg mb-12">
            Une plateforme complète pour le suivi des licences logicielles et la gestion de l&apos;obsolescence de vos équipements informatiques.
          </p>

          {/* Liste des fonctionnalités */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Suivi des licences</h3>
                <p className="text-blue-100 text-sm">Gérez toutes vos licences logicielles et recevez des alertes avant expiration</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Gestion des équipements</h3>
                <p className="text-blue-100 text-sm">Suivez l&apos;obsolescence de vos équipements et planifiez les renouvellements</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Alertes intelligentes</h3>
                <p className="text-blue-100 text-sm">Notifications automatiques par email pour ne jamais manquer une échéance</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Rapports détaillés</h3>
                <p className="text-blue-100 text-sm">Générez des rapports complets en CSV ou PDF pour vos analyses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            © 2025 Bridge LFU. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Section droite - Formulaire de connexion */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo pour mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-gray-900 font-bold text-xl">Bridge LFU</span>
            </div>
          </div>

          {/* Carte avec formulaire */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenue
              </h2>
              <p className="text-gray-600">
                Connectez-vous pour accéder à votre espace de gestion
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Champ Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={cn(
                    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                    errors.email && 'border-red-500 focus:ring-red-500'
                  )}
                  placeholder="votre@email.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Champ Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn(
                      'w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                      errors.password && 'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Lien mot de passe oublié */}
              <div className="flex items-center justify-end">
                <Link
                  href="/reset-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
              >
                {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Se connecter
              </button>
            </form>

            {/* Lien vers inscription */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          {/* Info pour mobile */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Gérez vos licences et équipements en toute simplicité
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
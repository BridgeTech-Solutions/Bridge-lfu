'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { createSupabaseClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Schéma de validation pour le nouveau mot de passe
const newPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
})

type NewPasswordInput = z.infer<typeof newPasswordSchema>

export default function ResetPasswordConfirmPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  
  const router = useRouter()
  const supabase = createSupabaseClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
  })

  // Vérifier si l'utilisateur a un token de réinitialisation valide
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          setIsValidToken(false)
          toast.error('Lien de réinitialisation invalide ou expiré')
        } else {
          setIsValidToken(true)
        }
      } catch (error) {
        console.error('Erreur vérification session:', error)
        setIsValidToken(false)
      } finally {
        setIsCheckingToken(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  const onSubmit = async (data: NewPasswordInput) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })
      
      if (error) {
        throw error
      }
      
      setPasswordUpdated(true)
      toast.success('Mot de passe réinitialisé avec succès !')
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: unknown) {
      console.error('Erreur lors de la réinitialisation:', error)
      if (error instanceof Error) {
        toast.error(error.message || 'Erreur lors de la réinitialisation du mot de passe')
      } else {
        toast.error('Erreur inconnue')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Affichage pendant la vérification du token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    )
  }

  // Affichage si le token est invalide
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Lien invalide ou expiré
              </h2>
              <p className="text-gray-600 mb-6">
                Ce lien de réinitialisation n&apos;est plus valide. Les liens expirent après 1 heure pour des raisons de sécurité.
              </p>
              
              <div className="space-y-3">
                <Link
                  href="/reset-password"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Demander un nouveau lien
                </Link>
                
                <Link
                  href="/login"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Affichage après succès
  if (passwordUpdated) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Mot de passe réinitialisé !
              </h2>
              <p className="text-gray-600 mb-6">
                Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion...
              </p>
              
              <Link
                href="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg shadow-blue-500/30"
              >
                Se connecter maintenant
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulaire de réinitialisation
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la connexion
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Nouveau mot de passe
            </h2>
            <p className="text-gray-600">
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  {...register('newPassword')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn(
                    'w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                    errors.newPassword && 'border-red-500 focus:ring-red-500'
                  )}
                  placeholder="Minimum 8 caractères"
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
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={cn(
                    'w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                    errors.confirmPassword && 'border-red-500 focus:ring-red-500'
                  )}
                  placeholder="Confirmez votre mot de passe"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Conseils de sécurité */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Conseils pour un mot de passe sécurisé :
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Au moins 8 caractères</li>
                <li>Mélangez lettres majuscules et minuscules</li>
                <li>Incluez des chiffres et des caractères spéciaux</li>
                <li>Évitez les informations personnelles</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
            >
              {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Réinitialiser le mot de passe
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Besoin d&apos;aide ? Contactez notre support
          </p>
        </div>
      </div>
    </div>
  )
}

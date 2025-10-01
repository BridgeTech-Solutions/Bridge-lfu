'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, CheckCircle, Shield, Server, Bell, FileText, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { registerSchema, RegisterInput } from '@/lib/validations'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [step, setStep] = useState(1) // Étape 1 ou 2
  
  const router = useRouter()
  const { signUp } = useAuth({ isPublicPage: true })

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const handleNextStep = async () => {
    // Valider les champs de l'étape 1
    const isValid = await trigger(['firstName', 'lastName', 'email', 'company', 'phone'])
    if (isValid) {
      setStep(2)
    }
  }

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    
    try {
      const result = await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        company: data.company,
      })

      if (result.data?.requiresAdminValidation) {
        setRegistrationSuccess(true)
        toast.success('Inscription réussie ! Votre compte est en attente de validation.')
      } else {
        toast.success('Inscription réussie ! Vérifiez votre email.')
        router.push('/login?message=check-email')
      }
    } catch (error: unknown) {
      console.error('Erreur d\'inscription:', error)
      if (error instanceof Error) {
        toast.error(
          error.message.includes('already registered')
            ? 'Cette adresse email est déjà utilisée'
            : 'Erreur lors de l\'inscription. Veuillez réessayer.'
        )
      } else {
        toast.error('Erreur inconnue lors de l\'inscription')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Inscription réussie !
            </h2>
            <p className="text-gray-600 mb-3">
              Votre compte a été créé avec succès et est maintenant en attente de validation par un administrateur.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vous recevrez un email de confirmation une fois votre compte validé.
            </p>
            <Link
              href="/login"
              className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg shadow-blue-500/30"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Section gauche - Présentation */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-bold text-2xl">B</span>
            </div>
            <span className="text-white font-bold text-2xl">Bridge LFU</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Rejoignez Bridge LFU
          </h1>
          <p className="text-blue-100 text-lg mb-12">
            Simplifiez la gestion de vos licences logicielles et équipements informatiques avec notre plateforme tout-en-un.
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Suivi des licences</h3>
                <p className="text-blue-100 text-sm">Ne manquez plus jamais une date d&apos;expiration de licence</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Gestion des équipements</h3>
                <p className="text-blue-100 text-sm">Anticipez l&apos;obsolescence de votre parc informatique</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Alertes automatiques</h3>
                <p className="text-blue-100 text-sm">Recevez des notifications par email en temps voulu</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Rapports exportables</h3>
                <p className="text-blue-100 text-sm">Générez des rapports PDF ou CSV en un clic</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-200 text-sm">
            © 2025 Bridge LFU. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Section droite - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-gray-900 font-bold text-xl">Bridge LFU</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Indicateur d'étapes */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    1
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Informations</p>
                    <p className="text-xs text-gray-500">Vos coordonnées</p>
                  </div>
                </div>
                <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                  <div className={cn(
                    "h-full bg-blue-600 transition-all duration-300",
                    step >= 2 ? "w-full" : "w-0"
                  )} />
                </div>
                <div className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    2
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Sécurité</p>
                    <p className="text-xs text-gray-500">Mot de passe</p>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Créer un compte
              </h2>
              <p className="text-gray-600">
                {step === 1 
                  ? "Commencez par vos informations personnelles"
                  : "Sécurisez votre compte avec un mot de passe"
                }
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* ÉTAPE 1 - Informations personnelles */}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <input
                        {...register('firstName')}
                        type="text"
                        autoComplete="given-name"
                        className={cn(
                          'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                          errors.firstName && 'border-red-500 focus:ring-red-500'
                        )}
                        placeholder="Prénom"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <input
                        {...register('lastName')}
                        type="text"
                        autoComplete="family-name"
                        className={cn(
                          'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                          errors.lastName && 'border-red-500 focus:ring-red-500'
                        )}
                        placeholder="Nom"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse email *
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entreprise
                    </label>
                    <input
                      {...register('company')}
                      type="text"
                      autoComplete="organization"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Nom de votre entreprise"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      autoComplete="tel"
                      className={cn(
                        'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                        errors.phone && 'border-red-500 focus:ring-red-500'
                      )}
                      placeholder="+237 6XX XXX XXX"
                    />
                    {errors.phone && (
                      <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-lg shadow-blue-500/30"
                  >
                    Continuer
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </>
              )}

              {/* ÉTAPE 2 - Mot de passe */}
              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={cn(
                          'w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
                          errors.password && 'border-red-500 focus:ring-red-500'
                        )}
                        placeholder="Au moins 8 caractères"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe *
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
                        placeholder="Confirmer votre mot de passe"
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

                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    En créant votre compte, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité.
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Retour
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                    >
                      {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                      Créer mon compte
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
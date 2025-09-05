'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Si l'état de chargement est faux, nous pouvons agir
    if (!loading) {
      if (user) {
        // L'utilisateur est connecté, le rediriger vers le tableau de bord
        router.push('/dashboard')
      } else {
        // L'utilisateur n'est pas connecté, le rediriger vers la page de connexion
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Afficher le loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bridge LFU</h1>
          <p className="text-gray-600">Chargement de l&apos;application...</p>
        </div>
      </div>
    )
  }

  // Ce composant ne rend rien une fois le chargement terminé pour éviter la boucle
  return null
}
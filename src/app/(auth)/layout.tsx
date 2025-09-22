'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading } = useAuth({ isPublicPage: true })
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

//   // Si l'utilisateur est connecté, ne pas afficher les pages d'auth
//   if (user) {
//     return null
//   }

  return (
    <div >
      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  )
}
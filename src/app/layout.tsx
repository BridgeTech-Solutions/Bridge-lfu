
// src\app\layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import { Providers } from '@/components/layout/Providers' // <-- Importez le nouveau composant

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bridge LFU - Gestion des Licences et Équipements',
  description: 'Plateforme de gestion des licences logicielles et équipements informatiques',
  // Configuration du favicon
  icons: {
    icon: '/favicon.png', // Le chemin par défaut pour le favicon
    shortcut: '/favicon.png', // Optionnel, pour la compatibilité
    // apple: '/apple-touch-icon.png', // Icône pour les appareils Apple
  },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <div id="root" className="min-h-full">
          {/* Utilisez le composant Providers ici */}
          <Providers>
            {children}
          </Providers> 
        </div>

      </body>
    </html>
  )
}
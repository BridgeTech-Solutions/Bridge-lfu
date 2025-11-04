// src/components/layout/Providers.tsx
'use client' // C'est crucial pour marquer ce fichier comme un Client Component

import { AuthProvider } from '@/app/context/auth'
import { LanguageProvider } from '@/app/context/language'
import { ThemeProvider } from '@/app/context/ThemeContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/react-query/client'
import { Toaster } from 'sonner' // Si vous utilisez Toaster dans les Clients Components

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Le client={queryClient} est maintenant passé DANS un composant Client, 
        contournant le problème de sérialisation des Server Components.
      */}
      <QueryClientProvider client={queryClient}> 
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
      
      {/* Notifications toast - si elles doivent être incluses ici */}
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className: 'text-sm',
        }}
      />
    </AuthProvider>
  )
}
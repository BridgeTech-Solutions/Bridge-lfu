// // app/layout.tsx
// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
// import { Toaster } from 'sonner'
// import './globals.css'
// import { AuthProvider } from './context/auth' // Importez le AuthProvider

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Bridge LFU - Gestion des Licences et Équipements',
//   description: 'Plateforme de gestion des licences logicielles et équipements informatiques',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="fr" className="h-full">
//       <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
//         <div id="root" className="min-h-full">
//           {/* Enveloppez les enfants dans le AuthProvider.
//             Cela rend l'état de la session (utilisateur, chargement)
//             disponible pour tous les composants client dans votre application.
//           */}
//           <AuthProvider>
//             {children}
//           </AuthProvider>
//         </div>
        
//         {/* Notifications toast */}
//         <Toaster
//           position="top-right"
//           expand={true}
//           richColors
//           closeButton
//           toastOptions={{
//             duration: 4000,
//             className: 'text-sm',
//           }}
//         />
//       </body>
//     </html>
//   )
// }
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
// (X) Ne plus importer AuthProvider
// import { AuthProvider } from './context/auth' 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bridge LFU - Gestion des Licences et Équipements',
  description: 'Plateforme de gestion des licences logicielles et équipements informatiques',
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
          {/* (X) Retirer le AuthProvider */}
          {children}
        </div>
        
        {/* Notifications toast */}
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
      </body>
    </html>
  )
}
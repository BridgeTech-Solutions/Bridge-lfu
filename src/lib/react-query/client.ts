import { QueryClient } from '@tanstack/react-query'

/**
 * Instance unique de QueryClient pour toute l'application
 * Partagée entre tous les composants pour maintenir un cache cohérent
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Durée pendant laquelle les données sont considérées "fraîches"
      staleTime: 60 * 1000, // 1 minute
      
      // Durée de conservation en cache avant garbage collection
      gcTime: 5 * 60 * 1000, // 5 minutes (anciennement cacheTime)
      
      // Nombre de tentatives en cas d'échec
      retry: 1,
      
      // Ne pas refetch automatiquement au focus de la fenêtre
      refetchOnWindowFocus: false,
      
      // Refetch en cas de reconnexion réseau
      refetchOnReconnect: true,
    },
    mutations: {
      // Nombre de tentatives pour les mutations
      retry: 0,
    },
  },
})

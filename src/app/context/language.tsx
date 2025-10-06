'use client'

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import type { SupportedLanguage } from '@/locales'

interface LanguageContextValue {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => Promise<void>
  isLoading: boolean
  isSyncing: boolean
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { preferences, updatePreferences, isLoading } = useUserPreferences()
  const [language, setLanguageState] = useState<SupportedLanguage>('fr')
  const [isSyncing, setIsSyncing] = useState(false)

  // Sync local state with stored preferences when they are fetched
  useEffect(() => {
    if (preferences?.language && preferences.language !== language) {
      setLanguageState(preferences.language)
    }
  }, [preferences?.language, language])

  // Update the <html lang="..."> attribute when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: async (nextLanguage: SupportedLanguage) => {
      if (nextLanguage === language) return
      setLanguageState(nextLanguage)
      setIsSyncing(true)
      try {
        await updatePreferences({ language: nextLanguage })
      } finally {
        setIsSyncing(false)
      }
    },
    isLoading: isLoading || isSyncing,
    isSyncing,
  }), [language, isLoading, updatePreferences, isSyncing])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

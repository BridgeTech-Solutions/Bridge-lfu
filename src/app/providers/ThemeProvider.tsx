// app/providers/ThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUserPreferences } from '@/hooks/useUserPreferences'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences, updatePreferences } = useUserPreferences()
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  // Fonction pour détecter la préférence système
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Fonction pour calculer le thème effectif
  const calculateEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  }

  // Appliquer le thème au DOM
  useEffect(() => {
    const theme = preferences.theme
    const effective = calculateEffectiveTheme(theme)
    setEffectiveTheme(effective)

    // Ajouter/retirer la classe 'dark' sur l'élément html
    const root = document.documentElement
    if (effective === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Mettre à jour la couleur de la barre d'adresse (mobile)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effective === 'dark' ? '#1f2937' : '#ffffff')
    }
  }, [preferences.theme])

  // Écouter les changements de préférence système
  useEffect(() => {
    if (preferences.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newEffective = e.matches ? 'dark' : 'light'
      setEffectiveTheme(newEffective)
      
      const root = document.documentElement
      if (newEffective === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [preferences.theme])

  const setTheme = (theme: Theme) => {
    updatePreferences({ theme })
  }

  return (
    <ThemeContext.Provider value={{ theme: preferences.theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
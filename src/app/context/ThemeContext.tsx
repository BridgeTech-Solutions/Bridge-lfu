'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useUserPreferences } from '@/hooks/useUserPreferences'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  effectiveTheme: Theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { preferences, updatePreferences } = useUserPreferences()
  const [effectiveTheme, setEffectiveTheme] = useState<Theme>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateEffectiveTheme = () => {
      let theme: Theme
      switch (preferences.theme) {
        case 'dark':
          theme = 'dark'
          break
        case 'light':
          theme = 'light'
          break
        case 'system':
        default:
          theme = mediaQuery.matches ? 'dark' : 'light'
          break
      }
      setEffectiveTheme(theme)
    }

    updateEffectiveTheme()

    // Écouter les changements de préférence système
    const handleChange = () => updateEffectiveTheme()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [preferences.theme])

  useEffect(() => {
    // Appliquer la classe au document
    const root = document.documentElement
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [effectiveTheme])

  const toggleTheme = async () => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light'
    await updatePreferences({ theme: newTheme })
  }

  return (
    <ThemeContext.Provider value={{ theme: preferences.theme as 'light' | 'dark', toggleTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

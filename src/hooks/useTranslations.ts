'use client'

import { useCallback, useMemo } from 'react'
import { translate } from '@/locales'
import type { SupportedLanguage } from '@/locales'
import { useLanguage } from '@/app/context/language'

export function useTranslations(prefix?: string) {
  const { language } = useLanguage()

  const resolvedPrefix = useMemo(() => {
    if (!prefix) return undefined
    return prefix.endsWith('.') ? prefix.slice(0, -1) : prefix
  }, [prefix])

  const t = useCallback(
    (key: string, fallback?: string) => {
      const scopedKey = resolvedPrefix ? `${resolvedPrefix}.${key}` : key
      return translate(language, scopedKey, fallback)
    },
    [language, resolvedPrefix]
  )

  return { t, language }
}

export type { SupportedLanguage }

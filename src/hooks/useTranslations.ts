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
    (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => {
      const scopedKey = resolvedPrefix ? `${resolvedPrefix}.${key}` : key

      // Handle both old signature (key, fallback) and new signature (key, params, fallback)
      let params: Record<string, string | number> | undefined
      let actualFallback: string | undefined

      if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
        params = paramsOrFallback
        actualFallback = fallback
      } else {
        actualFallback = paramsOrFallback
      }

      return translate(language, scopedKey, actualFallback, params)
    },
    [language, resolvedPrefix]
  )

  return { t, language }
}

export type { SupportedLanguage }

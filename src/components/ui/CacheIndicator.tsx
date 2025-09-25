// components/ui/CacheIndicator.tsx
'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CacheIndicatorProps {
  isPlaceholderData?: boolean
  lastUpdated?: number
  isRefetching?: boolean
  onRefresh?: () => void
  className?: string
}

export function CacheIndicator({ 
  isPlaceholderData, 
  lastUpdated, 
  isRefetching, 
  onRefresh,
  className 
}: CacheIndicatorProps) {
  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Jamais'
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    return new Date(timestamp).toLocaleDateString('fr-FR')
  }

  const getIndicatorColor = () => {
    if (isRefetching) return 'bg-blue-100 text-blue-800'
    if (isPlaceholderData) return 'bg-orange-100 text-orange-800'
    return 'bg-green-100 text-green-800'
  }

  const getIcon = () => {
    if (isRefetching) return RefreshCw
    if (isPlaceholderData) return Clock
    return Wifi
  }

  const Icon = getIcon()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="secondary" className={getIndicatorColor()}>
        <Icon className={cn(
          'h-3 w-3 mr-1', 
          isRefetching && 'animate-spin'
        )} />
        {isRefetching ? 'Mise à jour...' : 
         isPlaceholderData ? 'Cache' : 
         'À jour'}
      </Badge>
      
      <span className="text-xs text-gray-500">
        {getTimeAgo(lastUpdated)}
      </span>
      
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefetching}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={cn(
            'h-3 w-3',
            isRefetching && 'animate-spin'
          )} />
        </Button>
      )}
    </div>
  )
}

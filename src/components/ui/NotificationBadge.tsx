import { cn } from "@/lib/utils"

// components/notifications/NotificationBadge.tsx
export function NotificationBadge({ 
  count, 
  className 
}: { 
  count: number
  className?: string 
}) {
  if (count === 0) return null

  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full",
      className
    )}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

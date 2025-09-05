// components/notifications/NotificationSkeleton.tsx
export function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-4 border-b border-gray-200 last:border-b-0">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
            </div>
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
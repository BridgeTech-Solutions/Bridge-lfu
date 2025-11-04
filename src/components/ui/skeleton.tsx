import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Skeleton pour l'en-tête d'une page avec titre et boutons
function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-between items-center mb-8", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  )
}

// Skeleton pour les cartes de statistiques
function StatsCardsSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  )
}

// Skeleton pour les filtres
function FiltersSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-4 mb-6", className)}>
      <div className="flex-1">
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>
  )
}

// Skeleton pour un tableau
function TableSkeleton({
  rows = 5,
  columns = 5,
  className
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-lg border", className)}>
      <div className="p-6">
        {/* En-tête du tableau */}
        <div className="flex gap-4 mb-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* Lignes du tableau */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4 py-3 border-b border-gray-100 last:border-b-0">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Skeleton complet pour une page de liste
function ListPageSkeleton({
  showStats = true,
  showFilters = true,
  statsCount = 3,
  tableRows = 5,
  tableColumns = 5,
  className
}: {
  showStats?: boolean;
  showFilters?: boolean;
  statsCount?: number;
  tableRows?: number;
  tableColumns?: number;
  className?: string;
}) {
  return (
    <div className={cn("container mx-auto py-8 px-6 max-w-7xl", className)}>
      <PageHeaderSkeleton />
      {showStats && <StatsCardsSkeleton count={statsCount} />}
      {showFilters && <FiltersSkeleton />}
      <TableSkeleton rows={tableRows} columns={tableColumns} />
    </div>
  )
}

export {
  Skeleton,
  PageHeaderSkeleton,
  StatsCardsSkeleton,
  FiltersSkeleton,
  TableSkeleton,
  ListPageSkeleton
}
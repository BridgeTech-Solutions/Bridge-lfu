export function ClientsLoadingSkeleton() {
  return (
    <div className="min-h-screen p-6">
      {/* Skeleton de l'en-tête */}
      <div className="mb-8 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-24 bg-gray-200 rounded-md"></div>
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded-md mb-2"></div>
              <div className="h-5 w-48 bg-gray-200 rounded-md"></div>
            </div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Skeleton des statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>

      {/* Skeleton du tableau */}
      <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
  );
}

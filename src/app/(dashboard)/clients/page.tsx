// app/(dashboard)/clients/page.tsx
'use client';

import { useState } from 'react';
import { useDebounce, usePagination } from '@/hooks/index';
import { useSectors, useClients } from '@/hooks/useClients';

import { ClientsLoadingSkeleton } from '@/components/pages/clients/ClientsLoadingSkeleton';
import { ClientsErrorState } from '@/components/pages/clients/ClientsErrorState';
import { ClientsHeader } from '@/components/pages/clients/ClientsHeader';
import { ClientsStats } from '@/components/pages/clients/ClientsStats';
import { ClientsFilters } from '@/components/pages/clients/ClientsFilters';
import { ClientsTable } from '@/components/tables/ClientsTable';
import { ClientsPagination } from '@/components/pages/clients/ClientsPagination';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientsPage() {

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const { 
    page, 
    limit,
    goToPage 
  } = usePagination(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Utilisation du nouveau hook useClients
  const {
    clients,
    loading,
    error,
    stats,
    pagination
  } = useClients({
    page: currentPage,
    limit: limit,
    search: debouncedSearchTerm,
    sector: selectedSector,
  });

  // Hook pour les secteurs
  const { data: sectors, isLoading: isLoadingSectors, isError: isErrorSectors } = useSectors();

  if (loading || isLoadingSectors) {
    return <ClientsLoadingSkeleton />;
  }

  if (error || isErrorSectors) {
    return <ClientsErrorState error={error ?? undefined} />;
  }

  const totalItems = pagination?.count || 0;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="container mx-auto py-8 px-6">
      <ClientsHeader />

      <ClientsStats stats={stats} />

      <ClientsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSector={selectedSector}
        onSectorChange={setSelectedSector}
        sectors={sectors}
      />

      {/* Tableau des clients */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
        <CardContent className="p-0">
          <ClientsTable clients={clients} />
        </CardContent>
      </Card>

      <ClientsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        itemsPerPage={limit}
      />
    </div>
  );
}
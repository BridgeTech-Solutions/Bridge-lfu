import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTranslations } from '@/hooks/useTranslations';

interface ClientsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number; // Réajouter cette prop
  onPageChange: (page: number) => void;
}

export function ClientsPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage, // Réajouter
  onPageChange
}: ClientsPaginationProps) {
  const paginationTranslations = useTranslations('clients.pagination');
  const effectiveItemsPerPage = Math.max(itemsPerPage, 1);

  if (totalItems <= effectiveItemsPerPage) return null;

  const startItem = (currentPage - 1) * effectiveItemsPerPage + 1;
  const endItem = Math.min(currentPage * effectiveItemsPerPage, totalItems);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600 font-medium">
            {paginationTranslations
              .t('range')
              .replace('{{start}}', String(startItem))
              .replace('{{end}}', String(endItem))
              .replace('{{total}}', String(totalItems))}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="hover:bg-blue-50 hover:text-blue-700"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="hover:bg-blue-50 hover:text-blue-700"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
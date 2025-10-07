import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTranslations } from '@/hooks/useTranslations';

interface ClientsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function ClientsPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: ClientsPaginationProps) {
  const paginationTranslations = useTranslations('clients.pagination');

  if (totalItems <= 10) return null;

  const startItem = (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalItems);

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

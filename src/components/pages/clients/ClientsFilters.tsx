import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface ClientsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSector: string;
  onSectorChange: (value: string) => void;
  sectors?: string[];
}

export function ClientsFilters({
  searchTerm,
  onSearchChange,
  selectedSector,
  onSectorChange,
  sectors = []
}: ClientsFiltersProps) {
  const filtersTranslations = useTranslations('clients.filters');

  return (
    <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-700">
          {filtersTranslations.t('title')}
        </CardTitle>
        <CardDescription>
          {filtersTranslations.t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder={filtersTranslations.t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/80 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>

          <Select
            onValueChange={(value) => onSectorChange(value === 'all' ? '' : value)}
            value={selectedSector || 'all'}
          >
            <SelectTrigger className="w-full sm:w-[220px] bg-white/80 border-slate-200">
              <Filter className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder={filtersTranslations.t('sectorPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filtersTranslations.t('allSectors')}</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

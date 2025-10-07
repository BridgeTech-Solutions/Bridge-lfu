import { Card, CardContent } from '@/components/ui/card';
import { Users, Filter, TrendingUp } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface ClientsStatsProps {
  stats: {
    total: number;
    bySector: Record<string, number>;
    recent: number;
  };
}

export function ClientsStats({ stats }: ClientsStatsProps) {
  const statsTranslations = useTranslations('clients.stats');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{statsTranslations.t('total')}</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{statsTranslations.t('sectors')}</p>
              <p className="text-3xl font-bold text-slate-800">{Object.keys(stats.bySector).length}</p>
            </div>
            <Filter className="h-12 w-12 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{statsTranslations.t('recent')}</p>
              <p className="text-3xl font-bold text-slate-800">{stats.recent}</p>
              <p className="text-xs text-slate-500 mt-1">{statsTranslations.t('recentDescription')}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

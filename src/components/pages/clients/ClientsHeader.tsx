import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useAuthPermissions } from '@/hooks/index';
import { useTranslations } from '@/hooks/useTranslations';

export function ClientsHeader() {
  const { can } = useAuthPermissions();
  const { t } = useTranslations('clients');

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          {t('title')}
        </h1>
        <p className="text-slate-600 text-lg">
          {t('subtitle')}
        </p>
      </div>
      {can('create', 'clients') && (
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          <Link href="/clients/new">{t('button')}</Link>
        </Button>
      )}
    </div>
  );
}

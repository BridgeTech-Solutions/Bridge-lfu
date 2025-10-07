import { RocketIcon } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { useTranslations } from '@/hooks/useTranslations';

interface ClientsErrorStateProps {
  error?: string;
}

export function ClientsErrorState({ error }: ClientsErrorStateProps) {
  const errorsTranslations = useTranslations('clients.errors');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-2xl mx-auto pt-20">
        <Alert variant="destructive" className="shadow-lg border-red-200">
          <RocketIcon className="h-5 w-5" />
          <div>
            <h3 className="font-bold text-lg">{errorsTranslations.t('loadingTitle')}</h3>
            <p className="mt-2 text-sm">
              {errorsTranslations.t('loadingDescription')}
              {error && (
                <span className="block mt-1 font-mono text-xs bg-red-50 p-2 rounded">
                  {error}
                </span>
              )}
            </p>
          </div>
        </Alert>
      </div>
    </div>
  );
}

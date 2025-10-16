'use client';

import { Badge } from '@/components/ui/badge';
import { useStablePermissions } from '@/hooks';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Server, // Use a generic icon for unknown status
  Ban,
  RotateCcw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { LicenseWithClientView } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';

interface LicenseTableProps {
  licenses: LicenseWithClientView[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReactivate?: (id: string) => void;
}

// Affichage du statut (i18n)
const getStatusDisplay = (status: string | null, t: (k: string) => string) => {
  switch (status) {
    case 'active':
      return { icon: CheckCircle, color: 'success', label: t('status.active') };
    case 'expired':
      return { icon: XCircle, color: 'destructive', label: t('status.expired') };
    case 'about_to_expire':
      return { icon: AlertTriangle, color: 'warning', label: t('status.about_to_expire') };
    case 'cancelled':
      return { icon: Clock, color: 'secondary', label: t('status.cancelled') };
    default:
      return { icon: Server, color: 'default', label: t('status.unknown') };
  }
};

const formatDate = (date: string | null, locale: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(locale);
};

const formatCurrency = (amount: number | null, locale: string) => {
  if (!amount) return '-';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} FCFA`;
};

export function LicenseTable({ licenses, onView, onEdit, onDelete, onCancel, onReactivate }: LicenseTableProps) {
  const permissions = useStablePermissions();
  const { t, language } = useTranslations('licenses');
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  if (!licenses || licenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('table.emptyTitle')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.columns.name')}</TableHead>
            {permissions.canViewAllData && <TableHead>{t('table.columns.client')}</TableHead>}
            <TableHead>{t('table.columns.editor')}</TableHead>
            <TableHead>{t('table.columns.version')}</TableHead>
            <TableHead>{t('table.columns.expiryDate')}</TableHead>
            <TableHead>{t('table.columns.cost')}</TableHead>
            <TableHead>{t('table.columns.status')}</TableHead>
            <TableHead className="text-right">{t('table.columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => {
            const statusDisplay = getStatusDisplay(license.status, t);
            const StatusIcon = statusDisplay.icon;

            return (
              <TableRow key={license.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{license.name}</div>
                    {license.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {license.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                {permissions.canViewAllData && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                        {license.client_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm">{license.client_name || '-'}</span>
                    </div>
                  </TableCell>
                )}
                
                <TableCell>{license.editor || '-'}</TableCell>
                <TableCell>
                  <span className="text-sm font-mono">
                    {license.version || '-'}
                  </span>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div className="text-sm">{formatDate(license.expiry_date, locale)}</div>
                    {license.expiry_date && (
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const days = Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (days < 0) return t('relativeExpiry.expiredDays').replace('{{days}}', String(Math.abs(days)));
                          if (days === 0) return t('relativeExpiry.expireToday');
                          if (days === 1) return t('relativeExpiry.expireTomorrow');
                          if (days <= 50) return t('relativeExpiry.expireInDays').replace('{{days}}', String(days));
                          return '';
                        })()}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="font-medium">
                    {formatCurrency(license.cost, locale)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    variant={statusDisplay.color as any} 
                    className={`flex items-center w-fit ${license.status === 'cancelled' ? 'text-gray-700' : 'text-white'}`}                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusDisplay.label}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('actionsMenu.open')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actionsMenu.actions')}</DropdownMenuLabel>
                      
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(license.id!)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('actionsMenu.view')}
                        </DropdownMenuItem>
                      )}
                      
                      {permissions.can('update', 'licenses') && onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(license.id!)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('actionsMenu.edit')}
                        </DropdownMenuItem>
                      )}
                      
                      {permissions.can('update', 'licenses') && (
                        <>
                          <DropdownMenuSeparator />
                          {license.status === 'cancelled' && onReactivate ? (
                            <DropdownMenuItem 
                              className="text-green-600 focus:text-green-600 focus:bg-green-50"
                              onClick={() => onReactivate(license.id!)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {t('actionsMenu.reactivate')}
                            </DropdownMenuItem>
                          ) : license.status !== 'cancelled' && onCancel ? (
                            <DropdownMenuItem 
                              className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                              onClick={() => onCancel(license.id!)}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {t('actionsMenu.cancel')}
                            </DropdownMenuItem>
                          ) : null}
                        </>
                      )}
                      
                      {permissions.can('delete', 'licenses') && onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => onDelete(license.id!)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('actionsMenu.delete')}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
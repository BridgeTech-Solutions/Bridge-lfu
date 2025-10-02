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
import type { License, LicenseWithClientView } from '@/types';

interface LicenseTableProps {
  licenses: LicenseWithClientView[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReactivate?: (id: string) => void;
}

// Nouvelle fonction pour gérer l'affichage du statut
const getStatusDisplay = (status: string | null) => {
  switch (status) {
    case 'active':
      return { icon: CheckCircle, color: 'success', label: 'Active' };
    case 'expired':
      return { icon: XCircle, color: 'destructive', label: 'Expirée' };
    case 'about_to_expire':
      return { icon: AlertTriangle, color: 'warning', label: 'Bientôt expirée' };
    case 'cancelled':
      return { icon: Clock, color: 'secondary', label: 'Annulée' };
    default:
      return { icon: Server, color: 'default', label: 'Inconnu' };
  }
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF'
  }).format(amount);
};

export function LicenseTable({ licenses, onView, onEdit, onDelete, onCancel, onReactivate }: LicenseTableProps) {
  const permissions = useStablePermissions();

  if (!licenses || licenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune licence trouvée.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            {permissions.canViewAllData && <TableHead>Client</TableHead>}
            <TableHead>Éditeur</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Date d&apos;expiration</TableHead>
            <TableHead>Coût</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => {
            const statusDisplay = getStatusDisplay(license.status);
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
                    <div className="text-sm">{formatDate(license.expiry_date)}</div>
                    {license.expiry_date && (
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const days = Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (days < 0) return `Expirée depuis ${Math.abs(days)} jours`;
                          if (days === 0) return 'Expire aujourd\'hui';
                          if (days === 1) return 'Expire demain';
                          if (days <= 50) return `Expire dans ${days} jours`;
                          return '';
                        })()}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="font-medium">
                    {formatCurrency(license.cost)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    variant={statusDisplay.color as any} 
                    className="flex items-center w-fit text-white"
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusDisplay.label}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir le menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(license.id!)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir les détails
                        </DropdownMenuItem>
                      )}
                      
                      {permissions.can('update', 'licenses') && onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(license.id!)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
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
                              Réactiver
                            </DropdownMenuItem>
                          ) : license.status !== 'cancelled' && onCancel ? (
                            <DropdownMenuItem 
                              className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                              onClick={() => onCancel(license.id!)}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Annuler
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
                            Supprimer
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
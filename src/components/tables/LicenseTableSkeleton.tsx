import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function LicenseTableSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Simulation de l'en-tête du tableau */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]"><div className="h-4 bg-gray-200 rounded"></div></TableHead>
            <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
            <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
            <TableHead><div className="h-4 bg-gray-200 rounded"></div></TableHead>
            <TableHead className="text-right"><div className="h-4 bg-gray-200 rounded"></div></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Simulation des lignes de données */}
          {[...Array(10)].map((_, i) => ( // Affichons 10 lignes pour la page
            <TableRow key={i}>
              <TableCell className="font-medium">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </TableCell>
              <TableCell>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </TableCell>
              <TableCell className="text-right">
                <div className="h-8 bg-gray-200 rounded w-20 ml-auto"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
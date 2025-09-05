// app/api/reports/licenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

interface LicenseReportData {
  name: string;
  editor: string;
  client_name: string;
  expiry_date: string;
  status: string;
  cost: number;
  days_until_expiry: number;
  license_type?: string;
  version?: string;
  seats?: number;
  created_at: string;
}

// Forcer l'utilisation du Node.js runtime au lieu d'Edge
export const runtime = 'nodejs';

// GET /api/reports/licenses - Génération de rapport des licences
export async function GET(request: NextRequest) {
  try {
    // Utiliser getUser() au lieu de getCurrentUser() pour éviter l'avertissement
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);
    
    if (!checker.can('read', 'reports')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Validation des paramètres
    const validation = validateRequestParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { message: 'Paramètres invalides', errors: validation.errors },
        { status: 400 }
      );
    }
    
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'json';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabase.from('v_licenses_with_client').select('*');

    // Filtrage par permissions
    if (!checker.canViewAllData() && user.user_metadata?.client_id) {
      query = query.eq('client_id', user.user_metadata.client_id);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Filtrage par dates
    if (dateFrom) {
      query = query.gte('expiry_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('expiry_date', dateTo);
    }

    const { data: licenses, error } = await query.order('expiry_date', { 
      ascending: true, 
      nullsFirst: false 
    });

    if (error) {
      console.error('Erreur lors de la génération du rapport licences:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la génération du rapport' },
        { status: 500 }
      );
    }

    // Calcul des jours jusqu'à expiration et formatage des données
    const reportData: LicenseReportData[] = licenses?.map(license => ({
      name: license.name || '',
      editor: license.editor || '',
      client_name: license.client_name || '',
      expiry_date: license.expiry_date || '',
      status: license.status || '',
      cost: license.cost || 0,
      license_type: license.license_type || '',
      version: license.version || '',
      seats: license.seats || 0,
      created_at: license.created_at || '',
      days_until_expiry: license.expiry_date ? 
        Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
    })) || [];

    // Génération selon le format demandé
    switch (format) {
      case 'csv':
        return generateCSVReport(reportData);
      case 'pdf':
        return await generatePDFReportWithJsPDF(reportData, {
          title: 'Rapport des Licences',
          user: user.user_metadata?.first_name || user.email || 'Utilisateur',
          filters: { clientId, status, dateFrom, dateTo }
        });
      default:
        const metadata = getReportMetadata(reportData, { clientId, status, dateFrom, dateTo });
        return NextResponse.json({
          title: 'Rapport des Licences',
          generated_at: new Date().toISOString(),
          total_count: reportData.length,
          metadata,
          data: reportData
        });
    }

  } catch (error) {
    console.error('Erreur API GET /reports/licenses:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Fonction pour générer un rapport CSV
function generateCSVReport(data: LicenseReportData[]): NextResponse {
  const csvHeaders = [
    'Nom de la licence',
    'Éditeur',
    'Client',
    'Type de licence',
    'Version',
    'Nombre de sièges',
    'Date d\'expiration',
    'Statut',
    'Coût (XAF)',
    'Jours jusqu\'à expiration',
    'Date de création'
  ];

  const csvRows = data.map(item => [
    item.name,
    item.editor,
    item.client_name,
    item.license_type,
    item.version,
    item.seats?.toString() || '0',
    item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('fr-FR') : '',
    item.status,
    item.cost?.toString() || '0',
    item.days_until_expiry?.toString() || '0',
    item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
  ]);

const csvContent = [csvHeaders, ...csvRows]
  .map(row => row
    .map(field => `"${(field ?? '').toString().replace(/"/g, '""')}"`)
    .join(',')
  )
  .join('\n');

  const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}


// Alternative avec jsPDF (plus compatible avec Edge Runtime)
async function generatePDFReportWithJsPDF(
  data: LicenseReportData[], 
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
  }
): Promise<NextResponse> {
  try {
    // Importation dynamique de jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Configuration des couleurs et styles
    const colors = {
      primary: [37, 99, 235],
      secondary: [100, 116, 139],
      success: [5, 150, 105],
      warning: [217, 119, 6],
      danger: [220, 38, 38],
      text: [55, 65, 81],
      lightGray: [248, 250, 252]
    };

    // En-tête du document
    doc.setFontSize(20);
    doc.setTextColor(...colors.primary);
    doc.text(options.title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    // Informations générales
    doc.setFontSize(10);
    doc.setTextColor(...colors.secondary);
    const currentDate = new Date();
    doc.text(
      `Généré le ${currentDate.toLocaleDateString('fr-FR')} à ${currentDate.toLocaleTimeString('fr-FR')}`,
      doc.internal.pageSize.getWidth() / 2,
      30,
      { align: 'center' }
    );
    doc.text(`Par: ${options.user}`, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });

    // Statistiques de résumé
    const totalLicenses = data.length;
    const totalCost = data.reduce((sum, license) => sum + (license.cost || 0), 0);
    const expiredLicenses = data.filter(l => l.days_until_expiry < 0).length;
    const soonToExpire = data.filter(l => l.days_until_expiry >= 0 && l.days_until_expiry <= 30).length;

    let yPosition = 50;

    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text('Résumé Exécutif', 15, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setTextColor(...colors.secondary);
    const summaryLines = [
      `Nombre total de licences: ${totalLicenses}`,
      `Coût total: ${formatCurrency(totalCost)}`,
      `Licences expirées: ${expiredLicenses}`,
      `Expirent dans 30 jours: ${soonToExpire}`
    ];

    summaryLines.forEach(line => {
      doc.text(line, 15, yPosition);
      yPosition += 5;
    });

    yPosition += 10;

    // Tableau des données
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text('Détail des Licences', 15, yPosition);
    yPosition += 10;

    // Configuration du tableau
    const headers = ['Licence', 'Éditeur', 'Client', 'Expiration', 'Statut', 'Coût'];
    const columnWidths = [50, 40, 45, 30, 25, 30];
    const startX = 15;
    const rowHeight = 7;

    // En-têtes du tableau
    doc.setFontSize(8);
    doc.setTextColor(...colors.text);
    
    let currentX = startX;
    headers.forEach((header, index) => {
      doc.text(header, currentX, yPosition);
      currentX += columnWidths[index];
    });

    yPosition += rowHeight;

    // Ligne de séparation
    doc.setDrawColor(...colors.secondary);
    doc.line(startX, yPosition - 2, startX + columnWidths.reduce((a, b) => a + b, 0), yPosition - 2);

    // Données du tableau
    doc.setFontSize(7);
    
    data.forEach((license, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
        
        // Réafficher les en-têtes sur la nouvelle page
        doc.setFontSize(8);
        doc.setTextColor(...colors.text);
        currentX = startX;
        headers.forEach((header, index) => {
          doc.text(header, currentX, yPosition);
          currentX += columnWidths[index];
        });
        yPosition += rowHeight;
        doc.line(startX, yPosition - 2, startX + columnWidths.reduce((a, b) => a + b, 0), yPosition - 2);
      }

      const rowData = [
        truncateText(license.name, 25),
        truncateText(license.editor, 20),
        truncateText(license.client_name, 22),
        license.expiry_date ? new Date(license.expiry_date).toLocaleDateString('fr-FR') : 'N/A',
        license.status,
        formatCurrency(license.cost || 0, true)
      ];

      currentX = startX;
      rowData.forEach((cellData, colIndex) => {
        // Couleur selon le statut ou l'expiration
        if (colIndex === 4) { // Statut
          const statusColor = getStatusColorRGB(license.status);
          doc.setTextColor(...statusColor);
        } else if (colIndex === 3 && license.days_until_expiry < 0) { // Date expirée
          doc.setTextColor(...colors.danger);
        } else if (colIndex === 3 && license.days_until_expiry <= 30) { // Expire bientôt
          doc.setTextColor(...colors.warning);
        } else {
          doc.setTextColor(...colors.text);
        }

        doc.text(cellData, currentX, yPosition, { maxWidth: columnWidths[colIndex] - 2 });
        currentX += columnWidths[colIndex];
      });

      yPosition += rowHeight;
    });

    // Pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...colors.secondary);
      doc.text(
        `Page ${i} sur ${pageCount} - Généré le ${currentDate.toLocaleDateString('fr-FR')}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw new Error('Impossible de générer le PDF');
  }
}

// Fonctions utilitaires
function formatCurrency(amount: number, short: boolean = false): string {
  if (short && amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M XAF`;
  } else if (short && amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k XAF`;
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0
  }).format(amount);
}

function getStatusColorRGB(status: string): [number, number, number] {
  const statusColors: Record<string, [number, number, number]> = {
    'actif': [5, 150, 105],
    'active': [5, 150, 105],
    'expiré': [220, 38, 38],
    'expired': [220, 38, 38],
    'about_to_expire': [217, 119, 6]
  };
  return statusColors[status] || [55, 65, 81];
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

// Validation des paramètres
function validateRequestParams(searchParams: URLSearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const format = searchParams.get('format');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  // Validation du format
  if (format && !['json', 'csv', 'pdf'].includes(format)) {
    errors.push('Format non supporté. Formats acceptés: json, csv, pdf');
  }

  // Validation des dates
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    errors.push('Format de date_from invalide (format attendu: YYYY-MM-DD)');
  }

  if (dateTo && isNaN(Date.parse(dateTo))) {
    errors.push('Format de date_to invalide (format attendu: YYYY-MM-DD)');
  }

  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
    errors.push('La date de début doit être antérieure à la date de fin');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Fonction pour obtenir les métadonnées du rapport
function getReportMetadata(data: LicenseReportData[], filters: Record<string, string | null>) {
  const now = new Date();
  
  return {
    total_licenses: data.length,
    total_cost: data.reduce((sum, license) => sum + (license.cost || 0), 0),
    expired_count: data.filter(l => l.days_until_expiry < 0).length,
    expiring_soon_count: data.filter(l => l.days_until_expiry >= 0 && l.days_until_expiry <= 30).length,
    active_count: data.filter(l => l.status === 'actif' || l.status === 'active').length,
    filters_applied: filters,
    generated_at: now.toISOString(),
    generated_by: 'Système de Gestion IT'
  };
}
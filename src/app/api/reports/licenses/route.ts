import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import PDFDocument from 'pdfkit';
// On importe le type LicenseWithClientView qui correspond à la vue de la base de données.
import { LicenseWithClientView, LicenseStatus } from '@/types'; 

// This interface is adjusted to be compatible with the new data fetching approach
// The properties 'license_type', 'version', and 'seats' will now be correctly fetched
interface LicenseReportData {
  name: string;
  editor: string;
  client_name: string;
  expiry_date: string;
  status: LicenseStatus;
  cost: number;
  days_until_expiry: number;
  version: string | null;
  created_at: string;
}

// GET /api/reports/licenses - Génération de rapport des licences
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
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

    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'json';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // On utilise la vue 'v_licenses_with_client' comme prévu.
    let query = supabase.from('v_licenses_with_client').select('*');

    // Filtrage par permissions
    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Définir les statuts de licence valides pour le filtrage
    const validStatuses = ['active', 'expired', 'about_to_expire', 'cancelled'];

    // Filtrage par statut, en validant le statut
    if (status && validStatuses.includes(status)) {
      query = query.eq('status', status as LicenseStatus);
    }
    // Filtrage par dates
    if (dateFrom) {
      query = query.gte('expiry_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('expiry_date', dateTo);
    }

    // Sort the licenses by expiry date.
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

    // Correction : On caste les données en tant que LicenseWithClientView[] pour résoudre l'erreur de type.
    const typedLicenses = (licenses || []) as LicenseWithClientView[];

    // Now, we can safely map the data because 'licenses' contains all the required fields.
    const reportData: LicenseReportData[] = typedLicenses?.map(license => {
      const daysUntilExpiry = license.expiry_date
        ? Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        name: license.name || '',
        editor: license.editor || '',
        client_name: license.client_name || '',
        expiry_date: license.expiry_date || '',
        status: license.status || 'active', // Default to 'active' if null
        cost: license.cost || 0,
        version: license.version || '',
        created_at: license.created_at || '',
        days_until_expiry: daysUntilExpiry
      };
    }) || [];

    // Génération selon le format demandé
    switch (format) {
      case 'csv':
        return generateCSVReport(reportData);
      case 'pdf':
        return await generatePDFReport(reportData, {
          title: 'Rapport des Licences',
          user: user.first_name || user.email,
          filters: { clientId, status, dateFrom, dateTo }
        });
      default:
        return NextResponse.json({
          title: 'Rapport des Licences',
          generated_at: new Date().toISOString(),
          total_count: reportData.length,
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
    item.version || '',
    item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('fr-FR') : '',
    item.status,
    item.cost?.toString() || '0',
    item.days_until_expiry?.toString() || '0',
    item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// Fonction pour générer un rapport PDF
async function generatePDFReport(
  data: LicenseReportData[], 
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
  }
): Promise<NextResponse> {
    // const PDFDocument = (await import('pdfkit')).default;

  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: options.title,
        Author: 'Système de Gestion IT',
        Subject: 'Rapport des licences logicielles',
        Creator: 'Application de Gestion IT'
      }
    });

    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.pdf`;
      
      resolve(new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      }));
    });

    // Configuration des couleurs
    const colors = {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      text: '#374151',
      lightGray: '#f8fafc'
    };

    // En-tête du document
    doc.fontSize(24).fillColor(colors.primary).text(options.title, { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(12).fillColor(colors.secondary)
        .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' })
        .text(`Par: ${options.user}`, { align: 'center' });
    
    doc.moveDown(1);

    // Informations sur les filtres appliqués
    if (Object.values(options.filters).some(v => v)) {
      doc.fontSize(14).fillColor(colors.text).text('Filtres appliqués:', { underline: true });
      doc.moveDown(0.3);
      
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value) {
          const filterLabels: Record<string, string> = {
            clientId: 'Client',
            status: 'Statut',
            dateFrom: 'Date de début',
            dateTo: 'Date de fin'
          };
          doc.fontSize(10).fillColor(colors.secondary)
              .text(`${filterLabels[key]}: ${value}`);
        }
      });
      doc.moveDown(1);
    }

    // Statistiques de résumé
    const totalLicenses = data.length;
    const totalCost = data.reduce((sum, license) => sum + (license.cost || 0), 0);
    const expiredLicenses = data.filter(l => l.days_until_expiry < 0).length;
    const soonToExpire = data.filter(l => l.days_until_expiry >= 0 && l.days_until_expiry <= 30).length;

    doc.fontSize(14).fillColor(colors.text).text('Résumé Exécutif', { underline: true });
    doc.moveDown(0.5);

    const summaryData = [
      { label: 'Nombre total de licences', value: totalLicenses.toString() },
      { label: 'Coût total', value: formatCurrency(totalCost) },
      { label: 'Licences expirées', value: expiredLicenses.toString(), color: expiredLicenses > 0 ? colors.danger : colors.text },
      { label: 'Expirent dans 30 jours', value: soonToExpire.toString(), color: soonToExpire > 0 ? colors.warning : colors.text }
    ];

    summaryData.forEach(item => {
      doc.fontSize(10).fillColor(colors.secondary).text(`${item.label}:`, { continued: true });
      doc.fillColor(item.color || colors.text).text(` ${item.value}`);
    });

    doc.moveDown(1.5);

    // Tableau des données
    doc.fontSize(14).fillColor(colors.text).text('Détail des Licences', { underline: true });
    doc.moveDown(0.5);

    // En-têtes du tableau
    const tableTop = doc.y;
    const tableHeaders = ['Licence', 'Éditeur', 'Client', 'Expiration', 'Statut', 'Coût'];
    const columnWidths = [120, 80, 100, 80, 60, 80];
    let currentX = 50;

    // Dessiner les en-têtes
    doc.fontSize(8).fillColor(colors.text);
    tableHeaders.forEach((header, index) => {
      doc.rect(currentX, tableTop, columnWidths[index], 20)
          .fillAndStroke(colors.lightGray, colors.secondary);
      
      doc.fillColor(colors.text)
          .text(header, currentX + 5, tableTop + 6, {
            width: columnWidths[index] - 10,
            align: 'left'
          });
      
      currentX += columnWidths[index];
    });

    // Données du tableau
    let currentY = tableTop + 25;
    doc.fontSize(7);

    data.forEach((license, index) => {
      if (currentY > 750) { // Nouvelle page si nécessaire
        doc.addPage();
        currentY = 50;
      }

      currentX = 50;
      const rowHeight = 18;

      // Couleur de fond alternée
      if (index % 2 === 0) {
        doc.rect(50, currentY, 520, rowHeight).fillAndStroke('#f8fafc', '#e2e8f0');
      }

      const rowData = [
        license.name,
        license.editor,
        license.client_name,
        license.expiry_date ? new Date(license.expiry_date).toLocaleDateString('fr-FR') : 'N/A',
        license.status,
        formatCurrency(license.cost || 0)
      ];

      rowData.forEach((cellData, colIndex) => {
        // Couleur du texte selon le statut
        let textColor = colors.text;
        if (colIndex === 4) { // Colonne statut
          textColor = getStatusColor(license.status);
        } else if (colIndex === 3 && license.days_until_expiry < 0) { // Date expirée
          textColor = colors.danger;
        } else if (colIndex === 3 && license.days_until_expiry <= 30) { // Expire bientôt
          textColor = colors.warning;
        }

        doc.fillColor(textColor)
            .text(cellData, currentX + 3, currentY + 4, {
              width: columnWidths[colIndex] - 6,
              align: 'left',
              ellipsis: true
            });

        currentX += columnWidths[colIndex];
      });

      currentY += rowHeight;
    });

    // Pied de page
    doc.fontSize(8).fillColor(colors.secondary);
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.text(
        `Page ${i + 1} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        50,
        750,
        { align: 'center' }
      );
    }

    doc.end();
  });
}

// Fonctions utilitaires
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0
  }).format(amount);
}

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'actif': '#059669',
    'active': '#059669',
    'expiré': '#dc2626',
    'expired': '#dc2626',
    'about_to_expire': '#d97706'
  };
  return statusColors[status] || '#374151';
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
    active_count: data.filter(l => l.status === 'active').length,
    filters_applied: filters,
    generated_at: now.toISOString(),
    generated_by: 'Système de Gestion IT'
  };
}

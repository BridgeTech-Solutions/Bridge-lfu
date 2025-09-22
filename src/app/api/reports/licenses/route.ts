import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanCost(value: any): number {
  if (!value) return 0;

  const cleaned = String(value)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // supprime espaces spéciaux & caractères invisibles
    .replace(/[^0-9.,]/g, '')                    // garde uniquement chiffres, point et virgule
    .replace(',', '.');                          // convertit virgule → point

  return parseFloat(cleaned) || 0;
}


// Charger la police en dehors de la fonction principale pour éviter de le faire à chaque requête.
// La police sera chargée une fois au démarrage du serveur.
//
// SOLUTION : Déplacer le fichier de police dans un dossier accessible par le serveur,
// par exemple 'src/lib/fonts', pour que 'fs.readFileSync' puisse y accéder de manière fiable.
const fontPath = path.join(process.cwd(), 'src', 'lib', 'fonts', 'Roboto-Regular.ttf');
let fontBuffer: Buffer;
try {
  fontBuffer = fs.readFileSync(fontPath);
} catch (err) {
  console.error("Erreur de chargement de la police: Le fichier 'Roboto-Regular.ttf' n'a pas été trouvé. Assurez-vous de l'avoir déplacé dans le dossier 'src/lib/fonts'.", err);
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

    const validation = validateRequestParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    let query = supabase.from('v_licenses_with_client').select('*');

    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const validStatuses = ['active', 'expired', 'about_to_expire', 'cancelled'];
    if (status && validStatuses.includes(status)) {
      query = query.eq('status', status as LicenseStatus);
    }

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

    const typedLicenses = (licenses || []) as LicenseWithClientView[];

    const reportData: LicenseReportData[] = typedLicenses?.map(license => {
      const daysUntilExpiry = license.expiry_date
        ? Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      // Amélioration de la correction pour s'assurer que le coût est un nombre.
      // On retire d'abord toutes les espaces, puis on retire tous les caractères non-numériques (sauf le point).
      const costAsNumber = parseFloat(String(license.cost).replace(/\s/g, '').replace(/[^0-9.]/g, ''));

      return {
        name: license.name || '',
        editor: license.editor || '',
        client_name: license.client_name || '',
        expiry_date: license.expiry_date || '',
        status: license.status || 'active',
        cost: costAsNumber || 0, // Utilisez la valeur convertie
        version: license.version || '',
        created_at: license.created_at || '',
        days_until_expiry: daysUntilExpiry
      };
    }) || [];

    switch (format) {
      case 'csv':
        return generateCSVReport(reportData);
      case 'pdf':
        // J'ai mis à jour cette ligne pour inclure le buffer de la police.
        return await generatePDFReport(reportData, fontBuffer, {
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

// function generateCSVReport(data: LicenseReportData[]): NextResponse {
//   const csvHeaders = [
//     'Nom de la licence',
//     'Éditeur',
//     'Client',
//     'Date d\'expiration',
//     'Statut',
//     'Coût',
//     'Jours jusqu\'à expiration',
//     'Version',
//     'Date de création'
//   ];

//   const csvRows = data.map(item => [
//     item.name,
//     item.editor,
//     item.client_name,
//     item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('fr-FR') : '',
//     item.status,
//     item.cost?.toString() || '0',
//     item.days_until_expiry?.toString() || '0',
//     item.version || '',
//     item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
//   ]);

//   const csvContent = [csvHeaders, ...csvRows]
//     .map(row => row.map(field => `"${field}"`).join(','))
//     .join('\n');

//   const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.csv`;

//   return new NextResponse(csvContent, {
//     headers: {
//       'Content-Type': 'text/csv; charset=utf-8',
//       'Content-Disposition': `attachment; filename="${filename}"`
//     }
//   });
// }
function generateCSVReport(data: LicenseReportData[]): NextResponse {
  // Définir le BOM pour un encodage UTF-8 correct dans Excel
  const BOM = '\uFEFF'; 
  const DELIMITER = ';';

  const csvHeaders = [
    'Nom de la licence',
    'Éditeur',
    'Client',
    'Date d\'expiration',
    'Statut',
    'Coût',
    'Jours jusqu\'à expiration',
    'Version',
    'Date de création'
  ];

  const csvRows = data.map(item => [
    item.name,
    item.editor,
    item.client_name,
    item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('fr-FR') : '',
    item.status,
    // Le coût est converti en chaîne pour le CSV, et la virgule est remplacée par un point-virgule pour éviter les erreurs de format.
    item.cost?.toString().replace('.', ',') || '0', 
    item.days_until_expiry?.toString() || '0',
    item.version || '',
    item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
  ]);

  // Joindre les lignes et les champs avec le nouveau délimiteur
  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(DELIMITER))
    .join('\n');

  const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.csv`;

  // Préfixer le contenu avec le BOM et renvoyer le tout
  return new NextResponse(BOM + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
async function generatePDFReport(
  data: LicenseReportData[], 
  fontBuffer: Buffer,
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
  }
): Promise<NextResponse> {
  // AJOUT : Vérification que le buffer de police a été chargé
  if (!fontBuffer) {
    return NextResponse.json(
      { message: 'Erreur serveur: La police personnalisée n\'a pas pu être chargée. Assurez-vous que le fichier est dans le bon dossier.' },
      { status: 500 }
    );
  }

  return new Promise((resolve, reject) => {
    // La solution : passer le buffer de la police directement dans les options du constructeur.
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
    // ✅ Enregistrer la police
    doc.registerFont('Roboto', fontBuffer);
    doc.font('Roboto'); 

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

    doc.on('error', (err) => {
      reject(err);
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
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }

      currentX = 50;
      const rowHeight = 18;

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
        let textColor = colors.text;
        if (colIndex === 4) {
          textColor = getStatusColor(license.status);
        } else if (colIndex === 3 && license.days_until_expiry < 0) {
          textColor = colors.danger;
        } else if (colIndex === 3 && license.days_until_expiry <= 30) {
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
    
    // Fermer le document pour déclencher les événements 'data' et 'end'
    doc.end();
  });
}

// Fonctions utilitaires
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0
  })
    .format(amount)
    .replace(/[\u00A0\u202F]/g, ' ')  // transforme les espaces insécables en espaces normaux
    + ' FCFA';
}



function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'active': '#059669',
    'expired': '#dc2626',
    'about_to_expire': '#d97706',
    'cancelled': '#64748b'
  };
  return statusColors[status] || '#374151';
}

function validateRequestParams(searchParams: URLSearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const format = searchParams.get('format');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  if (format && !['json', 'csv', 'pdf'].includes(format)) {
    errors.push('Format non supporté. Formats acceptés: json, csv, pdf');
  }

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

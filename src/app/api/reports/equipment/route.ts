// app/api/reports/equipment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// Types d'équipements et statuts
type EquipmentType = "pc" | "serveur" | "routeur" | "switch" | "imprimante" | "autre";
type EquipmentStatus = "actif" | "en_maintenance" | "obsolete" | "bientot_obsolete" | "retire";

// Interface pour les données du rapport
interface EquipmentReportData {
  name: string;
  type: EquipmentType;
  brand: string;
  model: string;
  serial_number: string;
  client_name: string;
  purchase_date: string;
  estimated_obsolescence_date: string;
  end_of_sale: string;
  status: EquipmentStatus;
  cost: number;
  days_until_obsolescence: number | null;
  days_until_end_of_sale: number | null;
  created_at: string;
}

// Charger la police en dehors de la fonction principale pour éviter de le faire à chaque requête.
const fontPath = path.join(process.cwd(), 'src', 'lib', 'fonts', 'Roboto-Regular.ttf');
let fontBuffer: Buffer;
try {
  fontBuffer = fs.readFileSync(fontPath);
} catch (err) {
  console.error("Erreur de chargement de la police: Le fichier 'Roboto-Regular.ttf' n'a pas été trouvé. Assurez-vous de l'avoir déplacé dans le dossier 'src/lib/fonts'.", err);
}

// GET /api/reports/equipment - Génération de rapport des équipements
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
    
    // if (!checker.can('read', 'reports')) {
    //   return NextResponse.json(
    //     { message: 'Permissions insuffisantes' },
    //     { status: 403 }
    //   );
    // }

    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const clientId = searchParams.get('client_id');

    if (!checker.canViewAllData()) {
      // utilisateur 'client' : forcer client_id coté serveur
      if (clientId && clientId !== user.client_id) {
        return NextResponse.json({ message: 'Vous ne pouvez pas accéder aux rapports d\'un autre client' }, { status: 403 });
      }
    }

    const canAccessReports = checker.can('read', 'reports', { client_id: user.client_id });
    if (!canAccessReports) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes pour accéder aux rapports' },
        { status: 403 }
      );
    }
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'json';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const validation = validateRequestParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    let query = supabase.from('v_equipment_with_client').select('*');

    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status as EquipmentStatus);
    }
    if (type) {
      query = query.eq('type', type as EquipmentType);
    }
    
    // Filtres sur les dates d'obsolescence
    if (dateFrom) {
      query = query.gte('estimated_obsolescence_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('estimated_obsolescence_date', dateTo);
    }


    const { data: equipment, error } = await query.order('estimated_obsolescence_date', { 
      ascending: true, 
      nullsFirst: false 
    });

    if (error) {
      console.error('Erreur lors de la génération du rapport équipements:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la génération du rapport' },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedEquipment = (equipment || []) as any[];

    const reportData: EquipmentReportData[] = typedEquipment.map(item => {
      const daysUntilObsolescence = item.estimated_obsolescence_date
        ? Math.ceil((new Date(item.estimated_obsolescence_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      const daysUntilEndOfSale = item.end_of_sale
        ? Math.ceil((new Date(item.end_of_sale).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        name: item.name || '',
        type: item.type || 'autre',
        brand: item.brand || '',
        model: item.model || '',
        serial_number: item.serial_number || '',
        client_name: item.client_name || '',
        purchase_date: item.purchase_date || '',
        estimated_obsolescence_date: item.estimated_obsolescence_date || '',
        end_of_sale: item.end_of_sale || '',
        status: item.status || 'actif',
        cost: item.cost || 0,
        days_until_obsolescence: daysUntilObsolescence,
        days_until_end_of_sale: daysUntilEndOfSale,
        created_at: item.created_at || ''
      };
    }) || [];


    switch (format) {
      case 'csv':
        return generateCSVReport(reportData);
      case 'pdf':
        return await generatePDFReport(reportData, fontBuffer, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, status, type, dateFrom, dateTo }
        });
      default:
        return NextResponse.json({
          title: 'Rapport des Équipements',
          generated_at: new Date().toISOString(),
          total_count: reportData.length,
          data: reportData
        });
    }

  } catch (error) {
    console.error('Erreur API GET /reports/equipment:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// // Fonctions utilitaires pour le rapport CSV
// function generateCSVReport(data: EquipmentReportData[]): NextResponse {
//   const csvHeaders = [
//     'Nom de l\'équipement',
//     'Type',
//     'Marque',
//     'Modèle',
//     'Client',
//     'Statut',
//     'Date d\'obsolescence estimée',
//     'Jours jusqu\'à obsolescence',
//     'Date de fin de vente',
//     'Jours jusqu\'à fin de vente',
//     'Date de création'
//   ];

//   const csvRows = data.map(item => [
//     item.name,
//     item.type,
//     item.brand,
//     item.model,
//     item.client_name,
//     item.status,
//     item.estimated_obsolescence_date ? new Date(item.estimated_obsolescence_date).toLocaleDateString('fr-FR') : '',
//     item.days_until_obsolescence?.toString() || '',
//     item.end_of_sale ? new Date(item.end_of_sale).toLocaleDateString('fr-FR') : '',
//     item.days_until_end_of_sale?.toString() || '',
//     item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
//   ]);

//   const csvContent = [csvHeaders, ...csvRows]
//     .map(row => row.map(field => `"${field}"`).join(','))
//     .join('\n');

//   const filename = `rapport_equipements_${new Date().toISOString().split('T')[0]}.csv`;

//   return new NextResponse(csvContent, {
//     headers: {
//       'Content-Type': 'text/csv; charset=utf-8',
//       'Content-Disposition': `attachment; filename="${filename}"`
//     }
//   });
// }
function generateCSVReport(data: EquipmentReportData[]): NextResponse {
  // Définir le BOM pour un encodage UTF-8 correct dans Excel
  const BOM = '\uFEFF';
  const DELIMITER = ';';

  const csvHeaders = [
    'Nom de l\'équipement',
    'Type',
    'Marque',
    'Modèle',
    'Client',
    'Statut',
    'Date d\'obsolescence estimée',
    'Jours jusqu\'à obsolescence',
    'Date de fin de vente',
    'Jours jusqu\'à fin de vente',
    'Date de création'
  ];

  const csvRows = data.map(item => [
    item.name,
    item.type,
    item.brand,
    item.model,
    item.client_name,
    item.status,
    item.estimated_obsolescence_date ? new Date(item.estimated_obsolescence_date).toLocaleDateString('fr-FR') : '',
    item.days_until_obsolescence?.toString() || '',
    item.end_of_sale ? new Date(item.end_of_sale).toLocaleDateString('fr-FR') : '',
    item.days_until_end_of_sale?.toString() || '',
    item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
  ]);

  // Joindre les lignes et les champs avec le nouveau délimiteur
  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(DELIMITER))
    .join('\n');

  const filename = `rapport_equipements_${new Date().toISOString().split('T')[0]}.csv`;

  // Préfixer le contenu avec le BOM et renvoyer le tout
  return new NextResponse(BOM + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
// Fonctions utilitaires pour le rapport PDF
async function generatePDFReport(
  data: EquipmentReportData[], 
  fontBuffer: Buffer,
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
  }
): Promise<NextResponse> {
  if (!fontBuffer) {
    return NextResponse.json(
      { message: 'Erreur serveur: La police personnalisée n\'a pas pu être chargée. Assurez-vous que le fichier est dans le bon dossier.' },
      { status: 500 }
    );
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      font: fontBuffer as unknown as string, 
      size: 'A4',
      margin: 50,
      info: {
        Title: options.title,
        Author: 'Système de Gestion IT',
        Subject: 'Rapport des équipements IT',
        Creator: 'Application de Gestion IT'
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const filename = `rapport_equipements_${new Date().toISOString().split('T')[0]}.pdf`;
      
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
            type: 'Type',
            dateFrom: 'Date de début (obsolescence)',
            dateTo: 'Date de fin (obsolescence)'
          };
          doc.fontSize(10).fillColor(colors.secondary)
              .text(`${filterLabels[key]}: ${value}`);
        }
      });
      doc.moveDown(1);
    }

    // Statistiques de résumé
    const totalEquipment = data.length;
    const obsoleteEquipment = data.filter(e => e.status === 'obsolete').length;
    const soonToBeObsolete = data.filter(e => e.status === 'bientot_obsolete').length;
    const inMaintenance = data.filter(e => e.status === 'en_maintenance').length;
    
    doc.fontSize(14).fillColor(colors.text).text('Résumé Exécutif', { underline: true });
    doc.moveDown(0.5);

    const summaryData = [
      { label: 'Nombre total d\'équipements', value: totalEquipment.toString() },
      { label: 'Équipements obsolètes', value: obsoleteEquipment.toString(), color: obsoleteEquipment > 0 ? colors.danger : colors.text },
      { label: 'Obsolètes bientôt', value: soonToBeObsolete.toString(), color: soonToBeObsolete > 0 ? colors.warning : colors.text },
      { label: 'En maintenance', value: inMaintenance.toString(), color: inMaintenance > 0 ? colors.secondary : colors.text }
    ];

    summaryData.forEach(item => {
      doc.fontSize(10).fillColor(colors.secondary).text(`${item.label}:`, { continued: true });
      doc.fillColor(item.color || colors.text).text(` ${item.value}`);
    });

    doc.moveDown(1.5);

    // Tableau des données
    doc.fontSize(14).fillColor(colors.text).text('Détail des Équipements', { underline: true });
    doc.moveDown(0.5);

    // En-têtes du tableau
    const tableTop = doc.y;
    const tableHeaders = ['Nom', 'Type', 'Marque', 'Modèle', 'Client', 'Statut', 'Date Obsol.'];
    const columnWidths = [100, 60, 60, 80, 80, 60, 80];
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

    data.forEach((equipment, index) => {
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
        equipment.name,
        equipment.type,
        equipment.brand,
        equipment.model,
        equipment.client_name,
        equipment.status,
        equipment.estimated_obsolescence_date ? new Date(equipment.estimated_obsolescence_date).toLocaleDateString('fr-FR') : 'N/A'
      ];

      rowData.forEach((cellData, colIndex) => {
        let textColor = colors.text;
        if (colIndex === 5) { // Colonne "Statut"
          textColor = getStatusColor(equipment.status);
        } else if (colIndex === 6) { // Colonne "Date Obsol."
          if (equipment.days_until_obsolescence !== null && equipment.days_until_obsolescence < 0) {
            textColor = colors.danger;
          } else if (equipment.days_until_obsolescence !== null && equipment.days_until_obsolescence <= 90) {
            textColor = colors.warning;
          }
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

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'actif': '#059669', // vert
    'obsolete': '#dc2626', // rouge
    'bientot_obsolete': '#d97706', // orange
    'en_maintenance': '#2563eb', // bleu
    'retire': '#64748b' // gris
  };
  return statusColors[status] || '#374151';
}

function validateRequestParams(searchParams: URLSearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const format = searchParams.get('format');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const validFormats = ['json', 'csv', 'pdf'];

  if (format && !validFormats.includes(format)) {
    errors.push(`Format non supporté. Formats acceptés: ${validFormats.join(', ')}`);
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
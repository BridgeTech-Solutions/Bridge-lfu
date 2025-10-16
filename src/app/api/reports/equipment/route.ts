import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

type EquipmentType = "pc" | "serveur" | "routeur" | "switch" | "imprimante" | "autre";
type EquipmentStatus = "actif" | "en_maintenance" | "obsolete" | "bientot_obsolete" | "retire";

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

const fontPath = path.join(process.cwd(), 'src', 'lib', 'fonts', 'Roboto-Regular.ttf');
let fontBuffer: Buffer;
try {
  fontBuffer = fs.readFileSync(fontPath);
} catch (err) {
  console.error("Erreur de chargement de la police: Le fichier 'Roboto-Regular.ttf' n'a pas été trouvé.", err);
}

// GET /api/reports/equipment
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const checker = new PermissionChecker(user);
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const clientId = searchParams.get('client_id');

    if (!checker.canViewAllData()) {
      if (clientId && clientId !== user.client_id) {
        return NextResponse.json({ message: 'Vous ne pouvez pas accéder aux rapports d\'un autre client' }, { status: 403 });
      }
    }

    const canAccessReports = checker.can('read', 'reports', { client_id: user.client_id });
    if (!canAccessReports) {
      return NextResponse.json({ message: 'Permissions insuffisantes pour accéder aux rapports' }, { status: 403 });
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

    if (status) query = query.eq('status', status as EquipmentStatus);
    if (type) query = query.eq('type_code', type as EquipmentType);
    if (dateFrom) query = query.gte('estimated_obsolescence_date', dateFrom);
    if (dateTo) query = query.lte('estimated_obsolescence_date', dateTo);

    const { data: equipment, error } = await query.order('estimated_obsolescence_date', { 
      ascending: true, 
      nullsFirst: false 
    });

    if (error) {
      console.error('Erreur lors de la génération du rapport équipements:', error);
      return NextResponse.json({ message: 'Erreur lors de la génération du rapport' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedEquipment = (equipment || []) as any[];

    const reportData: EquipmentReportData[] = (typedEquipment || []).map((item) => {
      const brandName = item.brand_name || item.brand || '';
      const typeCode = (item.type_code || item.type || 'autre') as EquipmentType;
      const daysUntilObsolescence = item.estimated_obsolescence_date
        ? Math.ceil((new Date(item.estimated_obsolescence_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      const daysUntilEndOfSale = item.end_of_sale
        ? Math.ceil((new Date(item.end_of_sale).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        name: item.name || '',
        type: typeCode,
        brand: brandName,
        model: item.model || '',
        serial_number: item.serial_number || '',
        client_name: item.client_name || '',
        purchase_date: item.purchase_date || '',
        estimated_obsolescence_date: item.estimated_obsolescence_date || '',
        end_of_sale: item.end_of_sale || '',
        status: (item.status as EquipmentStatus) || 'actif',
        cost: item.cost || 0,
        days_until_obsolescence: daysUntilObsolescence,
        days_until_end_of_sale: daysUntilEndOfSale,
        created_at: item.created_at || ''
      };
    });

    const clientName = clientId && reportData.length > 0 ? reportData[0].client_name : null;

    switch (format) {
      case 'csv':
        return generateCSVReport(reportData);
      case 'pdf':
        return await generatePDFReport(reportData, fontBuffer, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, clientName, status, type, dateFrom, dateTo },
          isClientUser: !checker.canViewAllData()
        });
      case 'excel':
        return await generateExcelReport(reportData, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, clientName, status, type, dateFrom, dateTo },
          isClientUser: !checker.canViewAllData()
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
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// Fonction de génération CSV
function generateCSVReport(data: EquipmentReportData[]): NextResponse {
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

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(DELIMITER))
    .join('\n');

  const filename = `rapport_equipements_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(BOM + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// Fonction de génération Excel
async function generateExcelReport(
  data: EquipmentReportData[],
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
    isClientUser?: boolean;
  }
): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'Système de Gestion IT';
  workbook.lastModifiedBy = options.user;
  workbook.created = new Date();
  workbook.modified = new Date();
  
  const worksheet = workbook.addWorksheet('Rapport des Équipements', {
    properties: { tabColor: { argb: '059669' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
  });

  // --- DÉBUT DES CORRECTIONS ---

  // 1. Ajout de la colonne 'days_until_end_of_sale' et ajustement de la largeur des autres colonnes
  worksheet.columns = [
    {  key: 'name', width: 30 },
    {  key: 'type', width: 15 },
    {  key: 'brand', width: 18 },
    {  key: 'model', width: 20 },
    {  key: 'serial_number', width: 20 }, // Ajout de la colonne N° série
    {  key: 'client_name', width: 25 },
    {  key: 'purchase_date', width: 18 },
    {  key: 'estimated_obsolescence_date', width: 20 },
    {  key: 'end_of_sale', width: 18 },
    {  key: 'status', width: 18 },
    {  key: 'cost', width: 15 },
    {  key: 'days_until_obsolescence', width: 18 },
    {  key: 'days_until_end_of_sale', width: 18 } // Ajout de la colonne Jours restants (Fin Vente)
  ];

  // 2. Fusion des cellules du titre et des informations pour la nouvelle largeur (A1:M1 et A2:M2)
  const totalColumns = worksheet.columns.length;
  const lastColumnLetter = String.fromCharCode(65 + totalColumns - 1); // 65 est 'A'
  
  worksheet.mergeCells(`A1:${lastColumnLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 18, bold: true, color: { argb: '059669' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'f8fafc' }
  };

  worksheet.mergeCells(`A2:${lastColumnLetter}2`);
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par ${options.user}`;
  infoCell.font = { size: 10, italic: true, color: { argb: '64748b' } };
  infoCell.alignment = { horizontal: 'center' };

  worksheet.addRow([]); // Ligne vide

  const headerRow = worksheet.addRow([
    'Nom de l\'équipement',
    'Type',
    'Marque',
    'Modèle',
    'N° série',
    'Client',
    'Date d\'achat',
    'Date obsolescence',
    'Fin de vente',
    'Statut',
    'Coût (FCFA)',
    'Jours restants (Obsol.)',
    'Jours restants (Fin Vente)'
  ]);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '059669' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 40; // Augmentation de la hauteur pour le texte wrappé

  data.forEach((item, index) => {
    const row = worksheet.addRow({
      name: item.name,
      type: item.type,
      brand: item.brand,
      model: item.model,
      serial_number: item.serial_number, // Ajout de la donnée
      client_name: item.client_name,
      purchase_date: item.purchase_date ? new Date(item.purchase_date) : 'N/A',
      estimated_obsolescence_date: item.estimated_obsolescence_date ? new Date(item.estimated_obsolescence_date) : 'N/A',
      end_of_sale: item.end_of_sale ? new Date(item.end_of_sale) : 'N/A',
      status: item.status,
      cost: item.cost,
      days_until_obsolescence: item.days_until_obsolescence,
      days_until_end_of_sale: item.days_until_end_of_sale // Ajout de la donnée
    });

    // Mise en forme de la ligne (couleur de fond alternée)
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f8fafc' }
      };
    }

    // Mise en forme des dates et coûts
    if (item.purchase_date) row.getCell('purchase_date').numFmt = 'dd/mm/yyyy';
    if (item.estimated_obsolescence_date) row.getCell('estimated_obsolescence_date').numFmt = 'dd/mm/yyyy';
    if (item.end_of_sale) row.getCell('end_of_sale').numFmt = 'dd/mm/yyyy';
    row.getCell('cost').numFmt = '#,##0';

    // Mise en forme du statut
    const statusCell = row.getCell('status');
    const statusColors: Record<string, string> = {
      'actif': '059669',
      'obsolete': 'dc2626',
      'bientot_obsolete': 'd97706',
      'en_maintenance': '2563eb',
      'retire': '64748b'
    };
    const statusBgColors: Record<string, string> = {
      'actif': 'd1fae5',
      'obsolete': 'fee2e2',
      'bientot_obsolete': 'fed7aa',
      'en_maintenance': 'dbeafe',
      'retire': 'f1f5f9'
    };
    
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: statusBgColors[item.status] || 'f1f5f9' }
    };
    statusCell.font = {
      color: { argb: statusColors[item.status] || '64748b' },
      bold: true
    };
    statusCell.alignment = { horizontal: 'center' };

    // Mise en forme des jours restants obsolescence
    const daysObsolescenceCell = row.getCell('days_until_obsolescence');
    if (item.days_until_obsolescence !== null) {
      if (item.days_until_obsolescence < 0) {
        daysObsolescenceCell.font = { color: { argb: 'dc2626' }, bold: true };
      } else if (item.days_until_obsolescence <= 90) {
        daysObsolescenceCell.font = { color: { argb: 'd97706' }, bold: true };
      }
    }
    daysObsolescenceCell.alignment = { horizontal: 'center' };

    // Mise en forme des jours restants fin de vente
    const daysEndOfSaleCell = row.getCell('days_until_end_of_sale');
    if (item.days_until_end_of_sale !== null) {
      if (item.days_until_end_of_sale < 0) {
        daysEndOfSaleCell.font = { color: { argb: 'dc2626' }, bold: true };
      } else if (item.days_until_end_of_sale <= 90) {
        daysEndOfSaleCell.font = { color: { argb: 'd97706' }, bold: true };
      }
    }
    daysEndOfSaleCell.alignment = { horizontal: 'center' };
  });

  // Application des bordures à toutes les cellules de données
  const lastRow = worksheet.lastRow?.number || 4;
  for (let i = 4; i <= lastRow; i++) {
    const row = worksheet.getRow(i);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'e2e8f0' } },
        left: { style: 'thin', color: { argb: 'e2e8f0' } },
        bottom: { style: 'thin', color: { argb: 'e2e8f0' } },
        right: { style: 'thin', color: { argb: 'e2e8f0' } }
      };
    });
  }

  // --- FIN DES CORRECTIONS ---
  
  // La feuille de statistiques existait déjà, elle est correctement conservée
  const statsSheet = workbook.addWorksheet('Statistiques', {
    properties: { tabColor: { argb: '2563eb' } }
  });

  const totalEquipment = data.length;
  const totalCost = data.reduce((sum, e) => sum + (e.cost || 0), 0);
  const obsoleteCount = data.filter(e => e.status === 'obsolete').length;
  const soonObsoleteCount = data.filter(e => e.status === 'bientot_obsolete').length;
  const activeCount = data.filter(e => e.status === 'actif' || e.status === 'bientot_obsolete').length;
  const maintenanceCount = data.filter(e => e.status === 'en_maintenance').length;

  const typeCount: Record<string, number> = {};
  data.forEach(e => {
    typeCount[e.type] = (typeCount[e.type] || 0) + 1;
  });

  statsSheet.mergeCells('A1:B1');
  statsSheet.getCell('A1').value = 'Résumé Exécutif';
  statsSheet.getCell('A1').font = { size: 16, bold: true };
  statsSheet.getCell('A1').alignment = { horizontal: 'center' };

  const stats = [
    ['Nombre total d\'équipements', totalEquipment],
    ['Coût total (FCFA)', totalCost],
    ['Équipements actifs', activeCount],
    ['Équipements obsolètes', obsoleteCount],
    ['Obsolètes bientôt', soonObsoleteCount],
    ['En maintenance', maintenanceCount]
  ];

  statsSheet.addRow([]);
  stats.forEach((stat) => {
    const row = statsSheet.addRow(stat);
    row.getCell(1).font = { bold: true };
    row.getCell(2).numFmt = '#,##0';
    row.getCell(2).alignment = { horizontal: 'right' };
  });

  statsSheet.addRow([]);
  statsSheet.addRow(['Répartition par type']).font = { bold: true, size: 14 };
  Object.entries(typeCount).forEach(([type, count]) => {
    const row = statsSheet.addRow([type, count]);
    row.getCell(1).font = { italic: true };
    row.getCell(2).alignment = { horizontal: 'right' };
  });

  statsSheet.columns = [
    { width: 30 },
    { width: 20 }
  ];

  if (Object.values(options.filters).some(v => v)) {
    statsSheet.addRow([]);
    statsSheet.addRow(['Filtres appliqués']).font = { bold: true, size: 14 };
    
    const filterLabels: Record<string, string> = {
      clientId: 'Client',
      status: 'Statut',
      type: 'Type',
      dateFrom: 'Date de début (obsolescence)',
      dateTo: 'Date de fin (obsolescence)'
    };

    Object.entries(options.filters).forEach(([key, value]) => {
      if (value) {
        // Ne pas afficher le filtre 'Client' si l'utilisateur est un client
        if (key === 'clientId' && options.isClientUser) return;
        
        // Utiliser clientName au lieu de clientId si disponible
        const displayValue = key === 'clientId' && options.filters.clientName 
          ? options.filters.clientName 
          : value;
        statsSheet.addRow([filterLabels[key], displayValue]);
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `rapport_equipements_${new Date().toISOString().split('T')[0]}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// Fonction de génération PDF (conservée de l'original)
async function generatePDFReport(
  data: EquipmentReportData[], 
  fontBuffer: Buffer,
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
    isClientUser?: boolean;
  }
): Promise<NextResponse> {
  if (!fontBuffer) {
    return NextResponse.json(
      { message: 'Erreur serveur: La police personnalisée n\'a pas pu être chargée.' },
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
    doc.on('error', (err) => reject(err));

    const colors = {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      text: '#374151',
      lightGray: '#f8fafc'
    };

    doc.fontSize(24).fillColor(colors.primary).text(options.title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(colors.secondary)
        .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' })
        .text(`Par: ${options.user}`, { align: 'center' });
    doc.moveDown(1);

    const filtersToShow = Object.entries(options.filters).filter(([key, value]) => {
      // 1. Ne pas afficher le filtre 'Client' si l'utilisateur est un client.
      if (key === 'clientId' && options.isClientUser) return false;
      // 2. N'afficher que les filtres qui ont une valeur (non null/undefined/vide).
      return !!value;
    });

    // Afficher la section "Filtres appliqués" uniquement s'il y a des filtres à montrer
    if (filtersToShow.length > 0) {
      doc.fontSize(14).fillColor(colors.text).text('Filtres appliqués:', { underline: true });
      doc.moveDown(0.3);

      const filterLabels: Record<string, string> = {
        clientId: 'Client',
        status: 'Statut',
        type: 'Type',
        dateFrom: 'Date de début (obsolescence)',
        dateTo: 'Date de fin (obsolescence)'
      };

      filtersToShow.forEach(([key, value]) => {
        doc.fontSize(10).fillColor(colors.secondary).text(`${filterLabels[key]}: ${value}`);
      });
      doc.moveDown(1);
    }

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
    doc.fontSize(14).fillColor(colors.text).text('Détail des Équipements', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const tableHeaders = ['Nom', 'Type', 'Marque', 'Modèle', 'Client', 'Statut', 'Date Obsol.'];
    const columnWidths = [100, 60, 60, 80, 80, 60, 80];
    let currentX = 50;

    doc.fontSize(8).fillColor(colors.text);
    tableHeaders.forEach((header, index) => {
      doc.rect(currentX, tableTop, columnWidths[index], 20).fillAndStroke(colors.lightGray, colors.secondary);
      doc.fillColor(colors.text).text(header, currentX + 5, tableTop + 6, {
        width: columnWidths[index] - 10,
        align: 'left'
      });
      currentX += columnWidths[index];
    });

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
        if (colIndex === 5) {
          textColor = getStatusColor(equipment.status);
        } else if (colIndex === 6) {
          if (equipment.days_until_obsolescence !== null && equipment.days_until_obsolescence < 0) {
            textColor = colors.danger;
          } else if (equipment.days_until_obsolescence !== null && equipment.days_until_obsolescence <= 90) {
            textColor = colors.warning;
          }
        }

        doc.fillColor(textColor).text(cellData, currentX + 3, currentY + 4, {
          width: columnWidths[colIndex] - 6,
          align: 'left',
          ellipsis: true
        });
        currentX += columnWidths[colIndex];
      });

      currentY += rowHeight;
    });

    doc.fontSize(8).fillColor(colors.secondary);
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.text(`Page ${i + 1} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`, 50, 750, { align: 'center' });
    }
    
    doc.end();
  });
}

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'actif': '#059669',
    'obsolete': '#dc2626',
    'bientot_obsolete': '#d97706',
    'en_maintenance': '#2563eb',
    'retire': '#64748b'
  };
  return statusColors[status] || '#374151';
}

function validateRequestParams(searchParams: URLSearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const format = searchParams.get('format');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const validFormats = ['json', 'csv', 'pdf', 'excel'];

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

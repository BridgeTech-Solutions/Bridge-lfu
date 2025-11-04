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

    const equipmentTypeId = searchParams.get('equipment_type_id');
    const format = searchParams.get('format') || 'json';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const status = searchParams.get('status');

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
    if (equipmentTypeId) query = query.eq('type_id', equipmentTypeId);
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
          filters: { clientId, clientName, status, equipmentTypeId, dateFrom, dateTo },
          isClientUser: !checker.canViewAllData()
        });
      case 'excel':
        return await generateExcelReport(reportData, {
          title: 'Rapport des Équipements',
          user: user.first_name || user.email,
          filters: { clientId, clientName, status, equipmentTypeId, dateFrom, dateTo },
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

// Fonction de génération Excel améliorée pour les équipements
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
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
  });

  // Configuration des colonnes avec largeurs optimisées
  worksheet.columns = [
    { key: 'name', width: 28 },
    { key: 'type', width: 12 },
    { key: 'brand', width: 18 },
    { key: 'model', width: 20 },
    { key: 'serial_number', width: 18 },
    { key: 'client_name', width: 25 },
    { key: 'purchase_date', width: 16 },
    { key: 'estimated_obsolescence_date', width: 18 },
    { key: 'end_of_sale', width: 16 },
    { key: 'status', width: 16 },
    { key: 'cost', width: 15 },
    { key: 'days_until_obsolescence', width: 16 },
    { key: 'days_until_end_of_sale', width: 16 }
  ];

  // Titre principal avec style amélioré
  worksheet.mergeCells('A1:M1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '059669' }
  };
  worksheet.getRow(1).height = 35;

  // Sous-titre avec informations de génération
  worksheet.mergeCells('A2:M2');
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par ${options.user}`;
  infoCell.font = { size: 10, italic: true, color: { argb: '64748b' } };
  infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
  infoCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'f1f5f9' }
  };
  worksheet.getRow(2).height = 20;

  worksheet.addRow([]);

  // En-tête du tableau avec style professionnel
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
    'Jours (Obsol.)',
    'Jours (Fin vente)'
  ]);
  
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '047857' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 30;

  // Bordures pour l'en-tête
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium', color: { argb: '065f46' } },
      left: { style: 'thin', color: { argb: '065f46' } },
      bottom: { style: 'medium', color: { argb: '065f46' } },
      right: { style: 'thin', color: { argb: '065f46' } }
    };
  });

  // Ajout des données avec formatage conditionnel
  data.forEach((item, index) => {
    const row = worksheet.addRow({
      name: item.name,
      type: item.type,
      brand: item.brand,
      model: item.model,
      serial_number: item.serial_number,
      client_name: item.client_name,
      purchase_date: item.purchase_date ? new Date(item.purchase_date) : 'N/A',
      estimated_obsolescence_date: item.estimated_obsolescence_date ? new Date(item.estimated_obsolescence_date) : 'N/A',
      end_of_sale: item.end_of_sale ? new Date(item.end_of_sale) : 'N/A',
      status: item.status,
      cost: item.cost,
      days_until_obsolescence: item.days_until_obsolescence ?? 'N/A',
      days_until_end_of_sale: item.days_until_end_of_sale ?? 'N/A'
    });

    // Alternance de couleurs pour les lignes
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f8fafc' }
      };
    }

    // Formatage des dates et nombres
    if (item.purchase_date) {
      row.getCell('purchase_date').numFmt = 'dd/mm/yyyy';
      row.getCell('purchase_date').alignment = { horizontal: 'center', vertical: 'middle' };
    }
    if (item.estimated_obsolescence_date) {
      row.getCell('estimated_obsolescence_date').numFmt = 'dd/mm/yyyy';
      row.getCell('estimated_obsolescence_date').alignment = { horizontal: 'center', vertical: 'middle' };
    }
    if (item.end_of_sale) {
      row.getCell('end_of_sale').numFmt = 'dd/mm/yyyy';
      row.getCell('end_of_sale').alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    row.getCell('cost').numFmt = '#,##0';
    row.getCell('cost').alignment = { horizontal: 'right', vertical: 'middle' };

    // Formatage conditionnel du statut
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
      bold: true,
      size: 10
    };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Formatage conditionnel des jours restants obsolescence
    const daysObsolescenceCell = row.getCell('days_until_obsolescence');
    if (item.days_until_obsolescence !== null) {
      if (item.days_until_obsolescence < 0) {
        daysObsolescenceCell.font = { color: { argb: 'dc2626' }, bold: true };
        daysObsolescenceCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fee2e2' }
        };
      } else if (item.days_until_obsolescence <= 90) {
        daysObsolescenceCell.font = { color: { argb: 'd97706' }, bold: true };
        daysObsolescenceCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fed7aa' }
        };
      }
    }
    daysObsolescenceCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Formatage conditionnel des jours restants fin de vente
    const daysEndOfSaleCell = row.getCell('days_until_end_of_sale');
    if (item.days_until_end_of_sale !== null) {
      if (item.days_until_end_of_sale < 0) {
        daysEndOfSaleCell.font = { color: { argb: 'dc2626' }, bold: true };
        daysEndOfSaleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fee2e2' }
        };
      } else if (item.days_until_end_of_sale <= 90) {
        daysEndOfSaleCell.font = { color: { argb: 'd97706' }, bold: true };
        daysEndOfSaleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fed7aa' }
        };
      }
    }
    daysEndOfSaleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Alignement vertical pour toutes les cellules
    row.eachCell((cell) => {
      if (!cell.alignment) {
        cell.alignment = { vertical: 'middle' };
      }
    });

    row.height = 22;
  });

  // Bordures pour toutes les cellules de données
  const lastRow = worksheet.lastRow?.number || 4;
  for (let i = 4; i <= lastRow; i++) {
    const row = worksheet.getRow(i);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'cbd5e1' } },
        left: { style: 'thin', color: { argb: 'cbd5e1' } },
        bottom: { style: 'thin', color: { argb: 'cbd5e1' } },
        right: { style: 'thin', color: { argb: 'cbd5e1' } }
      };
    });
  }

  // Feuille de statistiques améliorée
  const statsSheet = workbook.addWorksheet('Statistiques', {
    properties: { tabColor: { argb: '2563eb' } }
  });

  // Titre de la feuille statistiques
  statsSheet.mergeCells('A1:C1');
  const statsTitleCell = statsSheet.getCell('A1');
  statsTitleCell.value = 'Résumé Exécutif';
  statsTitleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
  statsTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  statsTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '059669' }
  };
  statsSheet.getRow(1).height = 30;

  statsSheet.addRow([]);

  // Calcul des statistiques
  const totalEquipment = data.length;
  const totalCost = data.reduce((sum, e) => sum + (e.cost || 0), 0);
  const obsoleteCount = data.filter(e => e.status === 'obsolete').length;
  const soonObsoleteCount = data.filter(e => e.status === 'bientot_obsolete').length;
  const activeCount = data.filter(e => e.status === 'actif').length;
  const maintenanceCount = data.filter(e => e.status === 'en_maintenance').length;

  const stats = [
    { label: 'Nombre total d\'équipements', value: totalEquipment, icon: '📊' },
    { label: 'Coût total (FCFA)', value: totalCost, icon: '💰' },
    { label: 'Équipements actifs', value: activeCount, icon: '✅' },
    { label: 'Équipements obsolètes', value: obsoleteCount, icon: '❌' },
    { label: 'Obsolètes bientôt', value: soonObsoleteCount, icon: '⚠️' },
    { label: 'En maintenance', value: maintenanceCount, icon: '🔧' }
  ];

  stats.forEach((stat, index) => {
    const row = statsSheet.addRow([stat.icon, stat.label, stat.value]);
    row.getCell(1).font = { size: 16 };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).font = { bold: true, size: 11 };
    row.getCell(2).alignment = { vertical: 'middle' };
    row.getCell(3).font = { bold: true, size: 12, color: { argb: '059669' } };
    row.getCell(3).numFmt = '#,##0';
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    row.height = 25;

    // Couleur alternée
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f8fafc' }
      };
    }

    // Bordures
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'cbd5e1' } },
        left: { style: 'thin', color: { argb: 'cbd5e1' } },
        bottom: { style: 'thin', color: { argb: 'cbd5e1' } },
        right: { style: 'thin', color: { argb: 'cbd5e1' } }
      };
    });
  });

  // Répartition par type
  statsSheet.addRow([]);
  statsSheet.addRow([]);
  
  const typesTitleRow = statsSheet.addRow(['📈', 'Répartition par type', '']);
  statsSheet.mergeCells(typesTitleRow.number, 2, typesTitleRow.number, 3);
  typesTitleRow.getCell(2).font = { bold: true, size: 14, color: { argb: '2563eb' } };
  typesTitleRow.getCell(2).alignment = { vertical: 'middle' };
  typesTitleRow.height = 25;

  const typeCount: Record<string, number> = {};
  data.forEach(e => {
    typeCount[e.type] = (typeCount[e.type] || 0) + 1;
  });

  Object.entries(typeCount).forEach(([type, count], index) => {
    const row = statsSheet.addRow(['', type, count]);
    row.getCell(2).font = { italic: true };
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    row.height = 20;

    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f8fafc' }
      };
    }
  });

  statsSheet.columns = [
    { width: 8 },
    { width: 35 },
    { width: 20 }
  ];

  // Filtres appliqués
  const filtersToShow = Object.entries(options.filters).filter(([key, value]) => {
    if (!value) return false;
    if (key === 'clientId' && options.isClientUser) return false;
    return true;
  });

  if (filtersToShow.length > 0) {
    statsSheet.addRow([]);
    statsSheet.addRow([]);
    
    const filterTitleRow = statsSheet.addRow(['🔍', 'Filtres appliqués', '']);
    statsSheet.mergeCells(filterTitleRow.number, 2, filterTitleRow.number, 3);
    filterTitleRow.getCell(2).font = { bold: true, size: 14, color: { argb: '2563eb' } };
    filterTitleRow.getCell(2).alignment = { vertical: 'middle' };
    filterTitleRow.height = 25;
   
    const filterLabels: Record<string, string> = {
      clientId: 'Client',
      status: 'Statut',
      equipmentTypeId: 'Type',
      dateFrom: 'Date de début',
      dateTo: 'Date de fin'
    };

    filtersToShow.forEach(([key, value], index) => {
      const displayValue = key === 'clientId' && options.filters.clientName 
        ? options.filters.clientName 
        : value;
      
      const row = statsSheet.addRow(['', filterLabels[key], displayValue]);
      row.getCell(2).font = { bold: true };
      row.getCell(3).font = { color: { argb: '64748b' } };
      row.height = 20;

      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'f8fafc' }
        };
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

// Fonction de génération PDF améliorée pour les équipements
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
      margin: 40,
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
      primary: '#059669', // Vert (couleur dominante de l'Excel)
      secondary: '#64748b',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      text: '#1e293b',
      lightGray: '#f1f5f9',
      border: '#cbd5e1'
    };

    // Calcul des dimensions de la page
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;
    const availableWidth = pageWidth - margins.left - margins.right;

    // En-tête du rapport
    doc.fontSize(22).fillColor(colors.primary).text(options.title, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(colors.secondary)
      .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' })
      .text(`Par: ${options.user}`, { align: 'center' });
    doc.moveDown(0.8);

    // Filtres appliqués
    const filtersToShow = Object.entries(options.filters).filter(([key, value]) => {
      if (key === 'clientId' && options.isClientUser) return false;
      if (key === 'clientName') return false; 
      return !!value;
    });

    if (filtersToShow.length > 0) {
      doc.fontSize(11).fillColor(colors.text).text('Filtres appliqués:', { underline: true });
      doc.moveDown(0.2);

      const filterLabels: Record<string, string> = {
        clientId: 'Client',
        status: 'Statut',
        equipmentTypeId: 'Type',
        dateFrom: 'Date de début (Obsol.)',
        dateTo: 'Date de fin (Obsol.)'
      };

      filtersToShow.forEach(([key, value]) => {
        const displayValue = key === 'clientId' && options.filters.clientName 
          ? options.filters.clientName 
          : value;
        doc.fontSize(9).fillColor(colors.secondary).text(`${filterLabels[key]}: ${displayValue}`);
      });
      doc.moveDown(0.8);
    }

    // Résumé exécutif
    const totalEquipment = data.length;
    const totalCost = data.reduce((sum, e) => sum + (e.cost || 0), 0);
    const obsoleteEquipment = data.filter(e => e.status === 'obsolete').length;
    const soonToBeObsolete = data.filter(e => e.status === 'bientot_obsolete').length;

    doc.fontSize(12).fillColor(colors.text).text('Résumé Exécutif', { underline: true });
    doc.moveDown(0.3);

    const summaryY = doc.y;
    const boxWidth = (availableWidth - 45) / 4;
    const boxHeight = 45;
    const boxSpacing = 15;

      // Fonction d'aide pour le formatage de la monnaie
  function formatCurrency(amount: number, includeCurrency: boolean = true): string {
    const formattedNumber = new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount).replace(/[\u00A0\u202F]/g, ' ');

    if (includeCurrency) {
      return formattedNumber + ' FCFA';
    }
    return formattedNumber;
  }

    
    const summaryBoxes = [
      { label: 'Total équip.', value: totalEquipment.toString(), color: colors.primary },
      { label: 'Coût Total', value: formatCurrency(totalCost, true), color: colors.success },
      { label: 'Obsolètes', value: obsoleteEquipment.toString(), color: colors.danger },
      { label: 'Bientôt obsol.', value: soonToBeObsolete.toString(), color: colors.warning }
    ];

    summaryBoxes.forEach((box, index) => {
      const boxX = margins.left + (index * (boxWidth + boxSpacing));
      
      doc.rect(boxX, summaryY, boxWidth, boxHeight)
        .fillAndStroke(colors.lightGray, colors.border);
      
       doc.fontSize(8).fillColor(colors.secondary)
        .text(box.label, boxX + 10, summaryY + 10, { width: boxWidth - 20 });
      
      // CORRECTION 2: Empêche le retour à la ligne du Coût Total ('FCFA' parasite)
      doc.fontSize(10).fillColor(box.color)
        .text(box.value, boxX + 10, summaryY + 25, { 
            width: boxWidth - 20, 
            align: 'left',
            lineBreak: false // Ajout pour maintenir le texte sur une ligne
        });
    });

    doc.y = summaryY + boxHeight + 20;

     // Tableau des équipements
    doc.fontSize(12).fillColor(colors.text).text('Détail des Équipements', { underline: true });
    doc.moveDown(0.5); 

    const tableTop = doc.y;
    const tableHeaders = ['Nom', 'Type', 'Marque', 'Modèle', 'Client', 'Statut', 'Obsol.', 'Jours'];
    
    // CORRECTION 1: Définition des largeurs ajustées (Jours = 7%)
    const baseWidths = [
        0.16, // Nom (réduit de 20% à 16%)
        0.10, // Type
        0.12, // Marque
        0.15, // Modèle
        0.18, // Client
        0.12, // Statut
        0.10  // Date Obsol.
    ]; 
    
    const columnWidths = baseWidths.map(w => availableWidth * w);
    
    // Assurer que la dernière colonne prend la largeur restante (7%)
    const usedWidth = columnWidths.reduce((sum, w) => sum + w, 0);
    columnWidths.push(availableWidth - usedWidth); 

    let currentX = margins.left;

    // En-tête du tableau
    doc.fontSize(9).fillColor('#ffffff');
    tableHeaders.forEach((header, index) => {
      doc.rect(currentX, tableTop, columnWidths[index], 25)
        .fillAndStroke(colors.primary, colors.primary);
      
      doc.fillColor('#ffffff')
        .text(header, currentX + 3, tableTop + 8, {
          width: columnWidths[index] - 6,
          align: 'center',
          lineBreak: false,
          ellipsis: true
        });
      currentX += columnWidths[index];
    });

    let currentY = tableTop + 25;
    doc.fontSize(8);
    const rowHeight = 22;

    data.forEach((equipment, index) => {
      
      // Gestion du saut de page
      if (currentY + rowHeight > 720) { 
        doc.addPage();
        currentY = 40;
        
        // Répéter l'en-tête
        currentX = margins.left;
        doc.fontSize(9).fillColor('#ffffff');
        tableHeaders.forEach((header, idx) => {
          doc.rect(currentX, currentY, columnWidths[idx], 25)
            .fillAndStroke(colors.primary, colors.primary);
          
          doc.fillColor('#ffffff')
            .text(header, currentX + 3, currentY + 8, {
              width: columnWidths[idx] - 6,
              align: 'center',
              lineBreak: false,
              ellipsis: true
            });
          currentX += columnWidths[idx];
        });
        currentY += 25;
        doc.fontSize(8);
      }

      currentX = margins.left;

      // Alternance de couleurs
      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(margins.left, currentY, availableWidth, rowHeight)
        .fillAndStroke(bgColor, colors.border);

      const rowData = [
        equipment.name,
        equipment.type,
        equipment.brand,
        equipment.model,
        equipment.client_name,
        equipment.status,
        equipment.estimated_obsolescence_date ? new Date(equipment.estimated_obsolescence_date).toLocaleDateString('fr-FR') : 'N/A',
        equipment.days_until_obsolescence !== null ? equipment.days_until_obsolescence.toString() : 'N/A'
      ];

      rowData.forEach((cellData, colIndex) => {
        let textColor = colors.text;
        let textAlign: 'left' | 'center' | 'right' = 'left';

        if (colIndex === 5) { // Statut
          textColor = getStatusColor(equipment.status);
          textAlign = 'center';
        } else if (colIndex === 7) { // Jours
          if (equipment.days_until_obsolescence !== null) {
            if (equipment.days_until_obsolescence < 0) {
              textColor = colors.danger;
            } else if (equipment.days_until_obsolescence <= 90) {
              textColor = colors.warning;
            }
          }
          textAlign = 'center';
        } else if (colIndex === 6) { // Date obsol.
          textAlign = 'center';
        } else if (colIndex === 1) { // Type
          textAlign = 'center';
        }

        doc.fillColor(textColor).text(cellData, currentX + 2, currentY + 6, {
          width: columnWidths[colIndex] - 4,
          align: textAlign,
          ellipsis: true,
          lineBreak: false
        });
        currentX += columnWidths[colIndex];
      });

      currentY += rowHeight;
    });
    
    // Empêcher le débordement du pied de page sur une page vide
    const footerSafeZone = doc.page.height - 50; 
    if (currentY > footerSafeZone) {
      doc.addPage();
    }
    
    // Pied de page
    doc.fontSize(8).fillColor(colors.secondary);
    
    // Ricalculer le nombre de pages après l'ajout potentiel
    const finalPageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < finalPageCount; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 30;
      doc.text(
        `Page ${i + 1} sur ${finalPageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`, 
        margins.left, 
        footerY, 
        { align: 'center', width: availableWidth }
      );
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
  return statusColors[status] || '#1e293b';
}

function validateRequestParams(searchParams: URLSearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const format = searchParams.get('format');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const status = searchParams.get('status');
  const validFormats = ['json', 'csv', 'pdf', 'excel'];

  if (format && !validFormats.includes(format)) {
    errors.push(`Format non supporté. Formats acceptés: ${validFormats.join(', ')}`);
  }

  const validStatuses = ['actif', 'obsolete', 'bientot_obsolete', 'en_maintenance', 'retire'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Statut invalide. Statuts acceptés: ${validStatuses.join(', ')}`);
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

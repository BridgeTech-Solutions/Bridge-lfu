import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

import { LicenseWithClientView, LicenseStatus } from '@/types'; 

interface LicenseReportData {
  name: string;
  supplier: string;
  editor: string;
  client_name: string;
  expiry_date: string;
  status: LicenseStatus;
  cost: number;
  days_until_expiry: number;
  version: string | null;
  license_type: string | null;
  created_at: string;
}

const fontPath = path.join(process.cwd(), 'src', 'lib', 'fonts', 'Roboto-Regular.ttf');
let fontBuffer: Buffer;
try {
  fontBuffer = fs.readFileSync(fontPath);
} catch (err) {
  console.error("Erreur de chargement de la police: Le fichier 'Roboto-Regular.ttf' n'a pas été trouvé.", err);
}

// GET /api/reports/licenses
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

    const licenseTypeId = searchParams.get('license_type_id');
    const format = searchParams.get('format') || 'json';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const status = searchParams.get('status');

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

    if (licenseTypeId) query = query.eq('type_id', licenseTypeId);

    if (dateFrom) query = query.gte('expiry_date', dateFrom);
    if (dateTo) query = query.lte('expiry_date', dateTo);

    const { data: licenses, error } = await query.order('expiry_date', { 
      ascending: true, 
      nullsFirst: false 
    });

    if (error) {
      console.error('Erreur lors de la génération du rapport licences:', error);
      return NextResponse.json({ message: 'Erreur lors de la génération du rapport' }, { status: 500 });
    }

    const typedLicenses = (licenses || []) as LicenseWithClientView[];

    const reportData: LicenseReportData[] = typedLicenses?.map(license => {
      const supplierName = license.supplier_name || license.editor || '';
      const daysUntilExpiry = license.expiry_date
        ? Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      const costAsNumber = parseFloat(String(license.cost).replace(/\s/g, '').replace(/[^0-9.]/g, ''));

      return {
        name: license.name || '',
        supplier: supplierName,
        editor: supplierName,
        client_name: license.client_name || '',
        expiry_date: license.expiry_date || '',
        status: license.status || 'active',
        cost: costAsNumber || 0,
        version: license.version || '',
        license_type: license.type_name || 'N/A',
        created_at: license.created_at || '',
        days_until_expiry: daysUntilExpiry
      };
    }) || [];

    switch (format) {
      case 'csv':
        return generateCSVReport(reportData);
      case 'pdf':
        return await generatePDFReport(reportData, fontBuffer, {
          title: 'Rapport des Licences',
          user: user.first_name || user.email,
          filters: { clientId, status, dateFrom, dateTo },
          isClientUser: !checker.canViewAllData()
        });
      case 'excel':
        return await generateExcelReport(reportData, {
          title: 'Rapport des Licences',
          user: user.first_name || user.email,
          filters: { clientId, status, dateFrom, dateTo },
          isClientUser: !checker.canViewAllData()
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
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// Fonction de génération CSV
function generateCSVReport(data: LicenseReportData[]): NextResponse {
  const BOM = '\uFEFF'; 
  const DELIMITER = ';';

  const csvHeaders = [
    'Nom de la licence',
    'Type de licence',
    'Fournisseur',
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
    item.license_type || 'N/A',
    item.supplier,
    item.client_name,
    item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('fr-FR') : '',
    item.status,
    item.cost?.toString().replace('.', ',') || '0',
    item.days_until_expiry?.toString() || '0',
    item.version || '',
    item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(DELIMITER))
    .join('\n');

  const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(BOM + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// Fonction Excel améliorée avec style professionnel
async function generateExcelReport(
  data: LicenseReportData[],
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
 
  const worksheet = workbook.addWorksheet('Rapport des Licences', {
    properties: { tabColor: { argb: '2563eb' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }]
  });

  // Configuration des colonnes avec largeurs optimisées
  worksheet.columns = [
    { key: 'name', width: 28 },
    { key: 'license_type', width: 18 },
    { key: 'supplier', width: 25 },
    { key: 'client_name', width: 25 },
    { key: 'version', width: 12 },
    { key: 'expiry_date', width: 16 },
    { key: 'status', width: 16 },
    { key: 'cost', width: 18 },
    { key: 'days_until_expiry', width: 14 }
  ];

  // Titre principal avec style amélioré
  worksheet.mergeCells('A1:I1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 20, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2563eb' }
  };
  worksheet.getRow(1).height = 35;

  // Sous-titre avec informations de génération
  worksheet.mergeCells('A2:I2');
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
    'Nom de la licence',
    'Type',
    'Fournisseur',
    'Client',
    'Version',
    'Date d\'expiration',
    'Statut',
    'Coût (FCFA)',
    'Jours restants'
  ]);
  
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1e40af' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 30;

  // Bordures pour l'en-tête
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium', color: { argb: '1e3a8a' } },
      left: { style: 'thin', color: { argb: '1e3a8a' } },
      bottom: { style: 'medium', color: { argb: '1e3a8a' } },
      right: { style: 'thin', color: { argb: '1e3a8a' } }
    };
  });

  // Ajout des données avec formatage conditionnel
  data.forEach((item, index) => {
    const row = worksheet.addRow({
      name: item.name,
      license_type: item.license_type || 'N/A',
      supplier: item.supplier,
      client_name: item.client_name,
      version: item.version || 'N/A',
      expiry_date: item.expiry_date ? new Date(item.expiry_date) : 'N/A',
      status: item.status,
      cost: item.cost,
      days_until_expiry: item.days_until_expiry
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
    if (item.expiry_date) {
      row.getCell('expiry_date').numFmt = 'dd/mm/yyyy';
      row.getCell('expiry_date').alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    row.getCell('cost').numFmt = '#,##0';
    row.getCell('cost').alignment = { horizontal: 'right', vertical: 'middle' };

    // Formatage conditionnel du statut
    const statusCell = row.getCell('status');
    const statusColors: Record<string, string> = {
      'active': '059669',
      'expired': 'dc2626',
      'about_to_expire': 'd97706',
      'cancelled': '64748b'
    };
    const statusBgColors: Record<string, string> = {
      'active': 'd1fae5',
      'expired': 'fee2e2',
      'about_to_expire': 'fed7aa',
      'cancelled': 'f1f5f9'
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

    // Formatage conditionnel des jours restants
    const daysCell = row.getCell('days_until_expiry');
    if (item.days_until_expiry < 0) {
      daysCell.font = { color: { argb: 'dc2626' }, bold: true };
      daysCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'fee2e2' }
      };
    } else if (item.days_until_expiry <= 30) {
      daysCell.font = { color: { argb: 'd97706' }, bold: true };
      daysCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'fed7aa' }
      };
    }
    daysCell.alignment = { horizontal: 'center', vertical: 'middle' };

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
    properties: { tabColor: { argb: '059669' } }
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
  const totalLicenses = data.length;
  const totalCost = data.reduce((sum, l) => sum + (l.cost || 0), 0);
  const expiredCount = data.filter(l => l.days_until_expiry < 0).length;
  const expiringCount = data.filter(l => l.days_until_expiry >= 0 && l.days_until_expiry <= 30).length;
  const activeCount = data.filter(l => l.status === 'active' || l.status === 'about_to_expire').length;

  const stats = [
    { label: 'Nombre total de licences', value: totalLicenses, icon: '📊' },
    { label: 'Coût total (FCFA)', value: totalCost, icon: '💰' },
    { label: 'Licences actives', value: activeCount, icon: '✅' },
    { label: 'Licences expirées', value: expiredCount, icon: '❌' },
    { label: 'Expirant dans 30 jours', value: expiringCount, icon: '⚠️' }
  ];

  stats.forEach((stat, index) => {
    const row = statsSheet.addRow([stat.icon, stat.label, stat.value]);
    row.getCell(1).font = { size: 16 };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).font = { bold: true, size: 11 };
    row.getCell(2).alignment = { vertical: 'middle' };
    row.getCell(3).font = { bold: true, size: 12, color: { argb: '2563eb' } };
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
      dateFrom: 'Date de début',
      dateTo: 'Date de fin'
    };

    filtersToShow.forEach(([key, value], index) => {
      const row = statsSheet.addRow(['', filterLabels[key], value]);
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
  const filename = `rapport_licences_${new Date().toISOString().split('T')[0]}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

// FONCTION DE GÉNÉRATION PDF MODIFIÉE (CORRECTION LARGEUR VERSION ET HAUTEUR DE LIGNE DYNAMIQUE)
async function generatePDFReport(
  data: LicenseReportData[], 
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
    doc.on('error', (err) => reject(err));

    const colors = {
      primary: '#2563eb',
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

    // Filtres appliqués (Logique inchangée)
    const filtersToShow = Object.entries(options.filters).filter(([key, value]) => {
      if (key === 'clientId' && options.isClientUser) return false;
      return !!value;
    });

    if (filtersToShow.length > 0) { 
      doc.fontSize(11).fillColor(colors.text).text('Filtres appliqués:', { underline: true });
      doc.moveDown(0.2);

      const filterLabels: Record<string, string> = {
        clientId: 'Client',
        status: 'Statut',
        dateFrom: 'Date de début',
        dateTo: 'Date de fin'
      };

      filtersToShow.forEach(([key, value]) => {
        doc.fontSize(9).fillColor(colors.secondary).text(`${filterLabels[key]}: ${value}`);
      });
      doc.moveDown(0.8);
    }

    // Résumé exécutif (Logique inchangée)
    const totalLicenses = data.length;
    const totalCost = data.reduce((sum, license) => sum + (license.cost || 0), 0);
    const expiredLicenses = data.filter(l => l.days_until_expiry < 0).length;
    const soonToExpire = data.filter(l => l.days_until_expiry >= 0 && l.days_until_expiry <= 30).length;

    doc.fontSize(12).fillColor(colors.text).text('Résumé Exécutif', { underline: true });
    doc.moveDown(0.3);

    const summaryY = doc.y;
    const boxWidth = (availableWidth - 45) / 4; 
    const boxHeight = 45;
    const boxSpacing = 15;

    const summaryBoxes = [
      { label: 'Total licences', value: totalLicenses.toString(), color: colors.primary },
      { label: 'Coût total', value: formatCurrency(totalCost, true), color: colors.success },
      { label: 'Expirées', value: expiredLicenses.toString(), color: colors.danger },
      { label: 'Expirent < 30j', value: soonToExpire.toString(), color: colors.warning }
    ];

    summaryBoxes.forEach((box, index) => {
      const boxX = margins.left + (index * (boxWidth + boxSpacing));
      
      doc.rect(boxX, summaryY, boxWidth, boxHeight)
        .fillAndStroke(colors.lightGray, colors.border);
      
      doc.fontSize(9).fillColor(colors.secondary)
        .text(box.label, boxX + 10, summaryY + 10, { width: boxWidth - 20 });
      
      doc.fontSize(10).fillColor(box.color) 
        .text(box.value, boxX + 10, summaryY + 25, { width: boxWidth - 20, align: 'left' });
    });

    doc.y = summaryY + boxHeight + 20;

    // Tableau des licences
    doc.fontSize(12).fillColor(colors.text).text('Détail des Licences', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    
    // En-têtes du tableau
    const tableHeaders = ['Licence', 'Type', 'Fournisseur', 'Client', 'Version', 'Expiration', 'Statut', 'Coût (FCFA)', 'Jours'];
    
    // Largeurs des colonnes mises à jour (Version 8%, Client/Fournisseur 12%)
    const columnWidths = [
      availableWidth * 0.17,  // Licence
      availableWidth * 0.08,  // Type
      availableWidth * 0.12,  // Fournisseur
      availableWidth * 0.12,  // Client
      availableWidth * 0.08,  // Version 
      availableWidth * 0.11,  // Expiration
      availableWidth * 0.10,  // Statut
      availableWidth * 0.12,  // Coût (FCFA)
      availableWidth * 0.10   // Jours
    ];// Total = 1.00

    let currentX = margins.left;

    // En-tête du tableau 
    doc.fontSize(9).fillColor('#ffffff');
    tableHeaders.forEach((header, index) => {
      doc.rect(currentX, tableTop, columnWidths[index], 22)
        .fillAndStroke(colors.primary, colors.primary);
      
      doc.fillColor('#ffffff')
        .text(header, currentX + 5, tableTop + 7, {
          width: columnWidths[index] - 10,
          align: 'center'
        });
      currentX += columnWidths[index];
    });

    let currentY = tableTop + 22;
    doc.fontSize(8);

    data.forEach((license, index) => {
      
      // Données de la ligne
      const rowData = [
        license.name,
        license.license_type || 'N/A',
        license.supplier,
        license.client_name,
        license.version || 'N/A',
        license.expiry_date ? new Date(license.expiry_date).toLocaleDateString('fr-FR') : 'N/A',
        license.status,
        formatCurrency(license.cost || 0, false),
        license.days_until_expiry.toString()
      ];

      // CALCUL DE LA HAUTEUR MAXIMALE DE LA LIGNE
      let maxRowHeight = 0;
      
      rowData.forEach((cellData, colIndex) => {
        // Seules les colonnes Coût (7) et Jours (8) sont forcées à une seule ligne
        const allowLineBreak = (colIndex !== 7 && colIndex !== 8); 
        
        const height = doc.heightOfString(cellData, { 
          width: columnWidths[colIndex] - 8, 
          lineBreak: allowLineBreak 
        });
        
        maxRowHeight = Math.max(maxRowHeight, height);
      });
      
      // Définir la hauteur finale (min 20 + padding)
      const minRowHeight = 20;
      const finalRowHeight = Math.max(maxRowHeight + 5, minRowHeight); 

      // Gestion du saut de page 
      if (currentY + finalRowHeight > 720) {
        doc.addPage();
        currentY = 40;
        
        // Répéter l'en-tête
        currentX = margins.left;
        doc.fontSize(9).fillColor('#ffffff');
        tableHeaders.forEach((header, idx) => {
          doc.rect(currentX, currentY, columnWidths[idx], 22)
            .fillAndStroke(colors.primary, colors.primary);
          
          doc.fillColor('#ffffff')
            .text(header, currentX + 5, currentY + 7, {
              width: columnWidths[idx] - 10,
              align: 'center'
            });
          currentX += columnWidths[idx];
        });
        currentY += 22;
        doc.fontSize(8);
      }

      currentX = margins.left;
      
      // Dessiner le rectangle de fond (utilise la hauteur dynamique)
      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      const totalRowWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      doc.rect(margins.left, currentY, totalRowWidth, finalRowHeight)
        .fillAndStroke(bgColor, colors.border);

      // Rendu des données
      rowData.forEach((cellData, colIndex) => {
        let textColor = colors.text;
        let textAlign: 'left' | 'center' | 'right' = 'left';

        // Logique de style
        if (colIndex === 6) { // Statut
          textColor = getStatusColor(license.status);
          textAlign = 'center';
        } else if (colIndex === 8) { // Jours restants
          if (license.days_until_expiry < 0) {
            textColor = colors.danger;
          } else if (license.days_until_expiry <= 30) {
            textColor = colors.warning;
          }
          textAlign = 'center';
        } else if (colIndex === 7) { // Coût
          textAlign = 'right';
        } else if (colIndex === 5) { // Date expiration
          textAlign = 'center';
        }

        // Configuration des options de texte
        const allowLineBreak = (colIndex !== 7 && colIndex !== 8); 

        const cellOptions: PDFKit.Mixins.TextOptions = {
          width: columnWidths[colIndex] - 8,
          align: textAlign, 
          ellipsis: !allowLineBreak, // Couper si pas de saut de ligne (Coût, Jours)
          lineBreak: allowLineBreak // Permet le saut de ligne pour les longs textes
        };

        // Centrage vertical dans la hauteur dynamique de la ligne
        const textHeight = doc.heightOfString(cellData, { 
          width: columnWidths[colIndex] - 8, 
          lineBreak: allowLineBreak 
        });
        
        const topMargin = (finalRowHeight - textHeight) / 2;
        
        doc.fillColor(textColor).text(cellData, currentX + 4, currentY + topMargin, cellOptions);
        
        currentX += columnWidths[colIndex];
      });

      // Avancer Y avec la hauteur dynamique
      currentY += finalRowHeight;
    });

    // Pied de page (Logique inchangée)
    doc.fontSize(8).fillColor(colors.secondary);
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 30;
      doc.text(
        `Page ${i + 1} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`, 
        margins.left, 
        footerY, 
        { align: 'center', width: availableWidth }
      );
    }
    
    doc.end();
  });
}

// Fonction utilitaire MODIFIÉE pour formater la devise (avec paramètre optionnel pour inclure le FCFA)
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

function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'active': '#059669',
    'expired': '#dc2626',
    'about_to_expire': '#d97706',
    'cancelled': '#64748b'
  };
  return statusColors[status] || '#1e293b';
}

function validateRequestParams(searchParams: URLSearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const format = searchParams.get('format');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const status = searchParams.get('status');

  if (format && !['json', 'csv', 'pdf', 'excel'].includes(format)) {
    errors.push('Format non supporté. Formats acceptés: json, csv, pdf, excel');
  }

  const validStatuses = ['active', 'expired', 'about_to_expire', 'cancelled'];
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

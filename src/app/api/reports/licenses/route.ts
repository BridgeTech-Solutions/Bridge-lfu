// app/api/reports/licenses/route.ts
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
  editor: string;
  client_name: string;
  expiry_date: string;
  status: LicenseStatus;
  cost: number;
  days_until_expiry: number;
  version: string | null;
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
      const daysUntilExpiry = license.expiry_date
        ? Math.ceil((new Date(license.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      const costAsNumber = parseFloat(String(license.cost).replace(/\s/g, '').replace(/[^0-9.]/g, ''));

      return {
        name: license.name || '',
        editor: license.editor || '',
        client_name: license.client_name || '',
        expiry_date: license.expiry_date || '',
        status: license.status || 'active',
        cost: costAsNumber || 0,
        version: license.version || '',
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
          filters: { clientId, status, dateFrom, dateTo }
        });
      case 'excel':
        return await generateExcelReport(reportData, {
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
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// Fonction de génération CSV
function generateCSVReport(data: LicenseReportData[]): NextResponse {
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

// Fonction de génération Excel
async function generateExcelReport(
  data: LicenseReportData[],
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
  }
): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'Système de Gestion IT';
  workbook.lastModifiedBy = options.user;
  workbook.created = new Date();
  workbook.modified = new Date();
  
  const worksheet = workbook.addWorksheet('Rapport des Licences', {
    properties: { tabColor: { argb: '2563eb' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }]
  });

  worksheet.columns = [
    { header: 'Nom de la licence', key: 'name', width: 30 },
    { header: 'Éditeur', key: 'editor', width: 20 },
    { header: 'Client', key: 'client_name', width: 25 },
    { header: 'Version', key: 'version', width: 15 },
    { header: 'Date d\'expiration', key: 'expiry_date', width: 18 },
    { header: 'Statut', key: 'status', width: 18 },
    { header: 'Coût (FCFA)', key: 'cost', width: 15 },
    { header: 'Jours restants', key: 'days_until_expiry', width: 15 },
    { header: 'Date de création', key: 'created_at', width: 18 }
  ];

  worksheet.mergeCells('A1:I1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = options.title;
  titleCell.font = { size: 18, bold: true, color: { argb: '2563eb' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'f8fafc' }
  };

  worksheet.mergeCells('A2:I2');
  const infoCell = worksheet.getCell('A2');
  infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par ${options.user}`;
  infoCell.font = { size: 10, italic: true, color: { argb: '64748b' } };
  infoCell.alignment = { horizontal: 'center' };

  worksheet.addRow([]);

  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2563eb' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  data.forEach((item, index) => {
    const row = worksheet.addRow({
      name: item.name,
      editor: item.editor,
      client_name: item.client_name,
      version: item.version || 'N/A',
      expiry_date: item.expiry_date ? new Date(item.expiry_date) : 'N/A',
      status: item.status,
      cost: item.cost,
      days_until_expiry: item.days_until_expiry,
      created_at: item.created_at ? new Date(item.created_at) : 'N/A'
    });

    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f8fafc' }
      };
    }

    if (item.expiry_date) row.getCell('expiry_date').numFmt = 'dd/mm/yyyy';
    if (item.created_at) row.getCell('created_at').numFmt = 'dd/mm/yyyy';
    row.getCell('cost').numFmt = '#,##0';

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
      bold: true
    };
    statusCell.alignment = { horizontal: 'center' };

    const daysCell = row.getCell('days_until_expiry');
    if (item.days_until_expiry < 0) {
      daysCell.font = { color: { argb: 'dc2626' }, bold: true };
    } else if (item.days_until_expiry <= 30) {
      daysCell.font = { color: { argb: 'd97706' }, bold: true };
    }
    daysCell.alignment = { horizontal: 'center' };
  });

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

  const statsSheet = workbook.addWorksheet('Statistiques', {
    properties: { tabColor: { argb: '059669' } }
  });

  const totalLicenses = data.length;
  const totalCost = data.reduce((sum, l) => sum + (l.cost || 0), 0);
  const expiredCount = data.filter(l => l.days_until_expiry < 0).length;
  const expiringCount = data.filter(l => l.days_until_expiry >= 0 && l.days_until_expiry <= 30).length;
  const activeCount = data.filter(l => l.status === 'active').length;

  statsSheet.mergeCells('A1:B1');
  statsSheet.getCell('A1').value = 'Résumé Exécutif';
  statsSheet.getCell('A1').font = { size: 16, bold: true };
  statsSheet.getCell('A1').alignment = { horizontal: 'center' };

  const stats = [
    ['Nombre total de licences', totalLicenses],
    ['Coût total (FCFA)', totalCost],
    ['Licences actives', activeCount],
    ['Licences expirées', expiredCount],
    ['Expirant dans 30 jours', expiringCount]
  ];

  statsSheet.addRow([]);
  stats.forEach((stat) => {
    const row = statsSheet.addRow(stat);
    row.getCell(1).font = { bold: true };
    row.getCell(2).numFmt = '#,##0';
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
      dateFrom: 'Date de début',
      dateTo: 'Date de fin'
    };

    Object.entries(options.filters).forEach(([key, value]) => {
      if (value) {
        statsSheet.addRow([filterLabels[key], value]);
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

// Fonction de génération PDF (conservée de l'original)
async function generatePDFReport(
  data: LicenseReportData[], 
  fontBuffer: Buffer,
  options: {
    title: string;
    user: string;
    filters: Record<string, string | null>;
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
      text: '#374151',
      lightGray: '#f8fafc'
    };

    doc.fontSize(24).fillColor(colors.primary).text(options.title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(colors.secondary)
        .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' })
        .text(`Par: ${options.user}`, { align: 'center' });
    doc.moveDown(1);

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
          doc.fontSize(10).fillColor(colors.secondary).text(`${filterLabels[key]}: ${value}`);
        }
      });
      doc.moveDown(1);
    }

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
    doc.fontSize(14).fillColor(colors.text).text('Détail des Licences', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const tableHeaders = ['Licence', 'Éditeur', 'Client', 'Expiration', 'Statut', 'Coût'];
    const columnWidths = [120, 80, 100, 80, 60, 80];
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount).replace(/[\u00A0\u202F]/g, ' ') + ' FCFA';
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

  if (format && !['json', 'csv', 'pdf', 'excel'].includes(format)) {
    errors.push('Format non supporté. Formats acceptés: json, csv, pdf, excel');
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
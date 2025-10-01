// app/api/licenses/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search');
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const editor = searchParams.get('editor');
    const format = searchParams.get('format') || 'xlsx';

    let query = supabase
      .from('v_licenses_with_client')
      .select('*');

    // Filtrage basé sur le rôle
    if (user.role === 'client' && user.client_id) {
      query = query.eq('client_id', user.client_id);
    }

    // Appliquer les filtres
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (clientId && clientId !== 'all') query = query.eq('client_id', clientId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (editor) query = query.ilike('editor', `%${editor}%`);

    const { data: licenses, error } = await query.order('expiry_date', { ascending: true });

    if (error) {
      console.error('Erreur lors de l\'exportation:', error);
      return NextResponse.json(
        { message: 'Erreur lors de l\'exportation' },
        { status: 500 }
      );
    }

    // Export JSON
    if (format === 'json') {
      return NextResponse.json(licenses, {
        headers: {
          'Content-Disposition': `attachment; filename="licences_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Export CSV
    if (format === 'csv') {
      const csvHeaders = [
        'Nom',
        'Éditeur',
        'Version',
        'Statut',
        'Client',
        'Date d\'achat',
        'Date d\'expiration',
        'Coût (XAF)',
        'Clé de licence'
      ].join(',');

      const csvRows = licenses.map(item => [
        `"${item.name || ''}"`,
        `"${item.editor || ''}"`,
        `"${item.version || ''}"`,
        `"${item.status || ''}"`,
        `"${item.client_name || ''}"`,
        item.purchase_date || '',
        item.expiry_date || '',
        item.cost || 0,
        `"${item.license_key || ''}"`,
      ].join(','));

      const csv = [csvHeaders, ...csvRows].join('\n');
      const bom = '\uFEFF';
      const csvContent = bom + csv;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="licences_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // ============================================
    // EXPORT EXCEL PROFESSIONNEL
    // ============================================
    
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'Bridge LFU';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastModifiedBy = user.email || 'Bridge LFU';
    workbook.company = 'Bridge';

    const worksheet = workbook.addWorksheet('Licences', {
      pageSetup: { 
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    // En-tête du document
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BRIDGE LFU - INVENTAIRE DES LICENCES';
    titleCell.font = { 
      name: 'Calibri', 
      size: 18, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    titleCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };
    worksheet.getRow(1).height = 35;

    // Informations de génération
    worksheet.mergeCells('A2:J2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} par ${user.email}`;
    infoCell.font = { 
      name: 'Calibri', 
      size: 10, 
      italic: true,
      color: { argb: 'FF666666' }
    };
    infoCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    // Filtres appliqués
    if (search || clientId || status || editor) {
      worksheet.mergeCells('A4:J4');
      const filterCell = worksheet.getCell('A4');
      const filters = [];
      if (search) filters.push(`Recherche: "${search}"`);
      if (status && status !== 'all') filters.push(`Statut: ${status}`);
      if (editor) filters.push(`Éditeur: ${editor}`);
      if (clientId && clientId !== 'all') filters.push(`Client: ${licenses[0]?.client_name || clientId}`);
      
      filterCell.value = `Filtres appliqués: ${filters.join(' | ')}`;
      filterCell.font = { 
        name: 'Calibri', 
        size: 9, 
        italic: true,
        color: { argb: 'FF666666' }
      };
      filterCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      worksheet.addRow([]);
    }

    // En-têtes des colonnes
    const headerRow = worksheet.addRow([
      'Nom',
      'Éditeur',
      'Version',
      'Statut',
      'Client',
      'Date d\'achat',
      'Date d\'expiration',
      'Jours restants',
      'Coût (XAF)',
      'Clé de licence'
    ]);

    headerRow.font = { 
      name: 'Calibri', 
      size: 11, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E75B6' }
    };
    headerRow.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: true 
    };
    headerRow.height = 30;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });

    // Fonction pour obtenir la couleur selon le statut
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'FF28A745'; // Vert
        case 'about_to_expire': return 'FFFF9800'; // Orange
        case 'expired': return 'FFDC3545'; // Rouge
        case 'cancelled': return 'FF6C757D'; // Gris
        default: return 'FF6C757D';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'active': return 'Active';
        case 'about_to_expire': return 'Bientôt expirée';
        case 'expired': return 'Expirée';
        case 'cancelled': return 'Annulée';
        default: return status;
      }
    };

    // Calcul des jours restants
    const getDaysRemaining = (expiryDate: string | null) => {
      if (!expiryDate) return null;
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    };

    // Données
    licenses.forEach((item, index) => {
      const daysRemaining = getDaysRemaining(item.expiry_date);
      
      const row = worksheet.addRow([
        item.name || '',
        item.editor || '',
        item.version || '',
        getStatusLabel(item.status),
        item.client_name || '',
        item.purchase_date ? new Date(item.purchase_date) : '',
        item.expiry_date ? new Date(item.expiry_date) : '',
        daysRemaining !== null ? daysRemaining : '',
        item.cost || 0,
        item.license_key || ''
      ]);

      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      
      row.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };

        cell.alignment = { 
          vertical: 'middle',
          horizontal: [8, 9].includes(colNumber) ? 'right' : 'left'
        };

        // Colonne Statut avec couleur
        if (colNumber === 4) {
          cell.font = { 
            bold: true, 
            color: { argb: 'FFFFFFFF' } 
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: getStatusColor(item.status) }
          };
          cell.alignment = { 
            vertical: 'middle',
            horizontal: 'center'
          };
        }

        // Jours restants avec couleur conditionnelle
        if (colNumber === 8 && daysRemaining !== null) {
          if (daysRemaining < 0) {
            cell.font = { bold: true, color: { argb: 'FFDC3545' } };
          } else if (daysRemaining <= 30) {
            cell.font = { bold: true, color: { argb: 'FFFF9800' } };
          }
        }
      });

      row.height = 25;

      // Format des dates
      if (item.purchase_date) {
        row.getCell(6).numFmt = 'dd/mm/yyyy';
      }
      if (item.expiry_date) {
        row.getCell(7).numFmt = 'dd/mm/yyyy';
      }

      // Format du coût
      row.getCell(9).numFmt = '#,##0" XAF"';
    });

    // Largeurs des colonnes
    worksheet.columns = [
      { width: 30 }, // Nom
      { width: 20 }, // Éditeur
      { width: 15 }, // Version
      { width: 18 }, // Statut
      { width: 25 }, // Client
      { width: 15 }, // Date achat
      { width: 18 }, // Date expiration
      { width: 15 }, // Jours restants
      { width: 15 }, // Coût
      { width: 35 }  // Clé de licence
    ];

    // Statistiques en bas
    worksheet.addRow([]);
    
    const statsRow = worksheet.addRow([
      'STATISTIQUES', '', '', '', '', '', '', '', 'TOTAL:', 
      licenses.reduce((sum, item) => sum + (item.cost || 0), 0)
    ]);
    statsRow.font = { bold: true, size: 11 };
    statsRow.getCell(9).alignment = { horizontal: 'right' };
    statsRow.getCell(10).numFmt = '#,##0" XAF"';
    statsRow.getCell(10).font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
    
    worksheet.mergeCells(`A${statsRow.number}:H${statsRow.number}`);
    statsRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };

    // Compter les statuts
    const statusCounts = licenses.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const statusRow = worksheet.addRow([
      '',
      `Actives: ${statusCounts.active + statusCounts.about_to_expire || 0}`,
      `Bientôt expirées: ${statusCounts.about_to_expire || 0}`,
      `Expirées: ${statusCounts.expired || 0}`,
      `Annulées: ${statusCounts.cancelled || 0}`,
      '',
      '',
      '',
      `Total licences:`,
      licenses.length
    ]);
    statusRow.font = { size: 10 };
    // worksheet.mergeCells(`B${statusRow.number}:E${statusRow.number}`);

    // Génération du fichier
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="licences_bridge_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Erreur API GET /licenses/export:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
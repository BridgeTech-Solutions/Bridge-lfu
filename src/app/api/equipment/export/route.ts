// app/api/equipment/export/route.ts
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'xlsx';

    let query = supabase
      .from('v_equipment_with_client')
      .select('*');

    // Filtrage basé sur le rôle
    if (user.role === 'client' && user.client_id) {
      query = query.eq('client_id', user.client_id);
    }

    // Appliquer les filtres
    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    }
    if (clientId) query = query.eq('client_id', clientId);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data: equipment, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de l\'exportation:', error);
      return NextResponse.json(
        { message: 'Erreur lors de l\'exportation' },
        { status: 500 }
      );
    }

    // Export JSON (inchangé)
    if (format === 'json') {
      return NextResponse.json(equipment, {
        headers: {
          'Content-Disposition': `attachment; filename="equipements_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Export CSV simple (inchangé)
    if (format === 'csv') {
      const csvHeaders = [
        'Nom',
        'Type',
        'Marque',
        'Modèle',
        'N° Série',
        'Statut',
        'Client',
        'Date d\'achat',
        'Date obsolescence',
        'Coût (XAF)',
        'Localisation',
        'Date création'
      ].join(',');

      const csvRows = equipment.map(item => [
        `"${item.name || ''}"`,
        `"${item.type || ''}"`,
        `"${item.brand || ''}"`,
        `"${item.model || ''}"`,
        `"${item.serial_number || ''}"`,
        `"${item.status || ''}"`,
        `"${item.client_name || ''}"`,
        item.purchase_date || '',
        item.estimated_obsolescence_date || '',
        item.cost || 0,
        `"${item.location || ''}"`,
        item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : ''
      ].join(','));

      const csv = [csvHeaders, ...csvRows].join('\n');
      const bom = '\uFEFF';
      const csvContent = bom + csv;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="equipements_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // ============================================
    // EXPORT EXCEL PROFESSIONNEL AVEC EXCELJS
    // ============================================
    
    const workbook = new ExcelJS.Workbook();
    
    // Métadonnées du document
    workbook.creator = 'Bridge LFU';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastModifiedBy = user.email || 'Bridge LFU';
    workbook.company = 'Bridge';

    const worksheet = workbook.addWorksheet('Équipements', {
      pageSetup: { 
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    // ============================================
    // EN-TÊTE DU DOCUMENT
    // ============================================
    
    // Logo/Titre principal
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'BRIDGE LFU - INVENTAIRE DES ÉQUIPEMENTS';
    titleCell.font = { 
      name: 'Calibri', 
      size: 18, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' } // Bleu professionnel
    };
    titleCell.alignment = { 
      vertical: 'middle', 
      horizontal: 'center' 
    };
    worksheet.getRow(1).height = 35;

    // Informations de génération
    worksheet.mergeCells('A2:L2');
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

    // Ligne vide
    worksheet.addRow([]);

    // Filtres appliqués
    if (search || clientId || type || status) {
      worksheet.mergeCells('A4:L4');
      const filterCell = worksheet.getCell('A4');
      const filters = [];
      if (search) filters.push(`Recherche: "${search}"`);
      if (type) filters.push(`Type: ${type}`);
      if (status) filters.push(`Statut: ${status}`);
      if (clientId) filters.push(`Client: ${equipment[0]?.client_name || clientId}`);
      
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

    // ============================================
    // EN-TÊTES DES COLONNES
    // ============================================
    
    const headerRow = worksheet.addRow([
      'Nom',
      'Type',
      'Marque',
      'Modèle',
      'N° Série',
      'Statut',
      'Client',
      'Date d\'achat',
      'Date obsolescence',
      'Garantie',
      'Coût (XAF)',
      'Localisation'
    ]);

    // Style des en-têtes
    headerRow.font = { 
      name: 'Calibri', 
      size: 11, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E75B6' } // Bleu foncé
    };
    headerRow.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: true 
    };
    headerRow.height = 30;

    // Bordures des en-têtes
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });

    // ============================================
    // DONNÉES
    // ============================================
    
    // Fonction pour obtenir la couleur selon le statut
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'actif': return 'FF28A745'; // Vert
        case 'en_maintenance': return 'FFFFC107'; // Jaune
        case 'bientot_obsolete': return 'FFFF9800'; // Orange
        case 'obsolete': return 'FFDC3545'; // Rouge
        case 'retire': return 'FF6C757D'; // Gris
        default: return 'FF6C757D';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'actif': return 'Actif';
        case 'en_maintenance': return 'En maintenance';
        case 'bientot_obsolete': return 'Bientôt obsolète';
        case 'obsolete': return 'Obsolète';
        case 'retire': return 'Retiré';
        default: return status;
      }
    };

    equipment.forEach((item, index) => {
      const row = worksheet.addRow([
        item.name || '',
        item.type ? item.type.toUpperCase() : '',
        item.brand || '',
        item.model || '',
        item.serial_number || '',
        getStatusLabel(item.status),
        item.client_name || '',
        item.purchase_date ? new Date(item.purchase_date) : '',
        item.estimated_obsolescence_date ? new Date(item.estimated_obsolescence_date) : '',
        item.warranty_end_date ? new Date(item.warranty_end_date) : '',
        item.cost || 0,
        item.location || ''
      ]);

      // Alternance de couleurs pour lisibilité
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
          horizontal: colNumber === 11 ? 'right' : 'left' // Coût aligné à droite
        };

        // Colonne Statut avec couleur
        if (colNumber === 6) {
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
      });

      row.height = 25;

      // Format des dates
      if (item.purchase_date) {
        row.getCell(8).numFmt = 'dd/mm/yyyy';
      }
      if (item.estimated_obsolescence_date) {
        row.getCell(9).numFmt = 'dd/mm/yyyy';
      }
      if (item.warranty_end_date) {
        row.getCell(10).numFmt = 'dd/mm/yyyy';
      }

      // Format du coût
      row.getCell(11).numFmt = '#,##0" XAF"';
    });

    // ============================================
    // LARGEURS DES COLONNES
    // ============================================
    
    worksheet.columns = [
      { width: 25 }, // Nom
      { width: 12 }, // Type
      { width: 15 }, // Marque
      { width: 18 }, // Modèle
      { width: 20 }, // N° Série
      { width: 18 }, // Statut
      { width: 22 }, // Client
      { width: 15 }, // Date achat
      { width: 18 }, // Date obsolescence
      { width: 15 }, // Garantie
      { width: 15 }, // Coût
      { width: 20 }  // Localisation
    ];

    // ============================================
    // STATISTIQUES EN BAS
    // ============================================
    
    worksheet.addRow([]); // Ligne vide
    
    const statsRow = worksheet.addRow(['STATISTIQUES', '', '', '', '', '', '', '', '', '', 'TOTAL:', equipment.reduce((sum, item) => sum + (item.cost || 0), 0)]);
    statsRow.font = { bold: true, size: 11 };
    statsRow.getCell(11).numFmt = '#,##0" XAF"';
    statsRow.getCell(11).alignment = { horizontal: 'right' };
    statsRow.getCell(12).numFmt = '#,##0" XAF"';
    statsRow.getCell(12).font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };
    
    worksheet.mergeCells(`A${statsRow.number}:J${statsRow.number}`);
    statsRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };

    // Compter les statuts
    const statusCounts = equipment.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const statusRow = worksheet.addRow([
      '',
      `Actifs: ${statusCounts.actif + statusCounts.bientot_obsolete || 0}`,
      `En maintenance: ${statusCounts.en_maintenance || 0}`,
      `Bientôt obsolètes: ${statusCounts.bientot_obsolete || 0}`,
      `Obsolètes: ${statusCounts.obsolete || 0}`,
      `Retirés: ${statusCounts.retire || 0}`,
      '',
      '',
      '',
      '',
      `Total équipements:`,
      equipment.length
    ]);
    statusRow.font = { size: 10 };
    // worksheet.mergeCells(`B${statusRow.number}:F${statusRow.number}`);

    // ============================================
    // GÉNÉRATION DU FICHIER
    // ============================================
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="equipements_bridge_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Erreur API GET /equipment/export:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
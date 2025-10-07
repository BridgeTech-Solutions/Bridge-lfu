// app/api/equipment/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import ExcelJS from 'exceljs'

type EquipmentExportRow = {
  id: string | null
  name: string | null
  type_id: string | null
  type_name: string | null
  type_code: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  status: string | null
  client_id: string | null
  client_name: string | null
  purchase_date: string | null
  estimated_obsolescence_date: string | null
  warranty_end_date: string | null
  cost: number | null
  location: string | null
  created_at: string | null
}

const ALLOWED_STATUSES = new Set([
  'actif',
  'en_maintenance',
  'bientot_obsolete',
  'obsolete',
  'retire',
])

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const clientId = searchParams.get('client_id')
    const typeId = searchParams.get('type_id')
    const typeCode = searchParams.get('type_code')
    const typeLegacy = searchParams.get('type')
    const status = searchParams.get('status')
    const format = searchParams.get('format') || 'xlsx'

    let query = supabase.from('v_equipment_with_client').select('*')

    if (user.role === 'client' && user.client_id) {
      query = query.eq('client_id', user.client_id)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`,
      )
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (typeId) {
      query = query.eq('type_id', typeId)
    } else if (typeCode) {
      query = query.eq('type_code', typeCode)
    } else if (typeLegacy) {
      query = query.ilike('type_code', `%${typeLegacy}%`)
    }

    if (status && ALLOWED_STATUSES.has(status)) {
      query = query.eq('status', status)
    }

    const { data: equipment, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      console.error("Erreur lors de l'exportation:", error)
      return NextResponse.json(
        { message: "Erreur lors de l'exportation" },
        { status: 500 },
      )
    }

    const equipmentData = (equipment ?? []) as EquipmentExportRow[]

    const typeFilterLabel =
      typeCode ??
      equipmentData[0]?.type_name ??
      equipmentData[0]?.type_code ??
      typeLegacy ??
      typeId ??
      null

    if (format === 'json') {
      return NextResponse.json(equipmentData, {
        headers: {
          'Content-Disposition': `attachment; filename="equipements_${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

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
        'Date création',
      ].join(',')

      const csvRows = equipmentData.map((item) =>
        [
          `"${item.name ?? ''}"`,
          `"${item.type_name ?? item.type_code ?? ''}"`,
          `"${item.brand ?? ''}"`,
          `"${item.model ?? ''}"`,
          `"${item.serial_number ?? ''}"`,
          `"${item.status ?? ''}"`,
          `"${item.client_name ?? ''}"`,
          item.purchase_date ?? '',
          item.estimated_obsolescence_date ?? '',
          item.cost ?? 0,
          `"${item.location ?? ''}"`,
          item.created_at
            ? new Date(item.created_at).toLocaleDateString('fr-FR')
            : '',
        ].join(','),
      )

      const csvContent =
        '\uFEFF' + [csvHeaders, ...csvRows].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="equipements_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Bridge LFU'
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.lastModifiedBy = user.email || 'Bridge LFU'
    workbook.company = 'Bridge'

    const worksheet = workbook.addWorksheet('Équipements', {
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    })

    worksheet.mergeCells('A1:L1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'BRIDGE LFU - INVENTAIRE DES ÉQUIPEMENTS'
    titleCell.font = {
      name: 'Calibri',
      size: 18,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' },
    }
    titleCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    }
    worksheet.getRow(1).height = 35

    worksheet.mergeCells('A2:L2')
    const infoCell = worksheet.getCell('A2')
    infoCell.value = `Généré le ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} par ${user.email}`
    infoCell.font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF666666' },
    }
    infoCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    }
    worksheet.getRow(2).height = 20

    worksheet.addRow([])

    if (search || clientId || typeId || typeCode || typeLegacy || status) {
      worksheet.mergeCells('A4:L4')
      const filterCell = worksheet.getCell('A4')
      const filters: string[] = []
      if (search) filters.push(`Recherche: "${search}"`)
      if (typeFilterLabel) filters.push(`Type: ${typeFilterLabel}`)
      if (status) filters.push(`Statut: ${status}`)
      if (clientId)
        filters.push(`Client: ${equipmentData[0]?.client_name || clientId}`)

      filterCell.value = `Filtres appliqués: ${filters.join(' | ')}`
      filterCell.font = {
        name: 'Calibri',
        size: 9,
        italic: true,
        color: { argb: 'FF666666' },
      }
      filterCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' },
      }
      worksheet.addRow([])
    }

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
      'Localisation',
    ])

    headerRow.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E75B6' },
    }
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    }
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      }
    })

    const getStatusColor = (status: string | null | undefined) => {
      switch (status) {
        case 'actif':
          return 'FF28A745'
        case 'en_maintenance':
          return 'FFFFC107'
        case 'bientot_obsolete':
          return 'FFFF9800'
        case 'obsolete':
          return 'FFDC3545'
        case 'retire':
          return 'FF6C757D'
        default:
          return 'FF6C757D'
      }
    }

    const getStatusLabel = (status: string | null | undefined) => {
      switch (status) {
        case 'actif':
          return 'Actif'
        case 'en_maintenance':
          return 'En maintenance'
        case 'bientot_obsolete':
          return 'Bientôt obsolète'
        case 'obsolete':
          return 'Obsolète'
        case 'retire':
          return 'Retiré'
        default:
          return status ?? 'Inconnu'
      }
    }

    equipmentData.forEach((item, index) => {
      const row = worksheet.addRow([
        item.name || '',
        item.type_name || (item.type_code ? item.type_code.toUpperCase() : ''),
        item.brand || '',
        item.model || '',
        item.serial_number || '',
        getStatusLabel(item.status),
        item.client_name || '',
        item.purchase_date ? new Date(item.purchase_date) : '',
        item.estimated_obsolescence_date
          ? new Date(item.estimated_obsolescence_date)
          : '',
        item.warranty_end_date ? new Date(item.warranty_end_date) : '',
        item.cost ?? 0,
        item.location || '',
      ])

      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA'

      row.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        }

        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 11 ? 'right' : 'left',
        }

        if (colNumber === 6) {
          cell.font = {
            bold: true,
            color: { argb: 'FFFFFFFF' },
          }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: getStatusColor(item.status) },
          }
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
          }
        }
      })

      row.height = 25

      if (item.purchase_date) {
        row.getCell(8).numFmt = 'dd/mm/yyyy'
      }
      if (item.estimated_obsolescence_date) {
        row.getCell(9).numFmt = 'dd/mm/yyyy'
      }
      if (item.warranty_end_date) {
        row.getCell(10).numFmt = 'dd/mm/yyyy'
      }

      row.getCell(11).numFmt = '#,##0" XAF"'
    })

    worksheet.columns = [
      { width: 25 },
      { width: 12 },
      { width: 15 },
      { width: 18 },
      { width: 20 },
      { width: 18 },
      { width: 22 },
      { width: 15 },
      { width: 18 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ]

    worksheet.addRow([])

    const totalCost = equipmentData.reduce(
      (sum, item) => sum + (item.cost ?? 0),
      0,
    )
    const statsRow = worksheet.addRow([
      'STATISTIQUES',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'TOTAL:',
      totalCost,
    ])
    statsRow.font = { bold: true, size: 11 }
    statsRow.getCell(11).numFmt = '#,##0" XAF"'
    statsRow.getCell(11).alignment = { horizontal: 'right' }
    statsRow.getCell(12).numFmt = '#,##0" XAF"'
    statsRow.getCell(12).font = {
      bold: true,
      size: 12,
      color: { argb: 'FF0066CC' },
    }

    worksheet.mergeCells(`A${statsRow.number}:J${statsRow.number}`)
    statsRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    }

    const statusCounts = equipmentData.reduce<Record<string, number>>(
      (acc, item) => {
        const key = item.status ?? 'inconnu'
        acc[key] = (acc[key] || 0) + 1
        return acc
      },
      {},
    )

    const actifs =
      (statusCounts.actif ?? 0) + (statusCounts.bientot_obsolete ?? 0)
    const maintenance = statusCounts.en_maintenance ?? 0
    const bientotObsoletes = statusCounts.bientot_obsolete ?? 0
    const obsoletes = statusCounts.obsolete ?? 0
    const retires = statusCounts.retire ?? 0

    const statusRow = worksheet.addRow([
      '',
      `Actifs: ${actifs}`,
      `En maintenance: ${maintenance}`,
      `Bientôt obsolètes: ${bientotObsoletes}`,
      `Obsolètes: ${obsoletes}`,
      `Retirés: ${retires}`,
      '',
      '',
      '',
      '',
      'Total équipements:',
      equipmentData.length,
    ])
    statusRow.font = { size: 10 }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="equipements_bridge_${new Date()
          .toISOString()
          .split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Erreur API GET /equipment/export:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 },
    )
  }
}
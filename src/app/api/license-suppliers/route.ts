import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { PermissionChecker } from '@/lib/auth/permissions'
import { licenseSupplierCreateSchema } from '@/lib/validations'

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const checker = new PermissionChecker(user)
    const { searchParams } = new URL(request.url)

    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10), MAX_LIMIT)
    const offset = (page - 1) * limit

    const search = searchParams.get('search')?.trim()
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const onlyActive = searchParams.get('active') === 'true'

    let query = supabase.from('license_suppliers').select('*', { count: 'exact' })

    if (!checker.canViewAllData()) {
      query = query.eq('is_active', true)
    } else if (onlyActive || !includeInactive) {
      query = query.eq('is_active', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%,contact_phone.ilike.%${search}%`)
    }

    const { data, count, error } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erreur lors de la récupération des fournisseurs:', error)
      return NextResponse.json({ message: 'Erreur lors de la récupération des fournisseurs' }, { status: 500 })
    }

    return NextResponse.json({
      data,
      count,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      hasMore: offset + limit < (count ?? 0),
    })
  } catch (error) {
    console.error('Erreur API GET /license-suppliers:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const checker = new PermissionChecker(user)
    if (!checker.can('create', 'license_suppliers')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 })
    }

    const payload = await request.json()
    const parsed = licenseSupplierCreateSchema.parse(payload)

    const supabase = createSupabaseServerClient()

    const supplierToInsert = {
      name: parsed.name.trim(),
      contact_email: parsed.contactEmail?.trim() || null,
      contact_phone: parsed.contactPhone?.trim() || null,
      website: parsed.website?.trim() || null,
      address: parsed.address?.trim() || null,
      notes: parsed.notes?.trim() || null,
      is_active: parsed.isActive ?? true,
      created_by: user.id,
    }

    const { data: supplier, error } = await supabase
      .from('license_suppliers')
      .insert(supplierToInsert)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du fournisseur:', error)
      const status = error.code === '23505' ? 409 : 500
      const message = error.code === '23505'
        ? 'Un fournisseur avec ce nom existe déjà'
        : 'Erreur lors de la création du fournisseur'
      return NextResponse.json({ message }, { status })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null
    const userAgent = request.headers.get('user-agent')

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'create',
      table_name: 'license_suppliers',
      record_id: supplier.id,
      new_values: supplier,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Données invalides', errors: error }, { status: 400 })
    }

    console.error('Erreur API POST /license-suppliers:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { PermissionChecker } from '@/lib/auth/permissions'
import { licenseSupplierUpdateSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const params = await context.params
    const { supplierId } = params

    const supabase = createSupabaseServerClient()
    const checker = new PermissionChecker(user)

    let query = supabase.from('license_suppliers').select('*').eq('id', supplierId)

    if (!checker.canViewAllData()) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Erreur lors de la récupération du fournisseur:', error)
      return NextResponse.json({ message: 'Erreur lors de la récupération du fournisseur' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ message: 'Fournisseur introuvable' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur API GET /license-suppliers/[id]:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const checker = new PermissionChecker(user)
    if (!checker.can('update', 'license_suppliers')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 })
    }

    const params = await context.params
    const { supplierId } = params

    const payload = await request.json()
    const parsed = licenseSupplierUpdateSchema.parse({ ...payload, id: supplierId })

    const supabase = createSupabaseServerClient()

    const { data: existingSupplier, error: fetchError } = await supabase
      .from('license_suppliers')
      .select('*')
      .eq('id', supplierId)
      .maybeSingle()

    if (fetchError) {
      console.error('Erreur lors de la récupération du fournisseur:', fetchError)
      return NextResponse.json({ message: 'Erreur lors de la récupération du fournisseur' }, { status: 500 })
    }

    if (!existingSupplier) {
      return NextResponse.json({ message: 'Fournisseur introuvable' }, { status: 404 })
    }

    const updates = {
      ...(parsed.name !== undefined ? { name: parsed.name.trim() } : {}),
      ...(parsed.contactEmail !== undefined ? { contact_email: parsed.contactEmail?.trim() || null } : {}),
      ...(parsed.contactPhone !== undefined ? { contact_phone: parsed.contactPhone?.trim() || null } : {}),
      ...(parsed.website !== undefined ? { website: parsed.website?.trim() || null } : {}),
      ...(parsed.address !== undefined ? { address: parsed.address?.trim() || null } : {}),
      ...(parsed.notes !== undefined ? { notes: parsed.notes?.trim() || null } : {}),
      ...(parsed.isActive !== undefined ? { is_active: parsed.isActive } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data: updatedSupplier, error } = await supabase
      .from('license_suppliers')
      .update(updates)
      .eq('id', supplierId)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour du fournisseur:', error)
      const status = error.code === '23505' ? 409 : 500
      const message = error.code === '23505'
        ? 'Un fournisseur avec ce nom existe déjà'
        : 'Erreur lors de la mise à jour du fournisseur'
      return NextResponse.json({ message }, { status })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null
    const userAgent = request.headers.get('user-agent')

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'license_suppliers',
      record_id: updatedSupplier.id,
      old_values: existingSupplier,
      new_values: updatedSupplier,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json(updatedSupplier)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Données invalides', errors: error }, { status: 400 })
    }

    console.error('Erreur API PUT /license-suppliers/[id]:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const checker = new PermissionChecker(user)
    if (!checker.can('delete', 'license_suppliers')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 })
    }

    const params = await context.params
    const { supplierId } = params

    const supabase = createSupabaseServerClient()

    const { data: existingSupplier, error: fetchError } = await supabase
      .from('license_suppliers')
      .select('*')
      .eq('id', supplierId)
      .maybeSingle()

    if (fetchError) {
      console.error('Erreur lors de la récupération du fournisseur:', fetchError)
      return NextResponse.json({ message: 'Erreur lors de la récupération du fournisseur' }, { status: 500 })
    }

    if (!existingSupplier) {
      return NextResponse.json({ message: 'Fournisseur introuvable' }, { status: 404 })
    }

    if (existingSupplier.is_active) {
      const { error: deactivateError } = await supabase
        .from('license_suppliers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', supplierId)

      if (deactivateError) {
        console.error('Erreur lors de la désactivation du fournisseur:', deactivateError)
        return NextResponse.json({ message: 'Erreur lors de la désactivation du fournisseur' }, { status: 500 })
      }
    } else {
      const { error: deleteError } = await supabase
        .from('license_suppliers')
        .delete()
        .eq('id', supplierId)

      if (deleteError) {
        console.error('Erreur lors de la suppression du fournisseur:', deleteError)
        return NextResponse.json({ message: 'Erreur lors de la suppression du fournisseur' }, { status: 500 })
      }
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null
    const userAgent = request.headers.get('user-agent')

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'license_suppliers',
      record_id: existingSupplier.id,
      old_values: existingSupplier,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json({ message: 'Fournisseur désactivé avec succès' })
  } catch (error) {
    console.error('Erreur API DELETE /license-suppliers/[id]:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

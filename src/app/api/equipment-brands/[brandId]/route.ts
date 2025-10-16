import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { PermissionChecker } from '@/lib/auth/permissions'
import { equipmentBrandUpdateSchema } from '@/lib/validations'

// GET /api/equipment-brands/[brandId] - Récupérer une marque
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

    const { brandId } = await context.params
    const supabase = createSupabaseServerClient()
    const checker = new PermissionChecker(user)

    let query = supabase.from('equipment_brands').select('*').eq('id', brandId)

    if (!checker.canViewAllData()) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Erreur lors de la récupération de la marque:', error)
      return NextResponse.json({ message: 'Erreur lors de la récupération de la marque' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ message: 'Marque introuvable' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur API GET /equipment-brands/[id]:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// PUT /api/equipment-brands/[brandId] - Mettre à jour une marque
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
    if (!checker.can('update', 'equipment_brands')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { brandId } = await context.params
    const payload = await request.json()
    const parsed = equipmentBrandUpdateSchema.parse({ ...payload, id: brandId })

    const supabase = createSupabaseServerClient()

    const { data: existingBrand, error: fetchError } = await supabase
      .from('equipment_brands')
      .select('*')
      .eq('id', brandId)
      .maybeSingle()

    if (fetchError) {
      console.error('Erreur lors de la récupération de la marque:', fetchError)
      return NextResponse.json({ message: 'Erreur lors de la récupération de la marque' }, { status: 500 })
    }

    if (!existingBrand) {
      return NextResponse.json({ message: 'Marque introuvable' }, { status: 404 })
    }

    const updates = {
      ...(parsed.name !== undefined ? { name: parsed.name.trim() } : {}),
      ...(parsed.website !== undefined ? { website: parsed.website?.trim() || null } : {}),
      ...(parsed.supportEmail !== undefined ? { support_email: parsed.supportEmail?.trim() || null } : {}),
      ...(parsed.supportPhone !== undefined ? { support_phone: parsed.supportPhone?.trim() || null } : {}),
      ...(parsed.notes !== undefined ? { notes: parsed.notes?.trim() || null } : {}),
      ...(parsed.isActive !== undefined ? { is_active: parsed.isActive } : {}),
      updated_at: new Date().toISOString(),
    }

    const { data: updatedBrand, error } = await supabase
      .from('equipment_brands')
      .update(updates)
      .eq('id', brandId)
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la mise à jour de la marque:', error)
      const status = error.code === '23505' ? 409 : 500
      const message = error.code === '23505'
        ? 'Une marque avec ce nom existe déjà'
        : 'Erreur lors de la mise à jour de la marque'
      return NextResponse.json({ message }, { status })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null
    const userAgent = request.headers.get('user-agent')

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'equipment_brands',
      record_id: updatedBrand.id,
      old_values: existingBrand,
      new_values: updatedBrand,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json(updatedBrand)
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ message: 'Données invalides', errors: error }, { status: 400 })
    }

    console.error('Erreur API PUT /equipment-brands/[id]:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// DELETE /api/equipment-brands/[brandId] - Désactiver ou supprimer une marque
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
    if (!checker.can('delete', 'equipment_brands')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { brandId } = await context.params
    const supabase = createSupabaseServerClient()

    const { data: existingBrand, error: fetchError } = await supabase
      .from('equipment_brands')
      .select('*')
      .eq('id', brandId)
      .maybeSingle()

    if (fetchError) {
      console.error('Erreur lors de la récupération de la marque:', fetchError)
      return NextResponse.json({ message: 'Erreur lors de la récupération de la marque' }, { status: 500 })
    }

    if (!existingBrand) {
      return NextResponse.json({ message: 'Marque introuvable' }, { status: 404 })
    }

    if (existingBrand.is_active) {
      const { error: deactivateError } = await supabase
        .from('equipment_brands')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', brandId)

      if (deactivateError) {
        console.error('Erreur lors de la désactivation de la marque:', deactivateError)
        return NextResponse.json({ message: 'Erreur lors de la désactivation de la marque' }, { status: 500 })
      }
    } else {
      const { error: deleteError } = await supabase
        .from('equipment_brands')
        .delete()
        .eq('id', brandId)

      if (deleteError) {
        console.error('Erreur lors de la suppression de la marque:', deleteError)
        return NextResponse.json({ message: 'Erreur lors de la suppression de la marque' }, { status: 500 })
      }
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null
    const userAgent = request.headers.get('user-agent')

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'equipment_brands',
      record_id: existingBrand.id,
      old_values: existingBrand,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    return NextResponse.json({ message: existingBrand.is_active ? 'Marque désactivée avec succès' : 'Marque supprimée avec succès' })
  } catch (error) {
    console.error('Erreur API DELETE /equipment-brands/[id]:', error)
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 })
  }
}

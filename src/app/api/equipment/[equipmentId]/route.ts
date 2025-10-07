import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { equipmentSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/equipment/[id] - Récupérer un équipement par ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    const { equipmentId } = await context.params;

    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    let query = supabase
      .from('v_equipment_with_client')
      .select('*')
      .eq('id', equipmentId);

    // Filtrage basé sur le rôle
    if (!checker.can('create', 'equipment') && user.client_id) {
      query = query.eq('client_id', user.client_id);
    }

    const { data: equipment, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Équipement non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Erreur lors de la récupération de l\'équipement' },
        { status: 500 }
      );
    }

    // Vérifier les permissions pour cet équipement spécifique
    if (!checker.can('read', 'equipment', equipment)) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json(equipment);

  } catch (error) {
    console.error('Erreur API GET /equipment/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/equipment/[id] - Mettre à jour un équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    const {  equipmentId } = await context.params;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
    const userAgent = request.headers.get('user-agent');

    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);
    const supabase = createSupabaseServerClient();

    // Récupérer l'équipement existant
    const { data: existingEquipment, error: fetchError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', equipmentId)
      .single();

    if (fetchError || !existingEquipment) {
      return NextResponse.json(
        { message: 'Équipement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (!checker.can('update', 'equipment', existingEquipment)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = equipmentSchema.parse(body);

    // Résoudre le type_id à partir des différents champs possibles
    let resolvedTypeId = validatedData.type_id ?? existingEquipment.type_id ?? null;

    if (!resolvedTypeId && validatedData.type_code) {
      const { data: typeMatch, error: typeError } = await supabase
        .from('equipment_types')
        .select('id, is_active')
        .eq('code', validatedData.type_code)
        .maybeSingle();

      if (typeError || !typeMatch) {
        return NextResponse.json(
          { message: "Type d'équipement introuvable" },
          { status: 400 }
        );
      }

      if (typeMatch.is_active === false) {
        return NextResponse.json(
          { message: "Ce type d'équipement est inactif" },
          { status: 400 }
        );
      }

      resolvedTypeId = typeMatch.id;
    }

    if (!resolvedTypeId && validatedData.type) {
      const { data: legacyType, error: legacyError } = await supabase
        .from('equipment_types')
        .select('id, is_active')
        .eq('code', validatedData.type.toUpperCase())
        .maybeSingle();

      if (legacyError || !legacyType) {
        return NextResponse.json(
          { message: "Type d'équipement invalide" },
          { status: 400 }
        );
      }

      if (legacyType.is_active === false) {
        return NextResponse.json(
          { message: "Ce type d'équipement est inactif" },
          { status: 400 }
        );
      }

      resolvedTypeId = legacyType.id;
    }

    if (!resolvedTypeId) {
      return NextResponse.json(
        { message: "Type d'équipement requis" },
        { status: 400 }
      );
    }

    // Vérifier que le client existe et que l'utilisateur y a accès
    if (!checker.canAccessClient(validatedData.client_id)) {
      return NextResponse.json(
        { message: 'Accès non autorisé à ce client' },
        { status: 403 }
      );
    }

    // Mettre à jour l'équipement
    const { data: updatedEquipment, error: updateError } = await supabase
      .from('equipment')
      .update({
        name: validatedData.name,
        serial_number: validatedData.serial_number,
        purchase_date: validatedData.purchase_date,
        warranty_end_date: validatedData.warranty_end_date,
        status: validatedData.status,
        type_id: resolvedTypeId,
        brand: validatedData.brand,
        model: validatedData.model,
        estimated_obsolescence_date: validatedData.estimated_obsolescence_date,
        end_of_sale: validatedData.end_of_sale,
        cost: validatedData.cost,
        client_id: validatedData.client_id,
        location: validatedData.location,
        description: validatedData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', equipmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'équipement:', updateError);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour de l\'équipement' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'equipment',
      record_id: updatedEquipment.id,
      old_values: existingEquipment,
      new_values: updatedEquipment,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return NextResponse.json(updatedEquipment);

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }

    console.error('Erreur API PUT /equipment/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/equipment/[id] - Supprimer un équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    const { equipmentId } = await context.params;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
    const userAgent = request.headers.get('user-agent');

    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);
    const supabase = createSupabaseServerClient();

    // Récupérer l'équipement existant
    const { data: existingEquipment, error: fetchError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', equipmentId)
      .single();

    if (fetchError || !existingEquipment) {
      return NextResponse.json(
        { message: 'Équipement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (!checker.can('delete', 'equipment', existingEquipment)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer l'équipement
    const { error: deleteError } = await supabase
      .from('equipment')
      .delete()
      .eq('id', equipmentId);

    if (deleteError) {
      console.error('Erreur lors de la suppression de l\'équipement:', deleteError);
      return NextResponse.json(
        { message: 'Erreur lors de la suppression de l\'équipement' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'equipment',
      record_id: existingEquipment.id,
      old_values: existingEquipment,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return NextResponse.json({ message: 'Équipement supprimé avec succès' });

  } catch (error) {
    console.error('Erreur API DELETE /equipment/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

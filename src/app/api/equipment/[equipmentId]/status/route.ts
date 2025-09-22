// app/api/equipment/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { z } from 'zod';

// Schéma de validation pour la mise à jour du statut

const statusUpdateSchema = z.object({
  status: z.enum(['actif', 'en_maintenance', 'bientot_obsolete', 'obsolete', 'retire'])
});


// PATCH /api/equipment/[id]/status - Mettre à jour le statut d'un équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: NextRequest, context: any) {
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
    if (!checker.can('update', 'equipment', existingEquipment)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Valider les données
    const body = await request.json();
    const validatedData = statusUpdateSchema.parse(body);

    // Mettre à jour le statut
    const { data: updatedEquipment, error: updateError } = await supabase
      .from('equipment')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', equipmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour du statut:', updateError);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update_status',
      table_name: 'equipment',
      record_id: updatedEquipment.id,
      old_values: { status: existingEquipment.status },
      new_values: { status: updatedEquipment.status },
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Créer une notification si nécessaire
    if (validatedData.status === 'en_maintenance') {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'general',
        title: 'Équipement en maintenance',
        message: `L'équipement "${existingEquipment.name}" a été marqué comme en maintenance`,
        related_id: updatedEquipment.id,
        related_type: 'equipment'
      });
    }

    return NextResponse.json(updatedEquipment);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Données invalides', errors: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur API PATCH /equipment/[id]/status:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
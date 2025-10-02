import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// PATCH /api/licenses/[id]/status - Annuler ou réactiver une licence
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ licenseId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const checker = new PermissionChecker(user);
    if (!checker.can('update', 'licenses')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 });
    }

    const params = await context.params;
    const { licenseId } = params;
    const body = await request.json();
    const { action } = body; // 'cancel' ou 'reactivate'

    if (!action || !['cancel', 'reactivate'].includes(action)) {
      return NextResponse.json(
        { message: 'Action invalide. Utilisez "cancel" ou "reactivate"' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Récupérer la licence
    const { data: license, error: fetchError } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (fetchError || !license) {
      return NextResponse.json({ message: 'Licence non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions client
    if (!checker.canViewAllData() && license.client_id !== user.client_id) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
    }

    let updateData: { status?: 'cancelled'; expiry_date?: string };

    if (action === 'cancel') {
      // Annuler la licence
      updateData = { status: 'cancelled' };
    } else {
      // Réactivation : on met à jour expiry_date avec la même valeur
      // Le trigger calculate_license_status() recalculera automatiquement le bon statut
      updateData = { expiry_date: license.expiry_date };
    }

    // Mettre à jour (le trigger recalculera le statut automatiquement pour la réactivation)
    const { data: updatedLicense, error: updateError } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', licenseId)
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
      action: action === 'cancel' ? 'license_cancelled' : 'license_reactivated',
      entity_type: 'license',
      entity_id: licenseId,
      details: {
        license_name: license.name,
        old_status: license.status,
        new_status: updatedLicense?.status
      }
    });

    return NextResponse.json({
      message: action === 'cancel' ? 'Licence annulée avec succès' : 'Licence réactivée avec succès',
      license: updatedLicense
    });

  } catch (error) {
    console.error('Erreur API PATCH /licenses/[id]/status:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// PUT /api/equipment/refresh-status - Mettre à jour tous les statuts d'équipements
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);

    // Seuls les admins et techniciens peuvent rafraîchir les statuts
    if (!checker.can('update', 'equipment')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Utiliser la fonction SQL pour mettre à jour tous les statuts
    const { data: results, error } = await supabase.rpc('refresh_all_equipment_status');

    if (error) {
      console.error('Erreur lors du rafraîchissement des statuts:', error);
      return NextResponse.json(
        { message: 'Erreur lors du rafraîchissement des statuts' },
        { status: 500 }
      );
    }

    // Compter les équipements mis à jour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedCount = results?.filter((r: any) => r.updated).length || 0;

    return NextResponse.json({
      message: `${updatedCount} équipements mis à jour`,
      details: results
    });

  } catch (error) {
    console.error('Erreur API PUT /equipment/refresh-status:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
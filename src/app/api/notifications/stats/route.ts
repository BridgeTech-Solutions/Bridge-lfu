// app/api/notifications/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

// GET /api/notifications/stats - Récupérer les statistiques des notifications de l'utilisateur
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

    // Compter les notifications par statut
    const { data: allNotifications, error } = await supabase
      .from('notifications')
      .select('is_read, type')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des statistiques' },
        { status: 500 }
      );
    }

    const stats = {
      total: allNotifications?.length || 0,
      unread: allNotifications?.filter(n => !n.is_read).length || 0,
      read: allNotifications?.filter(n => n.is_read).length || 0,
      by_type: {
        license_expiry: allNotifications?.filter(n => n.type === 'license_expiry').length || 0,
        equipment_obsolescence: allNotifications?.filter(n => n.type === 'equipment_obsolescence').length || 0,
        general: allNotifications?.filter(n => n.type === 'general').length || 0,
        new_unverified_user: allNotifications?.filter(n => n.type === 'new_unverified_user').length || 0
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erreur API GET /notifications/stats:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
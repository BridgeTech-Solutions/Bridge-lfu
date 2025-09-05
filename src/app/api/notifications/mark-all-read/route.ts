// app/api/notifications/mark-all-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

// POST /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Marquer toutes les notifications non lues de l'utilisateur comme lues
    const { data: updatedNotifications, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select('id');

    if (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour des notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Toutes les notifications ont été marquées comme lues',
      updated_count: updatedNotifications?.length || 0
    });

  } catch (error) {
    console.error('Erreur API POST /notifications/mark-all-read:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
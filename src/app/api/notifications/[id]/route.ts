// app/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

interface Params {
  params: { id: string }
}

// GET /api/notifications/[id] - Récupérer une notification spécifique
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest,  context :any) {
  try {
    const user = await getCurrentUser();
    const params = await context.params; // ✅ await nécessaire
    const { id } = params;

    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Notification non trouvée' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Erreur lors de la récupération de la notification' },
        { status: 500 }
      );
    }

    return NextResponse.json(notification);

  } catch (error) {
    console.error('Erreur API GET /notifications/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Marquer une notification comme lue/non lue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: NextRequest, { context }: any) {
  try {
    const user = await getCurrentUser();
    const params = await context.params; // ✅ await nécessaire
    const { id } = params;

    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isRead } = body;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { message: 'Le champ isRead doit être un booléen' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Vérifier que la notification appartient à l'utilisateur
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', id)
      .single();

    if (fetchError || !existingNotification) {
      return NextResponse.json(
        { message: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut de lecture
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: isRead })
      .eq('id', id)
      .eq('user_id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour de la notification:', updateError);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour de la notification' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error('Erreur API PATCH /notifications/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Supprimer une notification
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, { context }: any) {
  try {
    const user = await getCurrentUser();
    const params = await context.params; // ✅ await nécessaire
    const { id } = params;

    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Vérifier que la notification appartient à l'utilisateur
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', id)
      .single();

    if (fetchError || !existingNotification) {
      return NextResponse.json(
        { message: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', id);

    if (deleteError) {
      console.error('Erreur lors de la suppression de la notification:', deleteError);
      return NextResponse.json(
        { message: 'Erreur lors de la suppression de la notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Notification supprimée avec succès' });

  } catch (error) {
    console.error('Erreur API DELETE /notifications/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
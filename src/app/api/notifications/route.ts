// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/notifications - Récupérer les notifications de l'utilisateur
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
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    // Paramètres de filtrage
    const isRead = searchParams.get('is_read');
    const type = searchParams.get('type');

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Filtres
    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true');
    }

    if (type && ['license_expiry', 'equipment_obsolescence', 'general', 'new_unverified_user'].includes(type)) {
      // Assert that 'type' is one of the valid notification types
      query = query.eq('type', type as "license_expiry" | "equipment_obsolescence" | "general" | "new_unverified_user");
    }

    // Pagination et tri
    const { data: notifications, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: notifications,
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0)
    });

  } catch (error) {
    console.error('Erreur API GET /notifications:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Créer une nouvelle notification (Admin/Technicien uniquement)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);

    // Seuls les admins et techniciens peuvent créer des notifications
    if (user.role !== 'admin' && user.role !== 'technicien') {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, title, message, relatedId, relatedType } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { message: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Vérifier que l'utilisateur cible existe
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { message: 'Utilisateur cible non trouvé' },
        { status: 404 }
      );
    }

    // Créer la notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId || null,
        related_type: relatedType || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la création de la notification' },
        { status: 500 }
      );
    }

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error('Erreur API POST /notifications:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

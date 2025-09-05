import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { profileSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { supabaseAdmin } from '@/lib/supabase/admin';

// interface Params {
//   params: { id: string }
// }

// PATCH /api/users/[id]/validate - Valider un utilisateur non vérifié (Admin uniquement)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: NextRequest, context :any) {
  try {
    // Récupération de l'ID depuis params
    const params = await context.params; // ✅ await nécessaire
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'ID manquant' }, { status: 400 });
    }

    const user = await getCurrentUser();
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

    // Seuls les admins peuvent valider des utilisateurs
    if (!checker.can('create', 'users')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // const supabase = createSupabaseServerClient();
    const body = await request.json();
    const { role, clientId } = body;

    // Récupérer l'utilisateur existant
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (existingUser.role !== 'unverified') {
      return NextResponse.json(
        { message: 'Cet utilisateur est déjà validé' },
        { status: 400 }
      );
    }

    // Valider l'utilisateur
    const { data: validatedUser, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: role || 'client',
        client_id: clientId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la validation de l\'utilisateur:', updateError);
      return NextResponse.json(
        { message: 'Erreur lors de la validation de l\'utilisateur' },
        { status: 500 }
      );
    }

    // Créer une notification pour l'utilisateur validé
    await supabaseAdmin.from('notifications').insert({
      user_id: id,
      type: 'general',
      title: 'Compte validé',
      message: 'Votre compte a été validé et vous pouvez maintenant accéder à l\'application',
      related_id: id,
      related_type: 'user'
    });

    // Log de l'activité
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'validate',
      table_name: 'profiles',
      record_id: validatedUser.id,
      old_values: existingUser,
      new_values: validatedUser,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return NextResponse.json(validatedUser);

  } catch (error) {
    console.error('Erreur API PATCH /users/[id]/validate:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
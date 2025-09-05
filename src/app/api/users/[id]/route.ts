// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { profileSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { supabaseAdmin } from '@/lib/supabase/admin';

// interface Params {
//   params: { id: string }
// }

// GET /api/users/[id] - Récupérer un utilisateur par ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest,  context : any) {
  try {
    const user = await getCurrentUser();
        // Récupération de l'ID depuis params
    const params = await context.params; // ✅ await nécessaire
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'ID manquant' }, { status: 400 });
    }
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    const { data: targetUser, error } = await supabase
      .from('profiles')
      .select(`
        *,
        clients:client_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Erreur lors de la récupération de l\'utilisateur' },
        { status: 500 }
      );
    }

    // Vérifier les permissions pour cet utilisateur spécifique
    if (!checker.can('read', 'users', targetUser)) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json(targetUser);

  } catch (error) {
    console.error('Erreur API GET /users/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Mettre à jour un utilisateur
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest,  context : any) {
  try {
    const user = await getCurrentUser();
        // Récupération de l'ID depuis params
    const params = await context.params; // ✅ await nécessaire
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'ID manquant' }, { status: 400 });
    }
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

    // Vérifier les permissions
    if (!checker.can('update', 'users', existingUser)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = profileSchema.parse(body);

    // Préparer les données de mise à jour
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      company: validatedData.company,
      phone: validatedData.phone,
      updated_at: new Date().toISOString()
    };

    // Seuls les admins peuvent changer le rôle et l'email
    if (checker.can('create', 'users')) {
      if (validatedData.email !== existingUser.email) {
        updateData.email = validatedData.email;
        
        // Mettre à jour l'email dans auth.users aussi
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          id,
          { email: validatedData.email }
        );
        
        if (authError) {
          console.error('Erreur lors de la mise à jour de l\'email auth:', authError);
          return NextResponse.json(
            { message: 'Erreur lors de la mise à jour de l\'email' },
            { status: 500 }
          );
        }
      }
      
      if (validatedData.role) {
        updateData.role = validatedData.role;
        updateData.client_id = body.clientId || null;
      }
    }

    // Mettre à jour le profil
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateError);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour de l\'utilisateur' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'profiles',
      record_id: updatedUser.id,
      old_values: existingUser,
      new_values: updatedUser,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }

    console.error('Erreur API PUT /users/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Supprimer un utilisateur
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, context : any) {
  try {
    const user = await getCurrentUser();
    // Récupération de l'ID depuis params
    const params = await context.params; // ✅ await nécessaire
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'ID manquant' }, { status: 400 });
    }    
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

    // Vérifier que l'utilisateur ne tente pas de se supprimer lui-même
    if (user.id === id) {
      return NextResponse.json(
        { message: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

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

    // Vérifier les permissions
    if (!checker.can('delete', 'users', existingUser)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer l'utilisateur de auth.users (le profil sera supprimé automatiquement via CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', deleteError);
      return NextResponse.json(
        { message: 'Erreur lors de la suppression de l\'utilisateur' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'profiles',
      record_id: existingUser.id,
      old_values: existingUser,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });

  } catch (error) {
    console.error('Erreur API DELETE /users/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
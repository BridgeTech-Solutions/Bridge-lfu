// app/api/settings/[key]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/settings/[key] - Récupérer un paramètre spécifique
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  // try {
  //   const user = await getCurrentUser();
  //   if (!user) {
  //     return NextResponse.json(
  //       { message: 'Non authentifié' },
  //       { status: 401 }
  //     );
  //   }

  //   const params = await context.params;
  //   const { key } = params;

  //   if (!key) {
  //     return NextResponse.json({ message: 'Clé manquante' }, { status: 400 });
  //   }

  //   const supabase = createSupabaseServerClient();
  //   const checker = new PermissionChecker(user);
  //   const isAdmin = checker.can('create', 'users');

  //   let query = supabase.from('app_settings').select('*').eq('key', key);

  //   // Si pas admin, montrer seulement si public
  //   if (!isAdmin) {
  //     query = query.eq('is_public', true);
  //   }

  //   const { data: setting, error } = await query.single();

  //   if (error) {
  //     if (error.code === 'PGRST116') {
  //       return NextResponse.json(
  //         { message: 'Paramètre non trouvé' },
  //         { status: 404 }
  //       );
  //     }
  //     console.error('Erreur lors de la récupération du paramètre:', error);
  //     return NextResponse.json(
  //       { message: 'Erreur lors de la récupération du paramètre' },
  //       { status: 500 }
  //     );
  //   }

  //   return NextResponse.json(setting);

  // } catch (error) {
  //   console.error('Erreur API GET /settings/[key]:', error);
  //   return NextResponse.json(
  //     { message: 'Erreur interne du serveur' },
  //     { status: 500 }
  //   );
  // }
}

// PUT /api/settings/[key] - Mettre à jour un paramètre spécifique (Admin uniquement)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, context: any) {
  // try {
  //   const user = await getCurrentUser();
  //   if (!user) {
  //     return NextResponse.json(
  //       { message: 'Non authentifié' },
  //       { status: 401 }
  //     );
  //   }

  //   const params = await context.params;
  //   const { key } = params;

  //   if (!key) {
  //     return NextResponse.json({ message: 'Clé manquante' }, { status: 400 });
  //   }

  //   const checker = new PermissionChecker(user);
  //   if (!checker.can('create', 'users')) {
  //     return NextResponse.json(
  //       { message: 'Permissions insuffisantes' },
  //       { status: 403 }
  //     );
  //   }

  //   const body = await request.json();
  //   const { value, description, isPublic } = body;

  //   if (value === undefined) {
  //     return NextResponse.json(
  //       { message: 'Valeur requise' },
  //       { status: 400 }
  //     );
  //   }

  //   // Vérifier que le paramètre existe
  //   const { data: existingSetting, error: fetchError } = await supabaseAdmin
  //     .from('app_settings')
  //     .select('*')
  //     .eq('key', key)
  //     .single();

  //   if (fetchError || !existingSetting) {
  //     return NextResponse.json(
  //       { message: 'Paramètre non trouvé' },
  //       { status: 404 }
  //     );
  //   }

  //   // Mettre à jour
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   const updateData: any = {
  //     value,
  //     updated_at: new Date().toISOString()
  //   };

  //   if (description !== undefined) {
  //     updateData.description = description;
  //   }

  //   if (isPublic !== undefined) {
  //     updateData.is_public = isPublic;
  //   }

  //   const { data: updatedSetting, error } = await supabaseAdmin
  //     .from('app_settings')
  //     .update(updateData)
  //     .eq('key', key)
  //     .select()
  //     .single();

  //   if (error) {
  //     console.error('Erreur lors de la mise à jour du paramètre:', error);
  //     return NextResponse.json(
  //       { message: 'Erreur lors de la mise à jour du paramètre' },
  //       { status: 500 }
  //     );
  //   }

  //   // Log de l'activité
  //   const forwardedFor = request.headers.get('x-forwarded-for');
  //   const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
  //   const userAgent = request.headers.get('user-agent');

  //   await supabaseAdmin.from('activity_logs').insert({
  //     user_id: user.id,
  //     action: 'update',
  //     table_name: 'app_settings',
  //     record_id: updatedSetting.id,
  //     old_values: existingSetting,
  //     new_values: updatedSetting,
  //     ip_address: ipAddress,
  //     user_agent: userAgent
  //   });

  //   return NextResponse.json(updatedSetting);

  // } catch (error) {
  //   console.error('Erreur API PUT /settings/[key]:', error);
  //   return NextResponse.json(
  //     { message: 'Erreur interne du serveur' },
  //     { status: 500 }
  //   );
  // }
}

// DELETE /api/settings/[key] - Supprimer un paramètre (Admin uniquement)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, context: any) {
  // try {
  //   const user = await getCurrentUser();
  //   if (!user) {
  //     return NextResponse.json(
  //       { message: 'Non authentifié' },
  //       { status: 401 }
  //     );
  //   }

  //   const params = await context.params;
  //   const { key } = params;

  //   if (!key) {
  //     return NextResponse.json({ message: 'Clé manquante' }, { status: 400 });
  //   }

  //   const checker = new PermissionChecker(user);
  //   if (!checker.can('create', 'users')) {
  //     return NextResponse.json(
  //       { message: 'Permissions insuffisantes' },
  //       { status: 403 }
  //     );
  //   }

  //   // Vérifier que le paramètre existe
  //   const { data: existingSetting, error: fetchError } = await supabaseAdmin
  //     .from('app_settings')
  //     .select('*')
  //     .eq('key', key)
  //     .single();

  //   if (fetchError || !existingSetting) {
  //     return NextResponse.json(
  //       { message: 'Paramètre non trouvé' },
  //       { status: 404 }
  //     );
  //   }

  //   // Supprimer
  //   const { error } = await supabaseAdmin
  //     .from('app_settings')
  //     .delete()
  //     .eq('key', key);

  //   if (error) {
  //     console.error('Erreur lors de la suppression du paramètre:', error);
  //     return NextResponse.json(
  //       { message: 'Erreur lors de la suppression du paramètre' },
  //       { status: 500 }
  //     );
  //   }

  //   // Log de l'activité
  //   const forwardedFor = request.headers.get('x-forwarded-for');
  //   const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
  //   const userAgent = request.headers.get('user-agent');

  //   await supabaseAdmin.from('activity_logs').insert({
  //     user_id: user.id,
  //     action: 'delete',
  //     table_name: 'app_settings',
  //     record_id: existingSetting.id,
  //     old_values: existingSetting,
  //     ip_address: ipAddress,
  //     user_agent: userAgent
  //   });

  //   return NextResponse.json({ message: 'Paramètre supprimé avec succès' });

  // } catch (error) {
  //   console.error('Erreur API DELETE /settings/[key]:', error);
  //   return NextResponse.json(
  //     { message: 'Erreur interne du serveur' },
  //     { status: 500 }
  //   );
  // }
}
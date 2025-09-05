// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/settings - Récupérer les paramètres de l'application
export async function GET(request: NextRequest) {
  // try {
  //   const user = await getCurrentUser();
  //   if (!user) {
  //     return NextResponse.json(
  //       { message: 'Non authentifié' },
  //       { status: 401 }
  //     );
  //   }

  //   const supabase = createSupabaseServerClient();
  //   const { searchParams } = new URL(request.url);
  //   const category = searchParams.get('category');
  //   const publicOnly = searchParams.get('public') === 'true';
    
  //   const checker = new PermissionChecker(user);
  //   const isAdmin = checker.can('create', 'users'); // Seuls les admins peuvent accéder aux paramètres privés

  //   let query = supabase.from('app_settings').select('*');

  //   // Si pas admin, montrer seulement les paramètres publics
  //   if (!isAdmin || publicOnly) {
  //     query = query.eq('is_public', true);
  //   }

  //   // Filtrer par catégorie si spécifiée
  //   if (category) {
  //     query = query.eq('category', category);
  //   }

  //   const { data: settings, error } = await query.order('category').order('key');

  //   if (error) {
  //     console.error('Erreur lors de la récupération des paramètres:', error);
  //     return NextResponse.json(
  //       { message: 'Erreur lors de la récupération des paramètres' },
  //       { status: 500 }
  //     );
  //   }

  //   // Transformer en objet clé-valeur pour faciliter l'utilisation
  //   const settingsObject = settings.reduce((acc, setting) => {
  //     acc[setting.key] = {
  //       value: setting.value,
  //       category: setting.category,
  //       description: setting.description,
  //       isPublic: setting.is_public,
  //       updatedAt: setting.updated_at
  //     };
  //     return acc;
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   }, {} as Record<string, any>);

  //   return NextResponse.json({
  //     settings: settingsObject,
  //     categories: [...new Set(settings.map(s => s.category))]
  //   });

  // } catch (error) {
  //   console.error('Erreur API GET /settings:', error);
  //   return NextResponse.json(
  //     { message: 'Erreur interne du serveur' },
  //     { status: 500 }
  //   );
  // }
}

// PUT /api/settings - Mettre à jour les paramètres (Admin uniquement)
export async function PUT(request: NextRequest) {
  // try {
  //   const user = await getCurrentUser();
  //   if (!user) {
  //     return NextResponse.json(
  //       { message: 'Non authentifié' },
  //       { status: 401 }
  //     );
  //   }

  //   const checker = new PermissionChecker(user);
  //   if (!checker.can('create', 'users')) {
  //     return NextResponse.json(
  //       { message: 'Permissions insuffisantes' },
  //       { status: 403 }
  //     );
  //   }

  //   const body = await request.json();
  //   const { settings } = body;

  //   if (!settings || typeof settings !== 'object') {
  //     return NextResponse.json(
  //       { message: 'Format de données invalide' },
  //       { status: 400 }
  //     );
  //   }

  //   const forwardedFor = request.headers.get('x-forwarded-for');
  //   const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
  //   const userAgent = request.headers.get('user-agent');

  //   const updatedSettings = [];

  //   // Mettre à jour chaque paramètre
  //   for (const [key, value] of Object.entries(settings)) {
  //     const { data: updatedSetting, error } = await supabaseAdmin
  //       .from('app_settings')
  //       .update({ 
  //         value: value,
  //         updated_at: new Date().toISOString()
  //       })
  //       .eq('key', key)
  //       .select()
  //       .single();

  //     if (error) {
  //       console.error(`Erreur lors de la mise à jour du paramètre ${key}:`, error);
  //       continue;
  //     }

  //     updatedSettings.push(updatedSetting);
  //   }

  //   // Log de l'activité
  //   await supabaseAdmin.from('activity_logs').insert({
  //     user_id: user.id,
  //     action: 'update',
  //     table_name: 'app_settings',
  //     record_id: null,
  //     new_values: { updated_settings: Object.keys(settings) },
  //     ip_address: ipAddress,
  //     user_agent: userAgent
  //   });

  //   return NextResponse.json({
  //     message: 'Paramètres mis à jour avec succès',
  //     updatedCount: updatedSettings.length
  //   });

  // } catch (error) {
  //   console.error('Erreur API PUT /settings:', error);
  //   return NextResponse.json(
  //     { message: 'Erreur interne du serveur' },
  //     { status: 500 }
  //   );
  // }
}

// POST /api/settings - Créer un nouveau paramètre (Admin uniquement)
export async function POST(request: NextRequest) {
  // try {
  //   const user = await getCurrentUser();
  //   if (!user) {
  //     return NextResponse.json(
  //       { message: 'Non authentifié' },
  //       { status: 401 }
  //     );
  //   }

  //   const checker = new PermissionChecker(user);
  //   if (!checker.can('create', 'users')) {
  //     return NextResponse.json(
  //       { message: 'Permissions insuffisantes' },
  //       { status: 403 }
  //     );
  //   }

  //   const body = await request.json();
  //   const { key, value, category, description, isPublic } = body;

  //   if (!key || value === undefined || !category) {
  //     return NextResponse.json(
  //       { message: 'Champs requis manquants (key, value, category)' },
  //       { status: 400 }
  //     );
  //   }

  //   const { data: newSetting, error } = await supabaseAdmin
  //     .from('app_settings')
  //     .insert({
  //       key,
  //       value,
  //       category,
  //       description: description || null,
  //       is_public: isPublic || false,
  //       created_by: user.id
  //     })
  //     .select()
  //     .single();

  //   if (error) {
  //     if (error.code === '23505') { // Contrainte unique violée
  //       return NextResponse.json(
  //         { message: 'Un paramètre avec cette clé existe déjà' },
  //         { status: 409 }
  //       );
  //     }
  //     console.error('Erreur lors de la création du paramètre:', error);
  //     return NextResponse.json(
  //       { message: 'Erreur lors de la création du paramètre' },
  //       { status: 500 }
  //     );
  //   }

  //   return NextResponse.json(newSetting, { status: 201 });

  // } catch (error) {
  //   console.error('Erreur API POST /settings:', error);
  //   return NextResponse.json(
  //     { message: 'Erreur interne du serveur' },
  //     { status: 500 }
  //   );
  // }
}
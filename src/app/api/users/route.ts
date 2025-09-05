// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { profileSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/users - Liste des utilisateurs avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;
    
    // Paramètres de recherche
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let query = supabase
      .from('profiles')
      .select(`
        *,
        clients:client_id (
          id,
          name
        )
      `, { count: 'exact' });

    // Filtrage basé sur le rôle
    if (user.role === 'client') {
      // Les clients ne peuvent voir que leur propre profil
      query = query.eq('id', user.id);
    } else if (user.role === 'technicien') {
      // Les techniciens peuvent voir tous les profils mais pas les admins
      query = query.neq('role', 'admin');
    }
    // Les admins peuvent voir tous les profils

    // Filtres de recherche
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    }
    
    const allowedRoles = ['admin', 'technicien', 'client', 'unverified'] as const;
    type RoleType = typeof allowedRoles[number]; // "admin" | "technicien" | "client" | "unverified"

    const isValidRole = (value: string): value is RoleType => {
    return allowedRoles.includes(value as RoleType);
    };

    if (role && isValidRole(role)) {
    query = query.eq('role', role);
    }


    // Pagination et tri
    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: users,
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0)
    });

  } catch (error) {
    console.error('Erreur API GET /users:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/users - Créer un nouvel utilisateur (Admin uniquement)
export async function POST(request: NextRequest) {
  try {
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

    // Vérifier les permissions - seuls les admins peuvent créer des utilisateurs
    if (!checker.can('create', 'users')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation des données
    const validatedData = profileSchema.parse(body);

    
    // Créer l'utilisateur dans auth.users via l'API admin
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: body.password, // Le mot de passe doit être fourni dans le body
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone,
        company: validatedData.company
      }
    });

    if (authError || !authUser.user) {
      console.error('Erreur lors de la création de l\'utilisateur auth:', authError);
      return NextResponse.json(
        { message: 'Erreur lors de la création de l\'utilisateur' },
        { status: 500 }
      );
    }

    // Créer le profil
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .upsert({
    id: authUser.user.id,
    email: validatedData.email,
    first_name: validatedData.firstName,
    last_name: validatedData.lastName,
    role: validatedData.role || 'client',
    company: validatedData.company,
    phone: validatedData.phone,
    client_id: body.clientId || null
  })
  .select()
  .single();


    if (profileError) {
      // Si la création du profil échoue, supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      console.error('Erreur lors de la création du profil:', profileError);
      return NextResponse.json(
        { message: 'Erreur lors de la création du profil utilisateur' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'create',
      table_name: 'profiles',
      record_id: profile.id,
      new_values: profile,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Créer les paramètres de notification par défaut
    await supabaseAdmin.from('notification_settings').insert({
      user_id: profile.id,
      license_alert_days: [7, 30],
      equipment_alert_days: [30, 90],
      email_enabled: true
    });

    return NextResponse.json(profile, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }

    console.error('Erreur API POST /users:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
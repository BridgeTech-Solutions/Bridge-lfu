import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PermissionChecker } from '@/lib/auth/permissions'
import { getCurrentUser } from '@/lib/auth/server'
import { licenseTypeCreateSchema } from '@/lib/validations'

// GET /api/license-types - Lister les types de licence
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }
    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    // Vérifier les permissions
    if (!checker.can('read', 'licenses')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');

    let query = supabase
      .from('license_types')
      .select('*')
      .order('name');

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des types de licence:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des types de licence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Erreur API GET /license-types:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/license-types - Créer un nouveau type de licence
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }
    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    // Vérifier les permissions
    if (!checker.can('create', 'licenses')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes pour créer un type de licence' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation avec le schéma Zod
    const validationResult = licenseTypeCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Données de validation invalides',
          errors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { name, code, description, is_active } = validationResult.data;

    // Vérifier l'unicité du code
    const { data: existing } = await supabase
      .from('license_types')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: 'Ce code de type existe déjà' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('license_types')
      .insert({
        name,
        code,
        description,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du type de licence:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la création du type de licence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Erreur API POST /license-types:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

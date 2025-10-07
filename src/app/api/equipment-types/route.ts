import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { equipmentTypeCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);
    const { searchParams } = new URL(request.url);

    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 100);
    const offset = (page - 1) * limit;

    const search = searchParams.get('search');
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const onlyActive = searchParams.get('active') === 'true';

    let query = supabase.from('equipment_types').select('*', { count: 'exact' });

    if (!checker.canViewAllData()) {
      query = query.eq('is_active', true);
    } else if (onlyActive || !includeInactive) {
      query = query.eq('is_active', true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération des types équipements:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des types d\'équipement' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data,
      count,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      hasMore: offset + limit < (count ?? 0),
    });
  } catch (error) {
    console.error('Erreur API GET /equipment-types:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const checker = new PermissionChecker(user);
    if (!checker.can('create', 'equipment')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    const payload = await request.json();
    const parsed = equipmentTypeCreateSchema.parse(payload);

    const typeToInsert = {
      name: parsed.name.trim(),
      code: parsed.code.trim().toUpperCase(),
      description: parsed.description?.trim() ?? null,
      icon: parsed.icon?.trim() ?? null,
      is_active: parsed.is_active ?? true,
      created_by: user.id,
    };

    const { data: equipmentType, error } = await supabase
      .from('equipment_types')
      .insert(typeToInsert)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du type équipement:', error);
      const status = error.code === '23505' ? 409 : 500;
      const message = error.code === '23505'
        ? 'Un type avec ce nom ou ce code existe déjà'
        : 'Erreur lors de la création du type d\'équipement';
      return NextResponse.json({ message }, { status });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
    const userAgent = request.headers.get('user-agent');

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'create',
      table_name: 'equipment_types',
      record_id: equipmentType.id,
      new_values: equipmentType,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json(equipmentType, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.flatten() }, { status: 400 });
    }

    console.error('Erreur API POST /equipment-types:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { equipmentTypeUpdateSchema } from '@/lib/validations';

export async function GET(
	request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context : any,
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
		}

		const supabase = createSupabaseServerClient();
		const checker = new PermissionChecker(user);
    const params = await context.params; 
    const { typeId } = params;
		let query = supabase.from('equipment_types').select('*').eq('id', typeId);

		if (!checker.canViewAllData()) {
			query = query.eq('is_active', true);
		}

		const { data, error } = await query.maybeSingle();

		if (error) {
			console.error('Erreur lors de la récupération du type équipement:', error);
			return NextResponse.json(
				{ message: 'Erreur lors de la récupération du type d\'équipement' },
				{ status: 500 },
			);
		}

		if (!data) {
			return NextResponse.json({ message: 'Type introuvable' }, { status: 404 });
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error('Erreur API GET /equipment-types/[id]:', error);
		return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
	}
}

export async function PUT(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context : any,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const checker = new PermissionChecker(user);
    if (!checker.can('update', 'equipment')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    const params = await context.params; // ✅ await nécessaire
    const { typeId } = params;

    const { data: existingType, error: fetchError } = await supabase
      .from('equipment_types')
      .select('*')
      .eq('id', typeId)
      .maybeSingle();

    if (fetchError) {
      console.error('Erreur lors de la récupération du type équipement:', fetchError);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération du type d\'équipement' },
        { status: 500 },
      );
    }

    if (!existingType) {
      return NextResponse.json({ message: 'Type introuvable' }, { status: 404 });
    }

    const payload = await request.json();
    const parsed = equipmentTypeUpdateSchema.parse({ ...payload, id: typeId });

    const updates = {
      ...(parsed.name !== undefined ? { name: parsed.name.trim() } : {}),
      ...(parsed.code !== undefined ? { code: parsed.code.trim().toUpperCase() } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description?.trim() ?? null } : {}),
      ...(parsed.icon !== undefined ? { icon: parsed.icon?.trim() ?? null } : {}),
      ...(parsed.is_active !== undefined ? { is_active: parsed.is_active } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedType, error } = await supabase
      .from('equipment_types')
      .update(updates)
      .eq('id', typeId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du type équipement:', error);
      const status = error.code === '23505' ? 409 : 500;
      const message = error.code === '23505'
        ? 'Un type avec ce nom ou ce code existe déjà'
        : 'Erreur lors de la mise à jour du type d\'équipement';
      return NextResponse.json({ message }, { status });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
    const userAgent = request.headers.get('user-agent');

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'equipment_types',
      record_id: updatedType.id,
      old_values: existingType,
      new_values: updatedType,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json(updatedType);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.flatten() }, { status: 400 });
    }

    console.error('Erreur API PUT /equipment-types/[id]:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context : any,
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const checker = new PermissionChecker(user);
    if (!checker.can('delete', 'equipment')) {
      return NextResponse.json({ message: 'Permissions insuffisantes' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    const params = await context.params; // ✅ await nécessaire
    const { typeId } = params;

    const { data: existingType, error: fetchError } = await supabase
      .from('equipment_types')
      .select('*')
      .eq('id', typeId)
      .maybeSingle();

    if (fetchError) {
      console.error('Erreur lors de la récupération du type équipement:', fetchError);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération du type d\'équipement' },
        { status: 500 },
      );
    }

    if (!existingType) {
      return NextResponse.json({ message: 'Type introuvable' }, { status: 404 });
    }

    if (existingType.is_active) {
      const { error: disableError } = await supabase
        .from('equipment_types')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', typeId);

      if (disableError) {
        console.error('Erreur lors de la désactivation du type équipement:', disableError);
        return NextResponse.json(
          { message: 'Erreur lors de la désactivation du type d\'équipement' },
          { status: 500 },
        );
      }
    } else {
      const { error: deleteError } = await supabase
        .from('equipment_types')
        .delete()
        .eq('id', typeId);

      if (deleteError) {
        console.error('Erreur lors de la suppression du type équipement:', deleteError);
        return NextResponse.json(
          { message: 'Erreur lors de la suppression du type d\'équipement' },
          { status: 500 },
        );
      }
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
    const userAgent = request.headers.get('user-agent');

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'equipment_types',
      record_id: existingType.id,
      old_values: existingType,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({ message: 'Type d\'équipement désactivé avec succès' });
  } catch (error) {
    console.error('Erreur API DELETE /equipment-types/[id]:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

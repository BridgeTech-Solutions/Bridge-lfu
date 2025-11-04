import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PermissionChecker } from '@/lib/auth/permissions'
import { getCurrentUser } from '@/lib/auth/server'
import { licenseTypeUpdateSchema } from '@/lib/validations'

// PUT /api/license-types/[id] - Modifier un type de licence
export async function PUT(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  context: any, // Nécessaire pour la signature Next.js mais non utilisé dans PUT
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }
    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    // Vérifier les permissions
    if (!checker.can('update', 'licenses')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes pour modifier un type de licence' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validation avec le schéma Zod
    const validationResult = licenseTypeUpdateSchema.safeParse(body);
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

    const { id: schemaId, name, code, description, is_active } = validationResult.data;

    // Vérifier l'unicité du code (sauf pour le type actuel)
    const { data: existing } = await supabase
      .from('license_types')
      .select('id')
      .eq('code', code)
      .neq('id', schemaId)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: 'Ce code de type existe déjà' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('license_types')
      .update({
        name,
        code,
        description,
        is_active,
      })
      .eq('id', schemaId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la modification du type de licence:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la modification du type de licence' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: 'Type de licence non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Erreur API PUT /license-types/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/license-types/[id] - Supprimer un type de licence
export async function DELETE(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,) {
  try {
    const user = await getCurrentUser()
    const params = await context.params
    const { id } = params
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }
    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    // Vérifier les permissions
    if (!checker.can('delete', 'licenses')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes pour supprimer un type de licence' },
        { status: 403 }
      );
    }

    // Vérifier si le type est utilisé par des licences
    const { data: licenses } = await supabase
      .from('licenses')
      .select('id')
      .eq('type_id',id)
      .limit(1);

    if (licenses && licenses.length > 0) {
      return NextResponse.json(
        { message: 'Impossible de supprimer ce type car il est utilisé par des licences' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('license_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la suppression du type de licence:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la suppression du type de licence' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Type de licence supprimé avec succès' });
  } catch (error) {
    console.error('Erreur API DELETE /license-types/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

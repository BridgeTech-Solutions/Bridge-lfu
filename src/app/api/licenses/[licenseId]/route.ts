// app/api/licenses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { licenseSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// interface Params {
//   params: { id: string }
// }

// GET /api/licenses/[id] - Récupérer une licence par ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest,  context : any) {
  try {
    const user = await getCurrentUser();
        const params = await context.params; // ✅ await nécessaire
     const { licenseId } = params;
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    let query = supabase
      .from('v_licenses_with_client')
      .select('*')
      .eq('id', licenseId);

    // Filtrage basé sur le rôle
    if (!checker.can('create', 'licenses') && user.client_id) {
      query = query.eq('client_id', user.client_id);
    }


    const { data: license, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Licence non trouvée' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Erreur lors de la récupération de la licence' },
        { status: 500 }
      );
    }

    // Vérifier les permissions pour cette licence spécifique
    if (!checker.can('read', 'licenses', license)) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { data: licenseMeta } = await supabase
      .from('licenses')
      .select('supplier_id')
      .eq('id', licenseId)
      .maybeSingle();

    let supplierName: string | null = null;
    if (licenseMeta?.supplier_id) {
      const { data: supplierData } = await supabase
        .from('license_suppliers')
        .select('name')
        .eq('id', licenseMeta.supplier_id)
        .maybeSingle();
      supplierName = supplierData?.name ?? null;
    }

    const responseData = {
      ...license,
      supplier_id: licenseMeta?.supplier_id ?? null,
      supplier_name: supplierName,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Erreur API GET /licenses/[licenseid]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/licenses/[id] - Mettre à jour une licence
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest,  context : any) {
  try {
    const user = await getCurrentUser();
        const params = await context.params; // ✅ await nécessaire
     const { licenseId } = params;
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
    const supabase = createSupabaseServerClient();

    // Récupérer la licence existante
    const { data: existingLicense, error: fetchError } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (fetchError || !existingLicense) {
      return NextResponse.json(
        { message: 'Licence non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (!checker.can('update', 'licenses', existingLicense)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = licenseSchema.parse(body);

    // Vérifier que le client existe et que l'utilisateur y a accès
    if (!checker.canAccessClient(validatedData.clientId)) {
      return NextResponse.json(
        { message: 'Accès non autorisé à ce client' },
        { status: 403 }
      );
    }

    // Mettre à jour la licence
    const { data: updatedLicense, error: updateError } = await supabase
      .from('licenses')
      .update({
        name: validatedData.name,
        editor: validatedData.editor,
        version: validatedData.version,
        license_key: validatedData.licenseKey,
        purchase_date: validatedData.purchaseDate,
        expiry_date: validatedData.expiryDate,
        cost: validatedData.cost,
        client_id: validatedData.clientId,
        description: validatedData.description,
        supplier_id: validatedData.supplierId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', licenseId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour de la licence:', updateError);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour de la licence' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'licenses',
      record_id: updatedLicense.id,
      old_values: existingLicense,
      new_values: updatedLicense,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return NextResponse.json(updatedLicense);

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }

    console.error('Erreur API PUT /licenses/[licenseId]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/licenses/[id] - Supprimer une licence
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest,  context : any) {
  try {
    const user = await getCurrentUser();
    const params = await context.params; // ✅ await nécessaire
     const { licenseId } = params;
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
    const supabase = createSupabaseServerClient();

    // Récupérer la licence existante
    const { data: existingLicense, error: fetchError } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (fetchError || !existingLicense) {
      return NextResponse.json(
        { message: 'Licence non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (!checker.can('delete', 'licenses', existingLicense)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer la licence (les attachments seront supprimés automatiquement via CASCADE)
    const { error: deleteError } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId);

    if (deleteError) {
      console.error('Erreur lors de la suppression de la licence:', deleteError);
      return NextResponse.json(
        { message: 'Erreur lors de la suppression de la licence' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'licenses',
      record_id: existingLicense.id,
      old_values: existingLicense,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    return NextResponse.json({ message: 'Licence supprimée avec succès' });

  } catch (error) {
    console.error('Erreur API DELETE /licenses/[licenseId]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
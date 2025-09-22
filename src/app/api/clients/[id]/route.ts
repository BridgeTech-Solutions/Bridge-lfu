import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // ✅ Utilisez le client serveur
import { clientSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions'; // Ajustez le chemin si nécessaire
import { Client } from '@/types';
import { TablesUpdate } from '@/types/database';

// GET /api/clients/[id] - Récupérer un client par ID
export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
   context : any
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }
    const checker = new PermissionChecker(user);
    if (!checker.canAccessClient(id)) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    const supabase = createSupabaseServerClient();
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Client non trouvé' },
          { status: 404 }
        );
      }
      console.error('Erreur lors de la récupération du client:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération du client' },
        { status: 500 }
      );
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error('Erreur API GET /clients/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Modifier un client
export async function PUT(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
   context   : any
) {
  try {
        const { id } = await context.params;

    // ✅ CORRECTION : Accédez à params.id directement
    const clientId = id;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
     const userAgent = request.headers.get('user-agent');

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }
    const checker = new PermissionChecker(user);
    if (!checker.can('update', 'clients')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }
    const supabase = createSupabaseServerClient();
    const { data: oldClient, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Client non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Erreur lors de la récupération du client' },
        { status: 500 }
      );
    }
    const body = await request.json();
    const validatedData = clientSchema.parse(body);
    // ✅ Alternative: Use type assertion if TablesUpdate doesn't work
    const updateData = {
      name: validatedData.name,
      address: validatedData.address,
      city: validatedData.city,
      postal_code: validatedData.postalCode,
      country: validatedData.country,
      contact_email: validatedData.contactEmail,
      contact_phone: validatedData.contactPhone,
      contact_person: validatedData.contactPerson,
      sector: validatedData.sector,
      updated_at: new Date().toISOString()
    } as const;
    
    // Mappez explicitement les champs en snake_case
    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la modification du client:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la modification du client' },
        { status: 500 }
      );
    }
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update',
      table_name: 'clients',
      record_id: client.id,
      old_values: oldClient,
      new_values: client,
      ip_address: ipAddress,
      user_agent: userAgent      
    });
    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }
    console.error('Erreur API PUT /clients/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Supprimer un client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE( request: NextRequest, context  : any 
) {
  try {
        const { id } = await context.params;

    const clientId = id;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
     const userAgent = request.headers.get('user-agent');
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }
    const checker = new PermissionChecker(user);
    if (!checker.can('delete', 'clients')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }
    const supabase = createSupabaseServerClient();
    const [licensesResult, equipmentResult] = await Promise.all([
      supabase.from('licenses').select('id').eq('client_id', clientId).limit(1),
      supabase.from('equipment').select('id').eq('client_id', clientId).limit(1)
    ]);
    if (licensesResult.data && licensesResult.data.length > 0) {
      return NextResponse.json(
        { message: 'Impossible de supprimer ce client : des licences lui sont associées' },
        { status: 400 }
      );
    }
    if (equipmentResult.data && equipmentResult.data.length > 0) {
      return NextResponse.json(
        { message: 'Impossible de supprimer ce client : des équipements lui sont associés' },
        { status: 400 }
      );
    }
    const { data: clientToDelete, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Client non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Erreur lors de la récupération du client' },
        { status: 500 }
      );
    }
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);
    if (error) {
      console.error('Erreur lors de la suppression du client:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la suppression du client' },
        { status: 500 }
      );
    }
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete',
      table_name: 'clients',
      record_id: clientId,
      old_values: clientToDelete,
      ip_address: ipAddress,
      user_agent: userAgent
    });
    return NextResponse.json(
      { message: 'Client supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur API DELETE /clients/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
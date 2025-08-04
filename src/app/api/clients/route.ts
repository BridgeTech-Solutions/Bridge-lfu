import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clientSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions'; // Ajustez le chemin si nécessaire
// GET /api/clients - Liste des clients avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;
    
    // Paramètres de recherche
    const search = searchParams.get('search');
    const sector = searchParams.get('sector');

    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' });

    // Filtrage basé sur le rôle
    if (user.role === 'client' && user.client_id) {
      query = query.eq('id', user.client_id);
    }

    // Filtres de recherche
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (sector) {
      query = query.eq('sector', sector);
    }

    // Pagination et tri
    const { data: clients, count, error } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des clients' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: clients,
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0)
    });

  } catch (error) {
    console.error('Erreur API GET /clients:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Créer un nouveau client
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

    // Vérifier les permissions
    if (!checker.can('create', 'clients')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation des données
    const validatedData = clientSchema.parse(body);

    const supabase = createSupabaseServerClient();
    
    // ✅ MODIFICATION ICI : Mapper les noms de champs vers les noms de colonnes Supabase
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: validatedData.name,
        address: validatedData.address,
        city: validatedData.city,
        postal_code: validatedData.postalCode, 
        country: validatedData.country,
        contact_email: validatedData.contactEmail, 
        contact_phone: validatedData.contactPhone, 
        contact_person: validatedData.contactPerson, 
        sector: validatedData.sector,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du client:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la création du client' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'create',
      table_name: 'clients',
      record_id: client.id,
      new_values: client,
      ip_address: ipAddress,
      user_agent: userAgent   
    });

    return NextResponse.json(client, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }

    console.error('Erreur API POST /clients:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { licenseSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

/**
 * GET /api/licenses - List licenses with filters and pagination
 * @param {NextRequest} request - The request object
 * @returns {Promise<NextResponse>} Paginated licenses list or error
 */
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
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const editor = searchParams.get('editor');
    const typeId = searchParams.get('type_id');
    const expiryDateStart = searchParams.get('expiry_date_start');
    const expiryDateEnd = searchParams.get('expiry_date_end');

    let query = supabase
      .from('v_licenses_with_client')
      .select('*', { count: 'exact' });

    // Filtrage basé sur le rôle
    if (user.role === 'client' && user.client_id) {
      query = query.eq('client_id', user.client_id);
    }

    // Filtres de recherche
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const allowedStatuses = ['active', 'expired', 'about_to_expire', 'cancelled'] as const;
    type StatusType = typeof allowedStatuses[number]; // "active" | "expired" | "about_to_expire" | "cancelled"

    if (status && allowedStatuses.includes(status as StatusType)) {
      query = query.eq('status', status as StatusType);
    }


    if (editor) {
      query = query.ilike('editor', `%${editor}%`);
    }

    if (typeId) {
      query = query.eq('type_id', typeId);
    }

    if (expiryDateStart) {
      query = query.gte('expiry_date', expiryDateStart);
    }

    if (expiryDateEnd) {
      query = query.lte('expiry_date', expiryDateEnd);
    }

    // Pagination et tri
    const { data: licenses, count, error } = await query
      .order('expiry_date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération des licences:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des licences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: licenses,
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0)
    });

  } catch (error) {
    console.error('Erreur API GET /licenses:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/licenses - Créer une nouvelle licence
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
    if (!checker.can('create', 'licenses')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation des données
    const validatedData = licenseSchema.parse(body);

    const supabase = createSupabaseServerClient();
    
    // Vérifier que le client existe et que l'utilisateur y a accès
    if (!checker.canAccessClient(validatedData.clientId)) {
      return NextResponse.json(
        { message: 'Accès non autorisé à ce client' },
        { status: 403 }
      );
    }

    // Créer la licence
    const { data: license, error } = await supabase
      .from('licenses')
      .insert({
        name: validatedData.name,
        editor: validatedData.editor,
        version: validatedData.version,
        license_key: validatedData.licenseKey,
        purchase_date: validatedData.purchaseDate,
        expiry_date: validatedData.expiryDate,
        cost: validatedData.cost,
        client_id: validatedData.clientId,
        type_id: validatedData.typeId || null,
        supplier_id: validatedData.supplierId || null,
        description: validatedData.description,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la licence:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la création de la licence' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'create',
      table_name: 'licenses',
      record_id: license.id,
      new_values: license,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Créer une notification si la licence expire bientôt
    const expiryDate = new Date(validatedData.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 30) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'license_expiry',
        title: 'Licence bientôt expirée',
        message: `La licence "${license.name}" expire dans ${daysUntilExpiry} jours`,
        related_id: license.id,
        related_type: 'license'
      });
    }

    return NextResponse.json(license, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }

    console.error('Erreur API POST /licenses:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
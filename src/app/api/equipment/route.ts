import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { equipmentSchema } from '@/lib/validations';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { ZodError } from 'zod';


// GET /api/equipment - Liste des équipements avec pagination et filtres
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
    const typeId = searchParams.get('type_id');
    const typeCode = searchParams.get('type_code');
    const typeLegacy = searchParams.get('type');
    const status = searchParams.get('status');
    const brand = searchParams.get('brand');

    let query = supabase
      .from('v_equipment_with_client')
      .select('*', { count: 'exact' });

    // Filtrage basé sur le rôle
    if (user.role === 'client' && user.client_id) {
      query = query.eq('client_id', user.client_id);
    }

    // Filtres de recherche
    if (search) {
      query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (typeId) {
      query = query.eq('type_id', typeId);
    } else if (typeCode) {
      query = query.eq('type_code', typeCode);
    } else if (typeLegacy) {
      query = query.ilike('type_code', `%${typeLegacy}%`);
    }

    const allowedStatuses = ['actif', 'en_maintenance', 'bientot_obsolete', 'obsolete', 'retire'] as const;
    type EquipmentStatus = typeof allowedStatuses[number];

    if (status && allowedStatuses.includes(status as EquipmentStatus)) {
      query = query.eq('status', status as EquipmentStatus);
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }
    // Pagination et tri
    const { data: equipment, count, error } = await query
      .order('estimated_obsolescence_date', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération des équipements:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des équipements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: equipment,
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0)
    });

  } catch (error) {
    console.error('Erreur API GET /equipment:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/equipment - Créer un nouvel équipement
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
    if (!checker.can('create', 'equipment')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
        console.log('Corps de la requête:', body); // Debug

    // Validation des données
    const validatedData = equipmentSchema.parse(body);

    const supabase = createSupabaseServerClient();

    // Résoudre le type_id si seulement type_code est fourni
    let resolvedTypeId = validatedData.type_id ?? null;

    if (!resolvedTypeId && validatedData.type_code) {
      const { data: typeMatch, error: typeError } = await supabase
        .from('equipment_types')
        .select('id, is_active')
        .eq('code', validatedData.type_code)
        .maybeSingle();

      if (typeError || !typeMatch) {
        return NextResponse.json(
          { message: "Type d'équipement introuvable" },
          { status: 400 }
        );
      }

      if (typeMatch.is_active === false) {
        return NextResponse.json(
          { message: "Ce type d'équipement est inactif" },
          { status: 400 }
        );
      }

      resolvedTypeId = typeMatch.id;
    }

    if (!resolvedTypeId && validatedData.type) {
      const { data: legacyType, error: legacyError } = await supabase
        .from('equipment_types')
        .select('id, is_active')
        .eq('code', validatedData.type.toUpperCase())
        .maybeSingle();

      if (legacyError || !legacyType) {
        return NextResponse.json(
          { message: "Type d'équipement invalide" },
          { status: 400 }
        );
      }

      if (legacyType.is_active === false) {
        return NextResponse.json(
          { message: "Ce type d'équipement est inactif" },
          { status: 400 }
        );
      }

      resolvedTypeId = legacyType.id;
    }

    if (!resolvedTypeId) {
      return NextResponse.json(
        { message: "Type d'équipement requis" },
        { status: 400 }
      );
    }
    console.log('Données validées:', validatedData); // Debug

    // Vérifier que le client existe et que l'utilisateur y a accès
    if (!checker.canAccessClient(validatedData.client_id)) {
      return NextResponse.json(
        { message: 'Accès non autorisé à ce client' },
        { status: 403 }
      );
    }

    // Créer l'équipement
    const { data: equipment, error } = await supabase
      .from('equipment')
      .insert({
        name: validatedData.name,
        type_id: resolvedTypeId,
        brand: validatedData.brand,
        model: validatedData.model,
        serial_number: validatedData.serial_number,
        purchase_date: validatedData.purchase_date,
        estimated_obsolescence_date: validatedData.estimated_obsolescence_date,
        end_of_sale: validatedData.end_of_sale,
        cost: validatedData.cost,
        client_id: validatedData.client_id,
        location: validatedData.location,
        description: validatedData.description,
        warranty_end_date: validatedData.warranty_end_date,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'équipement:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la création de l\'équipement' },
        { status: 500 }
      );
    }

    // Log de l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'create',
      table_name: 'equipment',
      record_id: equipment.id,
      new_values: equipment,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // Créer une notification si l'équipement est bientôt obsolète
    if (validatedData.estimated_obsolescence_date) {
      const obsolescenceDate = new Date(validatedData.estimated_obsolescence_date);
      const daysUntilObsolescence = Math.ceil((obsolescenceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilObsolescence <= 90 && daysUntilObsolescence > 0) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'equipment_obsolescence',
          title: 'Équipement bientôt obsolète',
          message: `L'équipement "${equipment.name}" sera obsolète dans ${daysUntilObsolescence} jours`,
          related_id: equipment.id,
          related_type: 'equipment'
        });
      }
    }

    return NextResponse.json(equipment, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Données invalides', errors: error },
        { status: 400 }
      );
    }

    console.error('Erreur API POST /equipment:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
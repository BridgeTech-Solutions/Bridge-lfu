// app/api/reports/equipment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/reports/equipment - Génération de rapport des équipements
export async function GET(request: NextRequest) {
  type AssetType = "pc" | "serveur" | "routeur" | "switch" | "imprimante" | "autre";
  type AssetStatus = "actif" | "en_maintenance" | "obsolete" | "bientot_obsolete" | "retire";

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);
    
    if (!checker.can('read', 'reports')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const format = searchParams.get('format') || 'json';

    let query = supabase.from('v_equipment_with_client').select('*');

    // Filtrage par permissions
    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    }


    if (status) {
      // Use a type assertion again
      query = query.eq('status', status as AssetStatus);
    }
    if (type) {
      // Use a type assertion to fix the error
      query = query.eq('type', type as AssetType);
    }

    const { data: equipment, error } = await query.order('estimated_obsolescence_date', { 
      ascending: true, 
      nullsFirst: false 
    });

    if (error) {
      console.error('Erreur lors de la génération du rapport équipements:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la génération du rapport' },
        { status: 500 }
      );
    }

    if (format === 'csv') {
      // Génération CSV
      const csvHeaders = [
        'Nom',
        'Type',
        'Marque',
        'Modèle',
        'Client',
        'Statut',
        'Date d\'obsolescence estimée',
        'Fin de commercialisation',
        'Jours jusqu\'à obsolescence'
      ];

      const csvRows = equipment?.map(item => [
        item.name || '',
        item.type || '',
        item.brand || '',
        item.model || '',
        item.client_name || '',
        item.status || '',
        item.estimated_obsolescence_date || '',
        item.end_of_sale || '',
        item.estimated_obsolescence_date ? 
          Math.ceil((new Date(item.estimated_obsolescence_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : ''
      ]) || [];

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="rapport_equipements.csv"'
        }
      });
    }

    // Format JSON par défaut
    const reportData = equipment?.map(item => ({
      equipment_name: item.name,
      type: item.type,
      brand: item.brand,
      model: item.model,
      client_name: item.client_name,
      status: item.status,
      obsolescence_date: item.estimated_obsolescence_date,
      end_of_sale: item.end_of_sale,
      days_until_obsolescence: item.estimated_obsolescence_date ? 
        Math.ceil((new Date(item.estimated_obsolescence_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      days_until_end_of_sale: item.end_of_sale ?
        Math.ceil((new Date(item.end_of_sale).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
    })) || [];

    return NextResponse.json({
      title: 'Rapport des Équipements',
      generated_at: new Date().toISOString(),
      total_count: reportData.length,
      data: reportData
    });

  } catch (error) {
    console.error('Erreur API GET /reports/equipment:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
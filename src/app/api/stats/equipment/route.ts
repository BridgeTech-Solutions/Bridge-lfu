// app/api/stats/equipment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/stats/equipment - Statistiques des équipements
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
    const checker = new PermissionChecker(user);

    let query = supabase.from('equipment').select('type, status, client_id');

    // Filtrage par permissions
    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id);
    }

    const { data: equipment, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des statistiques équipements:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des statistiques' },
        { status: 500 }
      );
    }

    const validEquipment = equipment?.filter(item => item.type && item.status) || [];

    if (validEquipment.length === 0) {
      return NextResponse.json({
        total: 0,
        by_type: {},
        by_status: {},
        chart_data: { types: [], statuses: [] }
      });
    }

    // Statistiques par type
    const typeStats = validEquipment.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Statistiques par statut
    const statusStats = validEquipment.reduce((acc, item) => {
      acc[item.status!] = (acc[item.status!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Données pour les graphiques
    const chartData = {
      types: Object.entries(typeStats).map(([type, count]) => ({
        name: type,
        value: count,
        percentage: Math.round((count / validEquipment.length) * 100)
      })),
      statuses: Object.entries(statusStats).map(([status, count]) => ({
        name: status,
        value: count,
        percentage: Math.round((count / validEquipment.length) * 100)
      }))
    };

    return NextResponse.json({
      total: validEquipment.length,
      by_type: typeStats,
      by_status: statusStats,
      chart_data: chartData
    });

  } catch (error) {
    console.error('Erreur API GET /stats/equipment:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

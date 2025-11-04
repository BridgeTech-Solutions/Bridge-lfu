// app/api/stats/licenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/stats/licenses - Statistiques des licences
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
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const typeId = searchParams.get('type_id');

    // Vérifier les permissions si un client spécifique est demandé
    if (clientId && !checker.canViewAllData() && clientId !== user.client_id) {
      return NextResponse.json(
        { message: 'Vous ne pouvez pas accéder aux statistiques d\'un autre client' },
        { status: 403 }
      );
    }

    let query = supabase.from('v_licenses_with_client').select('status, expiry_date, cost, client_id, type_id');

    // Filtrage par permissions et clientId
    if (!checker.canViewAllData() && user.client_id) {
      query = query.eq('client_id', user.client_id);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (typeId) {
      query = query.eq('type_id', typeId);
    }

    const { data: licenses, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des statistiques licences:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des statistiques' },
        { status: 500 }
      );
    }

    const validLicenses = licenses?.filter(license => 
      license.status && license.expiry_date
    ) || [];

    if (validLicenses.length === 0) {
      return NextResponse.json({
        total: 0,
        by_status: {},
        total_value: 0,
        monthly_expiry: [],
        chart_data: { statuses: [], expiry: [] }
      });
    }

    // Statistiques par statut
    const statusStats = validLicenses.reduce((acc, item) => {
      acc[item.status!] = (acc[item.status!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Expirations par mois (6 mois à venir)
    const monthlyExpiry = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
      
      const count = validLicenses.filter(license => {
        if (!license.expiry_date) return false;
        const expiryDate = new Date(license.expiry_date);
        return expiryDate.getMonth() === date.getMonth() &&
               expiryDate.getFullYear() === date.getFullYear();
      }).length;

      return { month: monthKey, count };
    });

    // Valeur totale
    const totalValue = validLicenses.reduce((sum, license) => sum + (license.cost || 0), 0);

    // Données pour les graphiques
    const chartData = {
      statuses: Object.entries(statusStats).map(([status, count]) => ({
        name: status,
        value: count,
        percentage: Math.round((count / validLicenses.length) * 100)
      })),
      expiry: monthlyExpiry.filter(item => item.count > 0)
    };

    return NextResponse.json({
      total: validLicenses.length,
      by_status: statusStats,
      total_value: totalValue,
      monthly_expiry: monthlyExpiry,
      chart_data: chartData
    });

  } catch (error) {
    console.error('Erreur API GET /stats/licenses:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
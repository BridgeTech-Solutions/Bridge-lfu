// app/api/dashboard/route.ts - Version optimisée
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { Database } from '@/types/database';

type LicenseStatusRow = Pick<Database['public']['Tables']['licenses']['Row'], 'status'>
type EquipmentStatusRow = Pick<Database['public']['Tables']['equipment']['Row'], 'status'>
type LicenseDateRow = Pick<Database['public']['Tables']['licenses']['Row'], 'expiry_date' | 'status'>
type EquipmentDateRow = Pick<Database['public']['Tables']['equipment']['Row'], 'estimated_obsolescence_date' | 'status'>

interface DashboardStats {
  total_clients: number
  total_licenses: number
  total_equipment: number
  expired_licenses: number
  about_to_expire_licenses: number
  obsolete_equipment: number
  soon_obsolete_equipment: number
}

interface DashboardAlert {
  id: string
  item_name: string
  client_name?: string
  type: string
  alert_type: string
  alert_level: string
  alert_date: string
  status: string
  client_id?: string
}

/**
 * GET /api/dashboard - Get dashboard statistics and alerts
 * @param {NextRequest} request - The request object with optional clientId query parameter
 * @returns {Promise<NextResponse>} Dashboard data with stats and alerts or error
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);

    // Vérifier les permissions si un client spécifique est demandé
    if (clientId && !checker.canViewAllData() && clientId !== user.client_id) {
      return NextResponse.json(
        { message: 'Vous ne pouvez pas accéder aux données d\'un autre client' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();
    const alertsView = checker.canViewAllData() ? 'v_dashboard_alerts' : 'v_client_dashboard';
    let alertsQuery = supabase.from(alertsView).select('*');

    // Filtrer par client si nécessaire
    if (!checker.canViewAllData() && user.client_id) {
      alertsQuery = alertsQuery.eq('client_id', user.client_id);
    } else if (clientId) {
      alertsQuery = alertsQuery.eq('client_id', clientId);
    }

    // Récupérer les alertes (limitées aux 15 plus urgentes)
    const { data: rawAlerts, error: alertsError } = await alertsQuery
      .order('alert_date', { ascending: true })
      .limit(15);

    if (alertsError) {
      console.error('Erreur lors de la récupération des alertes:', alertsError);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des alertes' },
        { status: 500 }
      );
    }

    // Validation et nettoyage des alertes
    const alerts: DashboardAlert[] = (rawAlerts || [])
      .filter(alert => 
        alert && 
        alert.id && 
        alert.item_name && 
        alert.alert_type && 
        alert.alert_level && 
        alert.status
      )
      .map(alert => ({
        id: alert.id,
        item_name: alert.item_name,
        client_name: alert.client_name || undefined,
        type: alert.type || 'unknown',
        alert_type: alert.alert_type,
        alert_level: alert.alert_level,
        alert_date: alert.alert_date,
        status: alert.status,
        client_id: alert.client_id || undefined
      }));

    // === RÉCUPÉRATION DES STATISTIQUES ===
    let stats: DashboardStats;

    if (checker.canViewAllData()) {
      // Statistiques globales pour admin/technicien
      try {
        let clientsQuery = supabase.from('clients').select('*', { count: 'exact', head: true });
        let licensesQuery = supabase.from('licenses').select('status');
        let equipmentQuery = supabase.from('equipment').select('status');

        if (clientId) {
          // Filtrer tous les éléments par client_id
          clientsQuery = clientsQuery.eq('id', clientId);
          licensesQuery = licensesQuery.eq('client_id', clientId);
          equipmentQuery = equipmentQuery.eq('client_id', clientId);
        }

        const [clientsRes, licensesRes, equipmentRes] = await Promise.allSettled([
          clientsQuery,
          licensesQuery,
          equipmentQuery
        ]);

        // Gestion des résultats avec fallback
        const clientsCount = clientsRes.status === 'fulfilled' ? (clientsRes.value.count || 0) : 0;
        const licenses = (licensesRes.status === 'fulfilled' ? licensesRes.value.data : []) as LicenseStatusRow[] || [];
        const equipment = (equipmentRes.status === 'fulfilled' ? equipmentRes.value.data : []) as EquipmentStatusRow[] || [];

        stats = {
          total_clients: clientsCount,
          total_licenses: licenses.length,
          total_equipment: equipment.length,
          expired_licenses: licenses.filter(l => l.status === 'expired').length,
          about_to_expire_licenses: licenses.filter(l => l.status === 'about_to_expire').length,
          obsolete_equipment: equipment.filter(e => e.status === 'obsolete').length,
          soon_obsolete_equipment: equipment.filter(e => e.status === 'bientot_obsolete').length
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques globales:', error);
        // Statistiques par défaut en cas d'erreur
        stats = {
          total_clients: 0,
          total_licenses: 0,
          total_equipment: 0,
          expired_licenses: 0,
          about_to_expire_licenses: 0,
          obsolete_equipment: 0,
          soon_obsolete_equipment: 0
        };
      }
    } else {
      // Statistiques limitées au client connecté
      if (!user.client_id) {
        return NextResponse.json(
          { message: 'Client non défini pour cet utilisateur' },
          { status: 400 }
        );
      }

      const targetClientId = clientId || user.client_id;

      try {
        const [licensesRes, equipmentRes] = await Promise.allSettled([
          supabase.from('licenses').select('status').eq('client_id', targetClientId),
          supabase.from('equipment').select('status').eq('client_id', targetClientId)
        ]);

        // Gestion des résultats avec fallback
        const licenses = (licensesRes.status === 'fulfilled' ? licensesRes.value.data : []) as LicenseStatusRow[] || [];
        const equipment = (equipmentRes.status === 'fulfilled' ? equipmentRes.value.data : []) as EquipmentStatusRow[] || [];

        stats = {
          total_clients: 1, // Le client ne voit que son propre compte
          total_licenses: licenses.length,
          total_equipment: equipment.length,
          expired_licenses: licenses.filter(l => l.status === 'expired').length,
          about_to_expire_licenses: licenses.filter(l => l.status === 'about_to_expire').length,
          obsolete_equipment: equipment.filter(e => e.status === 'obsolete').length,
          soon_obsolete_equipment: equipment.filter(e => e.status === 'bientot_obsolete').length
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques client:', error);
        // Statistiques par défaut en cas d'erreur
        stats = {
          total_clients: 1,
          total_licenses: 0,
          total_equipment: 0,
          expired_licenses: 0,
          about_to_expire_licenses: 0,
          obsolete_equipment: 0,
          soon_obsolete_equipment: 0
        };
      }
    }

    // === ENRICHISSEMENT DES DONNÉES ===
    const enrichedResponse = {
      stats,
      alerts,
      metadata: {
        alerts_count: alerts.length,
        critical_alerts: alerts.filter(a => a.alert_level === 'expired' || a.alert_level === 'urgent').length,
        warning_alerts: alerts.filter(a => a.alert_level === 'warning').length,
        user_role: user.role,
        can_view_all_data: checker.canViewAllData(),
        client_id: user.client_id,
        last_updated: new Date().toISOString()
      }
    };

    // === HEADERS DE CACHE ===
    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return NextResponse.json(enrichedResponse, { headers });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error : any) {
    console.error('Erreur API GET /dashboard:', error);
    
    // Retourner une réponse d'erreur structurée
    const errorResponse = {
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Optionnel : Endpoint POST pour forcer le rafraîchissement des statistiques
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);
    
    // Seuls les admins peuvent forcer le rafraîchissement
    if (!checker.can('manage', 'system_settings')) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Forcer la mise à jour des statuts
    const { data: licenseUpdates } = await supabase.rpc('refresh_all_license_status');
    const { data: equipmentUpdates } = await supabase.rpc('refresh_all_equipment_status');

    return NextResponse.json({
      message: 'Rafraîchissement effectué avec succès',
      updates: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        licenses: licenseUpdates?.filter((update: { updated: any; }) => update.updated).length || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        equipment: equipmentUpdates?.filter((update: { updated: any; }) => update.updated).length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API POST /dashboard:', error);
    return NextResponse.json(
      { message: 'Erreur lors du rafraîchissement' },
      { status: 500 }
    );
  }
}
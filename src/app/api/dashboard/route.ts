
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';
import { Database } from '@/types/database';

// GET /api/dashboard - Récupérer les données du tableau de bord
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

    // Déterminer la vue à utiliser selon les permissions
    const alertsView = checker.canViewAllData() ? 'v_dashboard_alerts' : 'v_client_dashboard';
    
    let alertsQuery = supabase.from(alertsView).select('*');

    // Filtrer par client si l'utilisateur est un client
    if (!checker.canViewAllData() && user.client_id) {
      alertsQuery = alertsQuery.eq('client_id', user.client_id);
    }

    // Récupérer les alertes (limitées aux 10 plus urgentes)
    const { data: alerts, error: alertsError } = await alertsQuery
      .order('alert_date', { ascending: true })
      .limit(10);

    if (alertsError) {
      console.error('Erreur lors de la récupération des alertes:', alertsError);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des alertes' },
        { status: 500 }
      );
    }

    // Récupérer les statistiques selon les permissions
    let stats;
    
    if (checker.canViewAllData()) {
      // Statistiques globales pour admin/technicien
      const [clientsRes, licensesRes, equipmentRes] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('licenses').select('status'),
        supabase.from('equipment').select('status')
      ]);
      type LicenseStatusRow = Pick<Database['public']['Tables']['licenses']['Row'], 'status'>
      type EquipmentStatusRow = Pick<Database['public']['Tables']['equipment']['Row'], 'status'>
      const clientsCount = clientsRes.count || 0;
      const licenses = (licensesRes.data ?? []) as LicenseStatusRow[]
      const equipment = (equipmentRes.data ?? []) as EquipmentStatusRow[]

      stats = {
        total_clients: clientsCount,
        total_licenses: licenses.length,
        total_equipment: equipment.length,
        expired_licenses: licenses.filter(l => l.status === 'expired').length,
        about_to_expire_licenses: licenses.filter(l => l.status === 'about_to_expire').length,
        obsolete_equipment: equipment.filter(e => e.status === 'obsolete').length,
        soon_obsolete_equipment: equipment.filter(e => e.status === 'bientot_obsolete').length
      };
    } else {
      // Statistiques limitées au client connecté
      if (!user.client_id) {
        return NextResponse.json(
          { message: 'Client non défini pour cet utilisateur' },
          { status: 400 }
        );
      }

      const [licensesRes, equipmentRes] = await Promise.all([
        supabase.from('licenses').select('status').eq('client_id', user.client_id),
        supabase.from('equipment').select('status').eq('client_id', user.client_id)
      ]);
      type LicenseStatusRow = Pick<Database['public']['Tables']['licenses']['Row'], 'status'>
      type EquipmentStatusRow = Pick<Database['public']['Tables']['equipment']['Row'], 'status'>
      const licenses = (licensesRes.data ?? []) as LicenseStatusRow[]
      const equipment = (equipmentRes.data ?? []) as EquipmentStatusRow[]

      stats = {
        total_clients: 1,
        total_licenses: licenses.length,
        total_equipment: equipment.length,
        expired_licenses: licenses.filter(l => l.status === 'expired').length,
        about_to_expire_licenses: licenses.filter(l => l.status === 'about_to_expire').length,
        obsolete_equipment: equipment.filter(e => e.status === 'obsolete').length,
        soon_obsolete_equipment: equipment.filter(e => e.status === 'bientot_obsolete').length
      };
    }

    return NextResponse.json({
      stats,
      alerts: alerts || []
    });

  } catch (error) {
    console.error('Erreur API GET /dashboard:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
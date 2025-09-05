import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';

// GET /api/users/[id]/activity - Récupérer l'activité d'un utilisateur
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context :any) {
  try {
    const user = await getCurrentUser();
        const params = await context.params; // ✅ await nécessaire
    const { id } = params;
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const checker = new PermissionChecker(user);
    const supabase = createSupabaseServerClient();

    // Seuls les admins peuvent voir les logs d'activité
    if (!checker.canViewActivityLogs()) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Vérifier que l'utilisateur cible existe
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les logs d'activité de l'utilisateur
    const { data: activityLogs, count, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        created_at
      `, { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors de la récupération des logs d\'activité:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des logs d\'activité' },
        { status: 500 }
      );
    }

    // Enrichir les logs avec des informations lisibles
    const enrichedLogs = activityLogs?.map(log => ({
      ...log,
      actionLabel: getActionLabel(log.action, log.table_name),
      tableLabel: getTableLabel(log.table_name),
      summary: generateLogSummary(log)
    })) || [];

    return NextResponse.json({
      data: enrichedLogs,
      user: targetUser,
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0)
    });

  } catch (error) {
    console.error('Erreur API GET /users/[id]/activity:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires pour enrichir les logs

function getActionLabel(action: string, tableName: string): string {
  const actionLabels: Record<string, string> = {
    'create': 'Création',
    'update': 'Modification',
    'delete': 'Suppression',
    'login': 'Connexion',
    'logout': 'Déconnexion',
    'validate': 'Validation',
    'export': 'Export',
    'import': 'Import'
  };

  return actionLabels[action] || action;
}

function getTableLabel(tableName: string): string {
  const tableLabels: Record<string, string> = {
    'profiles': 'Profil utilisateur',
    'clients': 'Client',
    'licenses': 'Licence',
    'equipment': 'Équipement',
    'notifications': 'Notification',
    'activity_logs': 'Journal d\'activité'
  };

  return tableLabels[tableName] || tableName;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateLogSummary(log: any): string {
  const { action, table_name, old_values, new_values } = log;

  switch (action) {
    case 'create':
      return `Création d'un nouvel enregistrement dans ${getTableLabel(table_name)}`;
    
    case 'update':
      if (old_values && new_values) {
        const changedFields = Object.keys(new_values).filter(
          key => old_values[key] !== new_values[key]
        );
        if (changedFields.length > 0) {
          return `Modification des champs: ${changedFields.join(', ')}`;
        }
      }
      return `Modification d'un enregistrement dans ${getTableLabel(table_name)}`;
    
    case 'delete':
      return `Suppression d'un enregistrement dans ${getTableLabel(table_name)}`;
    
    case 'validate':
      return `Validation d'un utilisateur`;
    
    case 'login':
      return `Connexion à l'application`;
    
    case 'logout':
      return `Déconnexion de l'application`;
    
    default:
      return `Action ${getActionLabel(action, table_name)} sur ${getTableLabel(table_name)}`;
  }
}
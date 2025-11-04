import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PermissionChecker } from '@/lib/auth/permissions'
import { getCurrentUser } from '@/lib/auth/server'
import { LicenseTypeExport } from '@/types'

// GET /api/license-types/export - Exporter les types de licences
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 })
    }

    const supabase = createSupabaseServerClient();
    const checker = new PermissionChecker(user);

    // Vérifier les permissions
    if (!checker.can('read', 'licenses')) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes pour exporter les types de licences' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as 'csv' | 'xlsx' | 'pdf' || 'csv';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Récupérer tous les types de licences
    let query = supabase
      .from('license_types')
      .select('id, name, code, description, is_active, created_at, updated_at')
      .order('name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: licenseTypes, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des types de licences pour export:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des types de licences' },
        { status: 500 }
      );
    }

    if (!licenseTypes || licenseTypes.length === 0) {
      return NextResponse.json(
        { message: 'Aucun type de licence à exporter' },
        { status: 404 }
      );
    }

    // Convertir les données pour l'export
    const exportData: LicenseTypeExport[] = licenseTypes.map(type => ({
      id: type.id,
      name: type.name,
      code: type.code,
      description: type.description,
      is_active: type.is_active,
      created_at: type.created_at || '',
      updated_at: type.updated_at || '',
    }));

    // Générer le contenu selon le format demandé
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        content = generateCSV(exportData);
        mimeType = 'text/csv';
        filename = `types-licences-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'xlsx':
        // Pour l'instant, on génère du JSON (nécessiterait une bibliothèque comme xlsx)
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        filename = `types-licences-${new Date().toISOString().split('T')[0]}.json`;
        break;

      default:
        return NextResponse.json(
          { message: 'Format non supporté' },
          { status: 400 }
        );
    }

    // Retourner le fichier
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Erreur API GET /license-types/export:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour générer le CSV
function generateCSV(data: LicenseTypeExport[]): string {
  if (data.length === 0) return '';

  const headers = ['ID', 'Nom', 'Code', 'Description', 'Actif', 'Créé le', 'Modifié le'];
  const rows = data.map(type => [
    type.id,
    type.name,
    type.code,
    type.description || '',
    type.is_active ? 'Oui' : 'Non',
    new Date(type.created_at).toLocaleDateString('fr-FR'),
    new Date(type.updated_at).toLocaleDateString('fr-FR'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');

  return csvContent;
}

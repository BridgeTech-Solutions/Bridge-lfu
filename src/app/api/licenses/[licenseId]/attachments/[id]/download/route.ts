import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';


//recuperer une piece jointe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: { params: Promise<{ licenseId: string; id: string }> }) {
    const { licenseId, id } = await context.params; 

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

    // Récupérer la pièce jointe
    const { data: attachment, error: fetchError } = await supabase
      .from('license_attachments')
      .select('*')
      .eq('id', id)
      .eq('license_id', licenseId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { message: 'Pièce jointe non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions sur la licence
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (!license || !checker.can('read', 'licenses', license)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Générer une URL de téléchargement signée (valide 1 heure)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('license-attachments')
      .createSignedUrl(attachment.file_url, 3600, {
        download: attachment.file_name
      });

    if (urlError || !signedUrl) {
      console.error('Erreur lors de la génération de l\'URL signée:', urlError);
      return NextResponse.json(
        { message: 'Erreur lors de la génération du lien de téléchargement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      download_url: signedUrl.signedUrl,
      file_name: attachment.file_name,
      file_size: attachment.file_size,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Erreur API GET /licenses/[licenseId]/attachments/[id]/download:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
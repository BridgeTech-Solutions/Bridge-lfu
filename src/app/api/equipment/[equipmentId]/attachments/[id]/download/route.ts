  // GET /api/equipment/[equipmentId]/attachments/[id]/download - Télécharger une pièce jointe d'équipement
  import { NextRequest, NextResponse } from 'next/server';
  import { createSupabaseServerClient } from '@/lib/supabase/server';
  import { getCurrentUser } from '@/lib/auth/server';
  import { PermissionChecker } from '@/lib/auth/permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  export async function GET(request: NextRequest, context: { params: Promise<{ equipmentId: string; id: string }> } 
  ) {
    try {
      const { equipmentId, id } = await context.params; // 
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
        .from('equipment_attachments')
        .select('*')
        .eq('id', id)
        .eq('equipment_id', equipmentId)
        .single();

      if (fetchError || !attachment) {
        return NextResponse.json(
          { message: 'Pièce jointe non trouvée' },
          { status: 404 }
        );
      }

      // Vérifier les permissions sur l'équipement
      const { data: equipment } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (!equipment || !checker.can('read', 'equipment', equipment)) {
        return NextResponse.json(
          { message: 'Permissions insuffisantes' },
          { status: 403 }
        );
      }

      // Générer une URL de téléchargement signée (valide 1 heure)
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('equipment-attachments')
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
      console.error('Erreur API GET /equipment/[equipmentId]/attachments/[id]/download:', error);
      return NextResponse.json(
        { message: 'Erreur interne du serveur' },
        { status: 500 }
      );
    }
  }
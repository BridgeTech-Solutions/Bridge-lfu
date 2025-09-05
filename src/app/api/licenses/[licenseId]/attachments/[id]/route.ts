// app/api/licenses/[licenseId]/attachments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';


// interface any {
//   params: { licenseId: string; id: string }
// }

// DELETE /api/licenses/[licenseId]/attachments/[id] - Supprimer une pièce jointe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, { params }: any) {
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
      .eq('id', params.id)
      .eq('license_id', params.licenseId)
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
      .eq('id', params.licenseId)
      .single();

    if (!license || !checker.can('update', 'licenses', license)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from('license-attachments')
      .remove([attachment.file_url]);

    if (storageError) {
      console.error('Erreur lors de la suppression du fichier:', storageError);
    }

    // Supprimer l'enregistrement
    const { error: deleteError } = await supabase
      .from('license_attachments')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Erreur lors de la suppression de la pièce jointe:', deleteError);
      return NextResponse.json(
        { message: 'Erreur lors de la suppression de la pièce jointe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Pièce jointe supprimée avec succès' });

  } catch (error) {
    console.error('Erreur API DELETE /licenses/[licenseId]/attachments/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
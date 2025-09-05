// app/api/equipment/[equipmentId]/attachments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';




// DELETE /api/equipment/[equipmentId]/attachments/[id] - Supprimer une pièce jointe d'équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, { params } : any) {
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
      .from('equipment_attachments')
      .select('*')
      .eq('id', params.id)
      .eq('equipment_id', params.equipmentId)
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
      .eq('id', params.equipmentId)
      .single();

    if (!equipment || !checker.can('update', 'equipment', equipment)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([attachment.file_url]);

    if (storageError) {
      console.error('Erreur lors de la suppression du fichier:', storageError);
    }

    // Supprimer l'enregistrement
    const { error: deleteError } = await supabase
      .from('equipment_attachments')
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
    console.error('Erreur API DELETE /equipment/[equipmentId]/attachments/[id]:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

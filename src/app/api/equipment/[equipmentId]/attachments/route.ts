// app/api/equipment/[id]/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';
import { PermissionChecker } from '@/lib/auth/permissions';



// GET /api/equipment/[id]/attachments - Récupérer les pièces jointes d'un équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, { params } : any) {
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

    // Vérifier d'abord que l'équipement existe et que l'utilisateur y a accès
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', params.id)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { message: 'Équipement non trouvé' },
        { status: 404 }
      );
    }

    if (!checker.can('read', 'equipment', equipment)) {
      return NextResponse.json(
        { message: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les pièces jointes
    const { data: attachments, error } = await supabase
      .from('equipment_attachments')
      .select(`
        *,
        uploaded_by_profile:uploaded_by (
          first_name,
          last_name
        )
      `)
      .eq('equipment_id', params.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des pièces jointes:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des pièces jointes' },
        { status: 500 }
      );
    }

    return NextResponse.json(attachments);

  } catch (error) {
    console.error('Erreur API GET /equipment/[id]/attachments:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/equipment/[id]/attachments - Ajouter une pièce jointe à un équipement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: NextRequest, { params }: any) {
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

    // Vérifier d'abord que l'équipement existe et que l'utilisateur y a accès
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', params.id)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json(
        { message: 'Équipement non trouvé' },
        { status: 404 }
      );
    }

    if (!checker.can('update', 'equipment', equipment)) {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('file_type') as string || 'other';

    if (!file) {
      return NextResponse.json(
        { message: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Valider le type de fichier
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Type de fichier non autorisé' },
        { status: 400 }
      );
    }

    // Valider la taille du fichier (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'Le fichier ne doit pas dépasser 10MB' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${params.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const bucketPath = `equipment-attachments/${fileName}`;

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('equipment-attachments')
      .upload(bucketPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur lors de l\'upload du fichier:', uploadError);
      return NextResponse.json(
        { message: 'Erreur lors de l\'upload du fichier' },
        { status: 500 }
      );
    }

    // Créer l'enregistrement de la pièce jointe
    const { data: attachment, error: attachmentError } = await supabase
      .from('equipment_attachments')
      .insert({
        equipment_id: params.id,
        file_name: file.name,
        file_url: uploadData.path,
        file_type: fileType,
        file_size: file.size,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (attachmentError) {
      // Supprimer le fichier uploadé en cas d'erreur
      await supabase.storage.from('equipment-attachments').remove([bucketPath]);
      
      console.error('Erreur lors de la création de la pièce jointe:', attachmentError);
      return NextResponse.json(
        { message: 'Erreur lors de la création de la pièce jointe' },
        { status: 500 }
      );
    }

    return NextResponse.json(attachment, { status: 201 });

  } catch (error) {
    console.error('Erreur API POST /equipment/[id]/attachments:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
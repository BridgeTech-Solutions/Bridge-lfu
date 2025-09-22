// app/api/notifications/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/server';

// GET /api/notifications/settings - Récupérer les paramètres de notification de l'utilisateur
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

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Si aucun paramètre n'existe, créer des paramètres par défaut
      if (error.code === 'PGRST116') {
        const defaultSettings = {
          user_id: user.id,
          license_alert_days: [7, 30],
          equipment_alert_days: [30, 90],
          email_enabled: true
        };

        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          console.error('Erreur lors de la création des paramètres par défaut:', createError);
          return NextResponse.json(
            { message: 'Erreur lors de la création des paramètres par défaut' },
            { status: 500 }
          );
        }

        return NextResponse.json(newSettings);
      }

      console.error('Erreur lors de la récupération des paramètres:', error);
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des paramètres' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Erreur API GET /notifications/settings:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
// PUT /api/notifications/settings - Mettre à jour les paramètres de notification
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { licenseAlertDays, equipmentAlertDays, emailEnabled } = body;

    // Validation des données
    if (!Array.isArray(licenseAlertDays) || !Array.isArray(equipmentAlertDays)) {
      return NextResponse.json(
        { message: 'Les jours d\'alerte doivent être des tableaux' },
        { status: 400 }
      );
    }

    if (typeof emailEnabled !== 'boolean') {
      return NextResponse.json(
        { message: 'emailEnabled doit être un booléen' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // D'abord, nous essayons de récupérer les paramètres existants pour l'utilisateur
    const { data: existingSettings, error: fetchError } = await supabase
      .from('notification_settings')
      .select('id') // Nous n'avons besoin que de l'ID pour vérifier l'existence
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Gérer les erreurs de récupération (sauf "pas de résultat")
      console.error('Erreur lors de la vérification des paramètres existants:', fetchError);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour des paramètres' },
        { status: 500 }
      );
    }

    let updatedSettings;
    let updateError;

    if (existingSettings) {
      // Si les paramètres existent, nous les mettons à jour
      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          license_alert_days: licenseAlertDays,
          equipment_alert_days: equipmentAlertDays,
          email_enabled: emailEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();
      updatedSettings = data;
      updateError = error;
    } else {
      // Si les paramètres n'existent pas, nous en créons de nouveaux
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          license_alert_days: licenseAlertDays,
          equipment_alert_days: equipmentAlertDays,
          email_enabled: emailEnabled,
        })
        .select()
        .single();
      updatedSettings = data;
      updateError = error;
    }

    if (updateError) {
      console.error('Erreur lors de la mise à jour des paramètres:', updateError);
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour des paramètres' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error('Erreur API PUT /notifications/settings:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

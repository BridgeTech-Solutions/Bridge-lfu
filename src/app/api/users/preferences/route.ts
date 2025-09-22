// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'

// GET /api/user/preferences - Récupérer les préférences de l'utilisateur
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseServerClient()
    
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas de préférences trouvées, renvoyer 404
        return NextResponse.json(
          { message: 'Préférences non trouvées' },
          { status: 404 }
        )
      }
      console.error('Erreur lors de la récupération des préférences:', error)
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des préférences' },
        { status: 500 }
      )
    }

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('Erreur API GET /user/preferences:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/user/preferences - Mettre à jour les préférences
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = createSupabaseServerClient()

    // Valider les données
    const validFields = [
      'theme',
      'language', 
      'email_notifications',
      'push_notifications',
      'sms_notifications',
      'items_per_page'
    ]

    const updateData = Object.keys(body)
      .filter(key => validFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key]
        return obj
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as any)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Aucune donnée valide à mettre à jour' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    // Essayer de mettre à jour d'abord
    const { data: updatedPrefs, error: updateError } = await supabase
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError && updateError.code === 'PGRST116') {
      // Pas de préférences existantes, créer de nouvelles préférences
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...updateData
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erreur lors de la création des préférences:', insertError)
        return NextResponse.json(
          { message: 'Erreur lors de la création des préférences' },
          { status: 500 }
        )
      }

      return NextResponse.json(newPrefs, { status: 201 })
    }

    if (updateError) {
      console.error('Erreur lors de la mise à jour des préférences:', updateError)
      return NextResponse.json(
        { message: 'Erreur lors de la mise à jour des préférences' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedPrefs)

  } catch (error) {
    console.error('Erreur API PUT /user/preferences:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/preferences - Réinitialiser les préférences
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseServerClient()
    
    // Supprimer les préférences existantes (elles reviendront aux valeurs par défaut)
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur lors de la réinitialisation des préférences:', error)
      return NextResponse.json(
        { message: 'Erreur lors de la réinitialisation des préférences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Préférences réinitialisées avec succès' 
    })

  } catch (error) {
    console.error('Erreur API DELETE /user/preferences:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
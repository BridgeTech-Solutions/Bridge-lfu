// app/api/auth/update-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { changePasswordSchema } from '@/lib/validations'
import { z } from 'zod'
import { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = changePasswordSchema.parse(body)
    
    const supabase = createSupabaseServerClient()
    
    // Vérification de l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérification de l'ancien mot de passe en tentant une reconnexion
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single<Pick<Database['public']['Tables']['profiles']['Row'], 'email'>>()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    // Test de l'ancien mot de passe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: validatedData.currentPassword
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Mise à jour du mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    })

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Mot de passe mis à jour avec succès'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur mise à jour mot de passe:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations'
import { z } from 'zod'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Erreur récupération profil:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données (sans le rôle pour les utilisateurs normaux)
    const validatedData = profileSchema.omit({ role: true }).parse(body)
    
    const supabase = createSupabaseServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Mise à jour du profil
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone,
        company: validatedData.company,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 400 }
      )
    }

    // Mise à jour de l'email si nécessaire
    if (validatedData.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: validatedData.email
      })

      if (emailError) {
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour de l\'email' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      profile
    })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      // Utilise `issues` ou `flatten()` — `errors` n'existe pas
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )

    }

    console.error('Erreur mise à jour profil:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
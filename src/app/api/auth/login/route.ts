// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations'
import { z } from 'zod'
import { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = loginSchema.parse(body)
    
    const supabase = createSupabaseServerClient()
    
    // Tentative de connexion
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erreur de connexion' },
        { status: 400 }
      )
    }

    // Récupération du profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 400 }
      )
    }

    // Vérification du statut du compte
    if (profile.role === 'unverified') {
      return NextResponse.json({
        user: profile,
        session: authData.session,
        requiresVerification: true
      })
    }

    return NextResponse.json({
      user: profile,
      session: authData.session,
      requiresVerification: false
    })

  } catch (error: unknown) {
      // Narrowing correct — et utiliser .issues ou .flatten()
      if (error instanceof z.ZodError) {
        // Option A: renvoyer la liste simple d'issues
        return NextResponse.json(
          { error: 'Données invalides', details: error.issues },
          { status: 400 }
        )
      }

      console.error('Erreur de connexion:', error)
      return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
    
  }
}

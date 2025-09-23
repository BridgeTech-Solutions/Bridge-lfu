// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { registerSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = registerSchema.parse(body)
    
    const supabase = createSupabaseServerClient()
    
    // Inscription de l'utilisateur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          phone: validatedData.phone || null,
          company: validatedData.company || null
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 400 }
      )
    }

    // Création du profil avec le rôle 'unverified'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        role: 'unverified'
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil' },
        { status: 400 }
      )
    }

    // Notification aux administrateurs
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'new_unverified_user' as const,
        title: 'Nouvel utilisateur à valider',
        message: `${validatedData.firstName} ${validatedData.lastName} (${validatedData.email}) attend une validation`,
        related_id: authData.user!.id,
        related_type: 'user'
      }))

      await supabaseAdmin
        .from('notifications')
        .insert(notifications)
    }

    return NextResponse.json({
      message: 'Inscription réussie. Votre compte est en attente de validation.',
      requiresVerification: true,
      user: {
        id: authData.user.id,
        email: validatedData.email,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        role: 'unverified'
      }
    })

  } catch (error : unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
      
    }

    console.error('Erreur d\'inscription:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
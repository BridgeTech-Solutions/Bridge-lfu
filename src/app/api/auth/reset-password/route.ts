// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resetPasswordSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Validation des données
    const validatedData = resetPasswordSchema.parse(body)
    
    const supabase = createSupabaseServerClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(
      validatedData.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`
      }
    )

    if (error) {
      return NextResponse.json(
        { error: error.message },
      )
    }

    return NextResponse.json({
      message: 'Email de réinitialisation envoyé'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Email invalide', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur reset password:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
// app/api/auth/verify-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib//auth/server'
import { z } from 'zod'

const verifyUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'technicien', 'client']),
  clientId: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = verifyUserSchema.parse(body)
    
    // Vérification que l'utilisateur connecté est un admin
    const currentUser = await getCurrentUser()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérification que l'utilisateur à valider existe et est en attente
    const { data: userToVerify, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', validatedData.userId)
      .eq('role', 'unverified')
      .single()

    if (fetchError || !userToVerify) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé ou déjà validé' },
        { status: 404 }
      )
    }

    // Validation des données selon le rôle
    if (validatedData.role === 'client' && !validatedData.clientId) {
      return NextResponse.json(
        { error: 'Un client doit être assigné pour le rôle client' },
        { status: 400 }
      )
    }

    // Mise à jour du profil utilisateur
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      role: validatedData.role,
      updated_at: new Date().toISOString()
    }

    if (validatedData.clientId) {
      updateData.client_id = validatedData.clientId
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', validatedData.userId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la validation' },
        { status: 400 }
      )
    }

    // Création d'une notification pour l'utilisateur validé
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: validatedData.userId,
        type: 'general',
        title: 'Compte validé',
        message: `Votre compte a été validé avec le rôle ${validatedData.role}. Vous pouvez maintenant accéder à la plateforme.`,
        related_id: validatedData.userId,
        related_type: 'user'
      })

    // Suppression des notifications d'attente de validation
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('related_id', validatedData.userId)
      .eq('type', 'new_unverified_user')

    return NextResponse.json({
      message: 'Utilisateur validé avec succès'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur validation utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
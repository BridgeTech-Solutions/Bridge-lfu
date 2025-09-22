// app/api/notifications/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { emailService } from '@/lib/email/service'

// POST /api/notifications/send-email - Envoyer une notification par email
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Seuls les admins et techniciens peuvent déclencher l'envoi d'emails
    if (user.role !== 'admin' && user.role !== 'technicien') {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { notificationId, userEmail, userName } = body

    if (!notificationId || !userEmail) {
      return NextResponse.json(
        { message: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClient()

    // Récupérer la notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (error || !notification) {
      return NextResponse.json(
        { message: 'Notification non trouvée' },
        { status: 404 }
      )
    }

    // Envoyer l'email
    const emailSent = await emailService.sendNotificationEmail(
      notification,
      userEmail,
      userName || 'Utilisateur'
    )

    if (emailSent) {
      // Marquer l'email comme envoyé
      await supabase
        .from('notifications')
        .update({ email_sent: true } )
        .eq('id', notificationId)

      return NextResponse.json({
        success: true,
        message: 'Email envoyé avec succès'
      })
    } else {
      return NextResponse.json(
        { message: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur API POST /notifications/send-email:', error)
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET /api/notifications/test-email - Tester la connexion email
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const connectionTest = await emailService.testConnection()

    return NextResponse.json({
      success: connectionTest,
      message: connectionTest 
        ? 'Connexion email fonctionnelle' 
        : 'Problème de connexion email'
    })

  } catch (error) {
    console.error('Erreur test connexion email:', error)
    return NextResponse.json(
      { message: 'Erreur lors du test de connexion' },
      { status: 500 }
    )
  }
}
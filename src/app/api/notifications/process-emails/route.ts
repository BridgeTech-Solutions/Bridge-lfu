// app/api/notifications/process-emails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { triggerNotificationEmailJob } from '@/lib/jobs/notificationEmailJob'

// POST /api/notifications/process-emails - Traiter les emails en attente
export async function POST(request: NextRequest) {
  try {
    // Vérifier le header d'autorisation pour les cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    console.log('Démarrage du job de traitement des emails...')
    const stats = await triggerNotificationEmailJob()

    return NextResponse.json({
      success: true,
      message: 'Traitement des emails terminé',
      stats
    })

  } catch (error) {
    console.error('Erreur API POST /notifications/process-emails:', error)
    return NextResponse.json(
      { message: 'Erreur lors du traitement des emails' },
      { status: 500 }
    )
  }
}
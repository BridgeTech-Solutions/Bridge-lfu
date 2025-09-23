// app/api/cron/notifications/route.ts - Route pour les tâches CRON
import { NextRequest, NextResponse } from 'next/server'
import { NotificationTriggers } from '@/lib/notifications/triggers'
import { triggerNotificationEmailJob } from '@/lib/jobs/notificationEmailJob'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'autorisation CRON
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }
    console.log('Démarrage du job CRON de notifications...')

    // 1. Générer les nouvelles alertes
    await NotificationTriggers.triggerAllAlerts()

    // 2. Traiter les emails en attente
    const emailStats = await triggerNotificationEmailJob()

    console.log('Job CRON terminé:', emailStats)

    return NextResponse.json({
      success: true,
      message: 'Traitement des notifications terminé',
      emailStats
    })

  } catch (error) {
    console.error('Erreur job CRON notifications:', error)
    return NextResponse.json(
      { message: 'Erreur lors du traitement' },
      { status: 500 }
    )
  }
}
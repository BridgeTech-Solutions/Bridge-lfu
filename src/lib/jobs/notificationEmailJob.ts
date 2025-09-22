// lib/jobs/notificationEmailJob.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

interface NotificationWithUser {
  id: string
  user_id: string
  type: 'license_expiry' | 'equipment_obsolescence' | 'general' | 'new_unverified_user'
  title: string
  message: string
  related_id?: string
  related_type?: string
  is_read: boolean
  email_sent: boolean
  created_at: string
  user_email: string
  user_name: string
  email_enabled: boolean
}

export class NotificationEmailJob {
  private static isRunning = false

  static async processUnsentEmails(): Promise<{
    processed: number
    sent: number
    failed: number
    skipped: number
  }> {
    if (this.isRunning) {
      console.log('Job déjà en cours d\'exécution')
      return { processed: 0, sent: 0, failed: 0, skipped: 0 }
    }

    this.isRunning = true
    const stats = { processed: 0, sent: 0, failed: 0, skipped: 0 }

    try {
      const supabase = createSupabaseServerClient()

      // Récupérer toutes les notifications non envoyées par email
      // avec les informations utilisateur et paramètres email
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!inner(
            email,
            first_name,
            last_name
          ),
          notification_settings!inner(
            email_enabled
          )
        `)
        .eq('email_sent', false)
        .eq('notification_settings.email_enabled', true)
        .order('created_at', { ascending: true })
        .limit(50) // Traiter maximum 50 emails par fois

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error)
        return stats
      }

      if (!notifications || notifications.length === 0) {
        console.log('Aucune notification à traiter')
        return stats
      }

      console.log(`Traitement de ${notifications.length} notifications`)

      // Traiter chaque notification
      for (const notif of notifications) {
        stats.processed++

        try {
          // Construire le nom complet de l'utilisateur
          const profile = Array.isArray(notif.profiles) ? notif.profiles[0] : notif.profiles
          const settings = Array.isArray(notif.notification_settings) 
            ? notif.notification_settings[0] 
            : notif.notification_settings

          if (!settings?.email_enabled) {
            stats.skipped++
            continue
          }

          const userName = profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || 'Utilisateur'

          // Envoyer l'email
          const emailSent = await emailService.sendNotificationEmail(
            {
              id: notif.id,
              user_id: notif.user_id,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              related_id: notif.related_id,
              related_type: notif.related_type,
              is_read: notif.is_read,
              email_sent: notif.email_sent,
              created_at: notif.created_at
            },
            profile.email,
            userName
          )

          if (emailSent) {
            // Marquer comme envoyé dans la base de données
            await supabase
              .from('notifications')
              .update({ email_sent: true })
              .eq('id', notif.id)

            stats.sent++
            console.log(`Email envoyé pour notification ${notif.id}`)
          } else {
            stats.failed++
            console.log(`Échec envoi email pour notification ${notif.id}`)
          }

          // Petite pause pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 200))

        } catch (error) {
          console.error(`Erreur traitement notification ${notif.id}:`, error)
          stats.failed++
        }
      }

    } catch (error) {
      console.error('Erreur générale du job:', error)
    } finally {
      this.isRunning = false
    }

    console.log('Job terminé:', stats)
    return stats
  }

  // Méthode pour créer et envoyer immédiatement une notification
  static async createAndSendNotification(
    userId: string,
    type: 'license_expiry' | 'equipment_obsolescence' | 'general' | 'new_unverified_user',
    title: string,
    message: string,
    relatedId?: string,
    relatedType?: string
  ): Promise<string | null> {
    try {
      const supabase = createSupabaseServerClient()

      // Créer la notification
      const { data: notification, error: createError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          related_id: relatedId,
          related_type: relatedType
        })
        .select()
        .single()

      if (createError) {
        console.error('Erreur création notification:', createError)
        return null
      }

      // Vérifier si l'utilisateur a activé les emails
      const { data: userSettings, error: settingsError } = await supabase
        .from('notification_settings')
        .select('email_enabled')
        .eq('user_id', userId)
        .single()

      if (settingsError || !userSettings?.email_enabled) {
        console.log(`Emails désactivés pour l'utilisateur ${userId}`)
        return notification.id
      }

      // Récupérer les infos utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error('Utilisateur non trouvé:', profileError)
        return notification.id
      }

      // Envoyer l'email immédiatement
      const userName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name || 'Utilisateur'

      const emailSent = await emailService.sendNotificationEmail(
        notification,
        profile.email,
        userName
      )

      if (emailSent) {
        // Marquer comme envoyé
        await supabase
          .from('notifications')
          .update({ email_sent: true })
          .eq('id', notification.id)

        console.log(`Notification créée et email envoyé: ${notification.id}`)
      } else {
        console.log(`Notification créée mais email non envoyé: ${notification.id}`)
      }

      return notification.id

    } catch (error) {
      console.error('Erreur createAndSendNotification:', error)
      return null
    }
  }
}

// Fonction utilitaire pour déclencher le job
export async function triggerNotificationEmailJob() {
  return await NotificationEmailJob.processUnsentEmails()
}
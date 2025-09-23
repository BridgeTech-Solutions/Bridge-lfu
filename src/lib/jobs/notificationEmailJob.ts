// lib/jobs/notificationEmailJob.ts - VERSION CORRIGÉE
import { createSupabaseServiceRoleClient as createSupabaseServerClient } from '@/lib/supabase/service-role'
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
  profiles: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
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

      console.log('Recherche des notifications non envoyées...')

      // Récupérer les notifications non envoyées avec les profils utilisateur
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!inner(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('email_sent', false)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error)
        return stats
      }

      if (!notifications || notifications.length === 0) {
        console.log('Aucune notification non envoyée trouvée')
        return stats
      }

      console.log(`Traitement de ${notifications.length} notifications`)

      // Traiter chaque notification
      for (const notif of notifications as NotificationWithUser[]) {
        stats.processed++

        try {
          console.log(`Traitement notification ${notif.id} pour utilisateur ${notif.user_id}`)

          // Vérifier les paramètres de notification de l'utilisateur
          // eslint-disable-next-line prefer-const
          let { data: settings, error: settingsError } = await supabase
            .from('notification_settings')
            .select('email_enabled')
            .eq('user_id', notif.user_id)
            .single()

          // Si pas de paramètres trouvés, créer des paramètres par défaut
          if (settingsError || !settings) {
            console.log(`Création de paramètres par défaut pour utilisateur ${notif.user_id}`)
            
            const { data: newSettings, error: createError } = await supabase
              .from('notification_settings')
              .insert({
                user_id: notif.user_id,
                license_alert_days: [7, 30],
                equipment_alert_days: [30, 90],
                email_enabled: true
              })
              .select('email_enabled')
              .single()

            if (createError) {
              console.error(`Erreur création paramètres pour ${notif.user_id}:`, createError)
              stats.failed++
              continue
            }

            settings = newSettings
          }

          // Si les emails sont désactivés pour cet utilisateur
          if (!settings?.email_enabled) {
            console.log(`Emails désactivés pour utilisateur ${notif.user_id}, notification ${notif.id} ignorée`)
            stats.skipped++
            
            // Marquer comme "traité" même si pas envoyé pour éviter de le reprocesser
            await supabase
              .from('notifications')
              .update({ email_sent: true })
              .eq('id', notif.id)
            
            continue
          }

          const profile = notif.profiles
          const userName = profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile.first_name || 'Utilisateur'

          console.log(`Envoi email à ${profile.email} pour notification ${notif.id}`)

          // Envoyer l'email
          const emailSent = await emailService.sendNotificationEmail(
            notif,
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
            console.log(`Email envoyé avec succès pour notification ${notif.id}`)
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

    console.log('Job terminé avec les statistiques:', stats)
    return stats
  }

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

      // Vérifier les paramètres de notification
      // eslint-disable-next-line prefer-const
      let { data: userSettings, error: settingsError } = await supabase
        .from('notification_settings')
        .select('email_enabled')
        .eq('user_id', userId)
        .single()

      // Créer des paramètres par défaut si inexistants
      if (settingsError || !userSettings) {
        const { data: newSettings } = await supabase
          .from('notification_settings')
          .insert({
            user_id: userId,
            email_enabled: true
          })
          .select('email_enabled')
          .single()
        
        userSettings = newSettings
      }

      if (!userSettings?.email_enabled) {
        console.log(`Emails désactivés pour l'utilisateur ${userId}`)
        return notification.id
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error('Utilisateur non trouvé:', profileError)
        return notification.id
      }

      const userName = profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name || 'Utilisateur'

      const emailSent = await emailService.sendNotificationEmail(
        notification,
        profile.email,
        userName
      )

      if (emailSent) {
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

export async function triggerNotificationEmailJob() {
  return await NotificationEmailJob.processUnsentEmails()
}


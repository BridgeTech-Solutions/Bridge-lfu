// lib/notifications/triggers.ts
import { createSupabaseServiceRoleClient as createSupabaseServerClient } from '@/lib/supabase/service-role'
import { NotificationEmailJob } from '@/lib/jobs/notificationEmailJob'
import { Client } from '@/types'

export class NotificationTriggers {

  // Créer une notification avec envoi d'email optionnel
  static async createNotification(
    userId: string,
    type: 'license_expiry' | 'equipment_obsolescence' | 'general' | 'new_unverified_user',
    title: string,
    message: string,
    relatedId?: string,
    relatedType?: string,
    sendEmailImmediately = false
  ): Promise<string | null> {

    if (sendEmailImmediately) {
      return await NotificationEmailJob.createAndSendNotification(
        userId, type, title, message, relatedId, relatedType
      )
    } else {
      try {
        const supabase = createSupabaseServerClient()

        const { data: notification, error } = await supabase
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

        if (error) {
          console.error('Erreur création notification:', error)
          return null
        }

        return notification.id
      } catch (error) {
        console.error('Erreur createNotification:', error)
        return null
      }
    }
  }

  // Déclencher les alertes de licence qui expirent bientôt
  static async triggerLicenseExpiryAlerts(): Promise<void> {
    try {
      const supabase = createSupabaseServerClient()

      // Récupérer toutes les licences qui expirent dans les prochains 90 jours
      const { data: licenses, error } = await supabase
        .from('licenses')
        .select(`
          id,
          name,
          expiry_date,
          client_id,
          clients!inner(name)
        `)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .lte('expiry_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error || !licenses) {
        console.error('Erreur récupération licences:', error)
        return
      }

      for (const license of licenses) {
        const expiryDate = new Date(license.expiry_date)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        const clients = license.clients as Client[] | Client
        const clientName = Array.isArray(clients) ? clients[0].name : clients.name

        //  CORRECTION: Récupérer TOUS les utilisateurs concernés par cette licence
        // 1. Admins et techniciens (voient tout)
        const { data: adminTechProfiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role')
          .in('role', ['admin', 'technicien'])

        // 2. Utilisateurs clients du client concerné
        const { data: clientProfiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role')
          .eq('role', 'client')
          .eq('client_id', license.client_id)

        // Combiner tous les utilisateurs à notifier
        const allProfiles = [...(adminTechProfiles || []), ...(clientProfiles || [])]

        // Créer une notification pour chaque utilisateur concerné
        for (const profile of allProfiles) {
          // Récupérer les paramètres de notification pour ce profil
          const { data: settingsData } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', profile.id)
            .single()

          if (!settingsData) continue
          const settings = settingsData

          // Vérifier si l'utilisateur veut être notifié à ce moment
          if (!settings.license_alert_days?.includes(daysUntilExpiry)) continue

          // Vérifier qu'une alerte n'a pas déjà été envoyée dans les dernières 24h
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', profile.id)
            .eq('type', 'license_expiry')
            .eq('related_id', license.id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single()

          if (existingAlert) continue

          // Personnaliser le message selon le rôle
          const title = `Licence "${license.name}" expire bientôt`
          const message = profile.role === 'client'
            ? `Votre licence "${license.name}" expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''} (${expiryDate.toLocaleDateString('fr-FR')}). Veuillez contacter votre administrateur pour le renouvellement.`
            : `La licence "${license.name}" du client "${clientName}" expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''} (${expiryDate.toLocaleDateString('fr-FR')}). Pensez à la renouveler.`

          await this.createNotification(
            profile.id,
            'license_expiry',
            title,
            message,
            license.id,
            'license'
          )
        }
      }

    } catch (error) {
      console.error('Erreur triggerLicenseExpiryAlerts:', error)
    }
  }

  // Déclencher les alertes d'équipement qui deviennent obsolètes
  static async triggerEquipmentObsolescenceAlerts(): Promise<void> {
    try {
      const supabase = createSupabaseServerClient()

      const { data: equipments, error } = await supabase
        .from('equipment')
        .select(`
          id,
          name,
          estimated_obsolescence_date,
          end_of_sale,
          client_id,
          clients!inner(name)
        `)
        .or('estimated_obsolescence_date.gte.' + new Date().toISOString().split('T')[0] + ',end_of_sale.gte.' + new Date().toISOString().split('T')[0])

      if (error || !equipments) {
        console.error('Erreur récupération équipements:', error)
        return
      }

      for (const equipment of equipments) {
        const clients = equipment.clients as Client[] | Client
        const clientName = Array.isArray(clients) ? clients[0].name : clients.name

        // 🔥 CORRECTION: Récupérer TOUS les utilisateurs concernés
        // 1. Admins et techniciens
        const { data: adminTechProfiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role')
          .in('role', ['admin', 'technicien'])

        // 2. Utilisateurs clients du client concerné
        const { data: clientProfiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role')
          .eq('role', 'client')
          .eq('client_id', equipment.client_id)

        const allProfiles = [...(adminTechProfiles || []), ...(clientProfiles || [])]

        for (const profile of allProfiles) {
          // Récupérer les paramètres de notification
          const { data: settingsData } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', profile.id)
            .single()

          if (!settingsData) continue
          const settings = settingsData

        // Obsolescence estimée
        if (equipment.estimated_obsolescence_date) {
          const obsolescenceDate = new Date(equipment.estimated_obsolescence_date)
          const daysUntilObsolescence = Math.ceil((obsolescenceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

          if (settings.equipment_alert_days?.includes(daysUntilObsolescence)) {
            const { data: existingAlert } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', profile.id)
              .eq('type', 'equipment_obsolescence')
              .eq('related_id', equipment.id)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .single()

            if (!existingAlert) {
              const clientName = Array.isArray(clients) ? clients[0].name : clients.name
              const title = `Équipement "${equipment.name}" devient obsolète bientôt`
              const message = `L'équipement "${equipment.name}" du client "${clientName}" devient obsolète dans ${daysUntilObsolescence} jour${daysUntilObsolescence > 1 ? 's' : ''} (${obsolescenceDate.toLocaleDateString('fr-FR')}).`

              await this.createNotification(
                profile.id,
                'equipment_obsolescence',
                title,
                message,
                equipment.id,
                'equipment'
              )
            }
          }
        }

        // Fin de commercialisation
        if (equipment.end_of_sale) {
          const endOfSaleDate = new Date(equipment.end_of_sale)
          const daysUntilEndOfSale = Math.ceil((endOfSaleDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

          if (settings.equipment_alert_days?.includes(daysUntilEndOfSale)) {
            const { data: existingAlert } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', profile.id)
              .eq('type', 'equipment_obsolescence')
              .eq('related_id', equipment.id)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .single()

            if (!existingAlert) {
              const clientName = Array.isArray(clients) ? clients[0].name : clients.name
              const title = `Équipement "${equipment.name}" - Fin de commercialisation`
              const message = `L'équipement "${equipment.name}" du client "${clientName}" atteint sa fin de commercialisation dans ${daysUntilEndOfSale} jour${daysUntilEndOfSale > 1 ? 's' : ''} (${endOfSaleDate.toLocaleDateString('fr-FR')}).`

              await this.createNotification(
                profile.id,
                'equipment_obsolescence',
                title,
                message,
                equipment.id,
                'equipment'
              )
            }
          }
        }
      }
      }

    } catch (error) {
      console.error('Erreur triggerEquipmentObsolescenceAlerts:', error)
    }
  }

  // Déclencher toutes les alertes automatiques
  static async triggerAllAlerts(): Promise<void> {
    console.log('Démarrage des alertes automatiques...')
    await Promise.all([
      this.triggerLicenseExpiryAlerts(),
      this.triggerEquipmentObsolescenceAlerts()
    ])
    console.log('Alertes automatiques terminées')
  }
}

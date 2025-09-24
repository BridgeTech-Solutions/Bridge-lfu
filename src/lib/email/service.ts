// lib/email/service.ts
import nodemailer from 'nodemailer'
import { createSupabaseServiceRoleClient  as createSupabaseServerClient } from '@/lib/supabase/service-role'
import type { Notification } from '@/hooks/useNotifications'
import { decrypt } from '@/lib/utils/crypto'; // Importer la fonction de déchiffrement

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isEnabled = false

  constructor() {
    this.initializeTransporter()
  }

  private async initializeTransporter() {
    try {
      const supabase = createSupabaseServerClient()
      
      // Récupérer les paramètres SMTP depuis la base de données
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['smtp_enabled', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_email', 'smtp_from_name'])

      if (!settings) return

      const config = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as Record<string, any>)
      // Vérifier si le mot de passe est chiffré et le déchiffrer
      const smtpPassword = config.smtp_password.includes(':') 
        ? decrypt(config.smtp_password) 
        : config.smtp_password;

      this.isEnabled = config.smtp_enabled === true

      if (!this.isEnabled) {
        console.log('SMTP désactivé dans les paramètres')
        return
      }

      const emailConfig: EmailConfig = {
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: parseInt(config.smtp_port) === 465,
        auth: {
          user: config.smtp_user,
          pass: smtpPassword,
        }
      }

      this.transporter = nodemailer.createTransport(emailConfig)

      // Vérifier la connexion
      await this.transporter.verify()
      console.log('Service email initialisé avec succès')

    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service email:', error)
      this.isEnabled = false
    }
  }

  private getNotificationTemplate(notification: Notification, userEmail: string, userName: string): EmailTemplate {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    switch (notification.type) {
      case 'license_expiry':
        return {
          subject: `🔔 Bridge LFU - Alerte: Expiration de licence - ${notification.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #dc2626; margin: 0;">⚠️ Alerte d'expiration de licence</h1>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h2 style="color: #374151; margin-top: 0;">${notification.title}</h2>
                <p style="color: #6b7280; line-height: 1.6;">${notification.message}</p>
                
                ${notification.related_id ? `
                  <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="margin: 0; color: #92400e;">
                      <strong>Action recommandée:</strong> Vérifiez et renouvelez votre licence avant expiration.
                    </p>
                  </div>
                ` : ''}
                
                <div style="margin: 30px 0;">
                  <a href="${baseUrl}/dashboard/licenses" 
                     style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir mes licences
                  </a>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Vous recevez cet email car vous avez activé les notifications par email.<br>
                  <a href="${baseUrl}/dashboard/notifications" style="color: #3b82f6;">Gérer mes préférences</a>
                </p>
              </div>
            </div>
          `,
          text: `
            ALERTE: Expiration de licence
            
            ${notification.title}
            
            ${notification.message}
            
            Visitez votre tableau de bord pour plus de détails: ${baseUrl}/dashboard/licenses
            
            ---
            Vous recevez cet email car vous avez activé les notifications par email.
            Gérez vos préférences: ${baseUrl}/dashboard/notifications
          `
        }

      case 'equipment_obsolescence':
        return {
          subject: `🔔 Bridge LFU - Alerte: Obsolescence d'équipement - ${notification.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #dc2626; margin: 0;">⚠️ Alerte d'obsolescence d'équipement</h1>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h2 style="color: #374151; margin-top: 0;">${notification.title}</h2>
                <p style="color: #6b7280; line-height: 1.6;">${notification.message}</p>
                
                ${notification.related_id ? `
                  <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px;">
                    <p style="margin: 0; color: #991b1b;">
                      <strong>Action recommandée:</strong> Planifiez le remplacement ou la mise à jour de cet équipement.
                    </p>
                  </div>
                ` : ''}
                
                <div style="margin: 30px 0;">
                  <a href="${baseUrl}/dashboard/equipment" 
                     style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir mes équipements
                  </a>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Vous recevez cet email car vous avez activé les notifications par email.<br>
                  <a href="${baseUrl}/dashboard/notifications" style="color: #3b82f6;">Gérer mes préférences</a>
                </p>
              </div>
            </div>
          `,
          text: `
            ALERTE: Obsolescence d'équipement
            
            ${notification.title}
            
            ${notification.message}
            
            Visitez votre tableau de bord pour plus de détails: ${baseUrl}/dashboard/equipment
            
            ---
            Vous recevez cet email car vous avez activé les notifications par email.
            Gérez vos préférences: ${baseUrl}/dashboard/notifications
          `
        }

      case 'general':
        return {
          subject: `🔔 Bridge LFU - Notification - ${notification.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0;">📩 Nouvelle notification</h1>
              </div>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <h2 style="color: #374151; margin-top: 0;">${notification.title}</h2>
                <p style="color: #6b7280; line-height: 1.6;">${notification.message}</p>
                
                <div style="margin: 30px 0;">
                  <a href="${baseUrl}/dashboard" 
                     style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Voir le tableau de bord
                  </a>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Vous recevez cet email car vous avez activé les notifications par email.<br>
                  <a href="${baseUrl}/dashboard/notifications" style="color: #3b82f6;">Gérer mes préférences</a>
                </p>
              </div>
            </div>
          `,
          text: `
            Nouvelle notification
            
            ${notification.title}
            
            ${notification.message}
            
            Visitez votre tableau de bord: ${baseUrl}/dashboard
            
            ---
            Vous recevez cet email car vous avez activé les notifications par email.
            Gérez vos préférences: ${baseUrl}/dashboard/notifications
          `
        }

      default:
        return {
          subject: `🔔 Bridge LFU - Notification - ${notification.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
            </div>
          `,
          text: `${notification.title}\n\n${notification.message}`
        }
    }
  }

  async sendNotificationEmail(
    notification: Notification, 
    userEmail: string, 
    userName: string = 'Utilisateur'
  ): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      console.log('Service email non disponible')
      return false
    }

    try {
      const supabase = createSupabaseServerClient()
      
      // Récupérer les paramètres d'expéditeur
      const { data: fromSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['smtp_from_email', 'smtp_from_name'])

      const fromEmail = fromSettings?.find(s => s.key === 'smtp_from_email')?.value || 'noreply@bridge-lfu.com'
      const fromName = fromSettings?.find(s => s.key === 'smtp_from_name')?.value || 'Bridge LFU'

      const template = this.getNotificationTemplate(notification, userEmail, userName)

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: userEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Email envoyé avec succès à ${userEmail} pour la notification ${notification.id}`)
      
      return true

    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      return false
    }
  }

  async sendBulkNotificationEmails(
    notifications: Array<{
      notification: Notification
      userEmail: string
      userName: string
    }>
  ): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 }

    for (const { notification, userEmail, userName } of notifications) {
      const sent = await this.sendNotificationEmail(notification, userEmail, userName)
      if (sent) {
        results.success++
      } else {
        results.failed++
      }
      
      // Petite pause entre les emails pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return results
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter()
      }
      
      if (this.transporter) {
        await this.transporter.verify()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Test de connexion email échoué:', error)
      return false
    }
  }
}

// Instance singleton
export const emailService = new EmailService()
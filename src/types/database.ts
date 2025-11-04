export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_brands: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          support_email: string | null
          support_phone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_brands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          postal_code: string | null
          sector: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          postal_code?: string | null
          sector?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          sector?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_clients_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          actual_obsolescence_date: string | null
          brand: string | null
          brand_id: string | null
          client_id: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_of_sale: string | null
          estimated_obsolescence_date: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          purchase_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"] | null
          type_id: string
          updated_at: string | null
          warranty_end_date: string | null
        }
        Insert: {
          actual_obsolescence_date?: string | null
          brand?: string | null
          brand_id?: string | null
          client_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_of_sale?: string | null
          estimated_obsolescence_date?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          type_id: string
          updated_at?: string | null
          warranty_end_date?: string | null
        }
        Update: {
          actual_obsolescence_date?: string | null
          brand?: string | null
          brand_id?: string | null
          client_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_of_sale?: string | null
          estimated_obsolescence_date?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          type_id?: string
          updated_at?: string | null
          warranty_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "equipment_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_attachments: {
        Row: {
          created_at: string | null
          equipment_id: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_attachments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_attachments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "v_equipment_with_client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      license_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          license_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          license_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          license_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_attachments_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_attachments_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "v_license_durations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_attachments_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "v_licenses_with_client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          client_id: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          editor: string | null
          expiry_date: string
          id: string
          license_key: string | null
          name: string
          purchase_date: string | null
          status: Database["public"]["Enums"]["license_status"] | null
          type_id: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          client_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          editor?: string | null
          expiry_date: string
          id?: string
          license_key?: string | null
          name: string
          purchase_date?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          type_id?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          client_id?: string | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          editor?: string | null
          expiry_date?: string
          id?: string
          license_key?: string | null
          name?: string
          purchase_date?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          type_id?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "license_types"
            referencedColumns: ["id"]
          },
        ]
      }
      
      license_types: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      license_suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          equipment_alert_days: number[] | null
          id: string
          license_alert_days: number[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          equipment_alert_days?: number[] | null
          id?: string
          license_alert_days?: number[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          equipment_alert_days?: number[] | null
          id?: string
          license_alert_days?: number[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string | null
          company: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          items_per_page: number | null
          language: string | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          items_per_page?: number | null
          language?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          items_per_page?: number | null
          language?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_client_dashboard: {
        Row: {
          alert_date: string | null
          alert_level: string | null
          alert_type: string | null
          client_id: string | null
          id: string | null
          item_name: string | null
          status: string | null
          type: string | null
        }
        Relationships: []
      }
      v_dashboard_alerts: {
        Row: {
          alert_date: string | null
          alert_level: string | null
          alert_type: string | null
          client_id: string | null
          client_name: string | null
          id: string | null
          item_name: string | null
          status: string | null
          type: string | null
        }
        Relationships: []
      }
      v_equipment_with_client: {
        Row: {
          actual_obsolescence_date: string | null
          brand: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          end_of_sale: string | null
          estimated_obsolescence_date: string | null
          id: string | null
          location: string | null
          model: string | null
          name: string | null
          purchase_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"] | null
          type_code: string | null
          type_icon: string | null
          type_id: string | null
          type_name: string | null
          updated_at: string | null
          warranty_end_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      v_license_durations: {
        Row: {
          duration_days: number | null
          id: string | null
          name: string | null
        }
        Insert: {
          duration_days?: never
          id?: string | null
          name?: string | null
        }
        Update: {
          duration_days?: never
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      v_licenses_with_client: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          editor: string | null
          expiry_date: string | null
          id: string | null
          license_key: string | null
          name: string | null
          purchase_date: string | null
          status: Database["public"]["Enums"]["license_status"] | null
          supplier_id: string | null
          supplier_name: string | null
          type_id: string | null
          updated_at: string | null
          version: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "license_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_equipment_status: {
        Args: {
          actual_obsolescence_date?: string
          current_status: Database["public"]["Enums"]["equipment_status"]
          end_of_sale?: string
          estimated_obsolescence_date?: string
        }
        Returns: Database["public"]["Enums"]["equipment_status"]
      }
      calculate_license_status: {
        Args: { expiry_date: string }
        Returns: Database["public"]["Enums"]["license_status"]
      }
      create_notification: {
        Args: {
          p_message: string
          p_related_id?: string
          p_related_type?: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      get_client_equipment_report: {
        Args: { client_uuid: string }
        Returns: {
          brand: string
          days_until_end_of_sale: number
          days_until_obsolescence: number
          end_of_sale: string
          equipment_name: string
          model: string
          obsolescence_date: string
          status: Database["public"]["Enums"]["equipment_status"]
          type_name: string
        }[]
      }
      get_client_licenses_report: {
        Args: { client_uuid: string }
        Returns: {
          cost: number
          days_until_expiry: number
          editor: string
          expiry_date: string
          license_name: string
          status: Database["public"]["Enums"]["license_status"]
        }[]
      }
      get_equipment_end_of_sale_alerts: {
        Args: { alert_days?: number }
        Returns: {
          alert_level: string
          brand: string
          client_name: string
          days_until_end_of_sale: number
          end_of_sale: string
          equipment_id: string
          equipment_name: string
          model: string
        }[]
      }
      get_equipment_stats_by_type: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_count: number
          obsolete_count: number
          percentage: number
          total_count: number
          type_code: string
          type_id: string
          type_name: string
        }[]
      }
      get_equipment_status_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          percentage: number
          status: Database["public"]["Enums"]["equipment_status"]
        }[]
      }
      get_expired_licenses_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_name: string
          cost: number
          days_expired: number
          expiry_date: string
          license_name: string
        }[]
      }
      get_license_duration_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_duration_days: number
          max_duration_days: number
          min_duration_days: number
          total_licenses_with_duration: number
        }[]
      }
      get_notification_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_obsolete_equipment_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          brand: string
          client_name: string
          days_obsolete: number
          equipment_name: string
          model: string
          obsolescence_date: string
          type_name: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: { user_uuid: string }
        Returns: Json
      }
      refresh_all_equipment_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          equipment_id: string
          equipment_name: string
          new_status: Database["public"]["Enums"]["equipment_status"]
          old_status: Database["public"]["Enums"]["equipment_status"]
          updated: boolean
        }[]
      }
      refresh_all_license_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          license_id: string
          license_name: string
          new_status: Database["public"]["Enums"]["license_status"]
          old_status: Database["public"]["Enums"]["license_status"]
          updated: boolean
        }[]
      }
    }
    Enums: {
      equipment_status:
        | "actif"
        | "en_maintenance"
        | "obsolete"
        | "bientot_obsolete"
        | "retire"
      license_status: "active" | "expired" | "about_to_expire" | "cancelled"
      notification_type:
        | "license_expiry"
        | "equipment_obsolescence"
        | "general"
        | "new_unverified_user"
      user_role: "admin" | "technicien" | "client" | "unverified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      equipment_status: [
        "actif",
        "en_maintenance",
        "obsolete",
        "bientot_obsolete",
        "retire",
      ],
      license_status: ["active", "expired", "about_to_expire", "cancelled"],
      notification_type: [
        "license_expiry",
        "equipment_obsolescence",
        "general",
        "new_unverified_user",
      ],
      user_role: ["admin", "technicien", "client", "unverified"],
    },
  },
} as const

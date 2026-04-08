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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          business_id: string
          data_snapshot: Json | null
          generated_at: string
          id: string
          insights_text: string
          week_end: string
          week_start: string
        }
        Insert: {
          business_id: string
          data_snapshot?: Json | null
          generated_at?: string
          id?: string
          insights_text: string
          week_end: string
          week_start: string
        }
        Update: {
          business_id?: string
          data_snapshot?: Json | null
          generated_at?: string
          id?: string
          insights_text?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily_stats: {
        Row: {
          bookings_canceled: number | null
          bookings_completed: number | null
          business_id: string
          date: string
          day_of_week: number | null
          id: string
          new_favorites: number | null
          new_reviews: number | null
          profile_views: number | null
          revenue: number | null
          unique_visitors: number | null
        }
        Insert: {
          bookings_canceled?: number | null
          bookings_completed?: number | null
          business_id: string
          date: string
          day_of_week?: number | null
          id?: string
          new_favorites?: number | null
          new_reviews?: number | null
          profile_views?: number | null
          revenue?: number | null
          unique_visitors?: number | null
        }
        Update: {
          bookings_canceled?: number | null
          bookings_completed?: number | null
          business_id?: string
          date?: string
          day_of_week?: number | null
          id?: string
          new_favorites?: number | null
          new_reviews?: number | null
          profile_views?: number | null
          revenue?: number | null
          unique_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          business_id: string
          canceled_at: string | null
          canceled_by: string | null
          cancellation_fee: number | null
          cancellation_fee_charged: boolean | null
          cancellation_fee_payment_intent_id: string | null
          cancellation_reason: string | null
          client_id: string
          client_package_id: string | null
          created_at: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          deposit_payment_intent_id: string | null
          id: string
          notes: string | null
          paid_with_package: boolean | null
          payment_method_type: string | null
          remaining_balance: number | null
          service_id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          tip_amount: number | null
          tip_collected: boolean | null
          total_price: number
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          business_id: string
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_fee?: number | null
          cancellation_fee_charged?: boolean | null
          cancellation_fee_payment_intent_id?: string | null
          cancellation_reason?: string | null
          client_id: string
          client_package_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_payment_intent_id?: string | null
          id?: string
          notes?: string | null
          paid_with_package?: boolean | null
          payment_method_type?: string | null
          remaining_balance?: number | null
          service_id: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          tip_amount?: number | null
          tip_collected?: boolean | null
          total_price: number
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          business_id?: string
          canceled_at?: string | null
          canceled_by?: string | null
          cancellation_fee?: number | null
          cancellation_fee_charged?: boolean | null
          cancellation_fee_payment_intent_id?: string | null
          cancellation_reason?: string | null
          client_id?: string
          client_package_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          deposit_payment_intent_id?: string | null
          id?: string
          notes?: string | null
          paid_with_package?: boolean | null
          payment_method_type?: string | null
          remaining_balance?: number | null
          service_id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          tip_amount?: number | null
          tip_collected?: boolean | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_bookings: {
        Row: {
          booking_id: string
          bundle_id: string
          created_at: string
          discount_applied: number
          final_total: number
          id: string
          original_total: number
        }
        Insert: {
          booking_id: string
          bundle_id: string
          created_at?: string
          discount_applied?: number
          final_total: number
          id?: string
          original_total: number
        }
        Update: {
          booking_id?: string
          bundle_id?: string
          created_at?: string
          discount_applied?: number
          final_total?: number
          id?: string
          original_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_bookings_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_id: string
          id: string
          service_id: string
          sort_order: number
        }
        Insert: {
          bundle_id: string
          id?: string
          service_id: string
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          id?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_availability: {
        Row: {
          business_id: string
          close_time: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string | null
        }
        Insert: {
          business_id: string
          close_time?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
        }
        Update: {
          business_id?: string
          close_time?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_availability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_memberships: {
        Row: {
          billing_interval: string
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          perks: string[] | null
          price: number
          service_ids: string[] | null
          sessions_per_period: number | null
          stripe_price_id: string | null
        }
        Insert: {
          billing_interval?: string
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          perks?: string[] | null
          price: number
          service_ids?: string[] | null
          sessions_per_period?: number | null
          stripe_price_id?: string | null
        }
        Update: {
          billing_interval?: string
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          perks?: string[] | null
          price?: number
          service_ids?: string[] | null
          sessions_per_period?: number | null
          stripe_price_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          bio: string | null
          cancellation_fee_amount: number | null
          cancellation_fee_type: string | null
          cancellation_hours: number | null
          cancellation_policy: string | null
          categories: string[] | null
          city: string | null
          cover_photo_url: string | null
          created_at: string
          credentials: string[] | null
          default_virtual_link: string | null
          deposit_amount: number | null
          deposit_required: boolean | null
          deposit_type: string | null
          description: string | null
          email: string | null
          hours: Json | null
          id: string
          is_black_owned: boolean | null
          is_featured: boolean | null
          is_hispanic_owned: boolean | null
          is_lgbtq_owned: boolean | null
          is_lgbtq_welcoming: boolean | null
          is_publicly_visible: boolean | null
          is_published: boolean | null
          is_verified: boolean | null
          location_lat: number | null
          location_lng: number | null
          name: string
          offers_appointments: boolean | null
          offers_classes: boolean | null
          offers_virtual: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          owner_id: string
          phone: string | null
          price_range: number | null
          profile_photo_url: string | null
          rating: number | null
          relisted_at: string | null
          review_count: number | null
          service_radius: number | null
          service_setting: Database["public"]["Enums"]["service_setting"] | null
          specialties: string[] | null
          state: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tip_presets: number[] | null
          tips_enabled: boolean | null
          trial_ends_at: string | null
          unlisted_at: string | null
          unlisted_reason: string | null
          updated_at: string
          view_count: number | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          cancellation_fee_amount?: number | null
          cancellation_fee_type?: string | null
          cancellation_hours?: number | null
          cancellation_policy?: string | null
          categories?: string[] | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string
          credentials?: string[] | null
          default_virtual_link?: string | null
          deposit_amount?: number | null
          deposit_required?: boolean | null
          deposit_type?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_black_owned?: boolean | null
          is_featured?: boolean | null
          is_hispanic_owned?: boolean | null
          is_lgbtq_owned?: boolean | null
          is_lgbtq_welcoming?: boolean | null
          is_publicly_visible?: boolean | null
          is_published?: boolean | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          offers_appointments?: boolean | null
          offers_classes?: boolean | null
          offers_virtual?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id: string
          phone?: string | null
          price_range?: number | null
          profile_photo_url?: string | null
          rating?: number | null
          relisted_at?: string | null
          review_count?: number | null
          service_radius?: number | null
          service_setting?:
            | Database["public"]["Enums"]["service_setting"]
            | null
          specialties?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tip_presets?: number[] | null
          tips_enabled?: boolean | null
          trial_ends_at?: string | null
          unlisted_at?: string | null
          unlisted_reason?: string | null
          updated_at?: string
          view_count?: number | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          cancellation_fee_amount?: number | null
          cancellation_fee_type?: string | null
          cancellation_hours?: number | null
          cancellation_policy?: string | null
          categories?: string[] | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string
          credentials?: string[] | null
          default_virtual_link?: string | null
          deposit_amount?: number | null
          deposit_required?: boolean | null
          deposit_type?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_black_owned?: boolean | null
          is_featured?: boolean | null
          is_hispanic_owned?: boolean | null
          is_lgbtq_owned?: boolean | null
          is_lgbtq_welcoming?: boolean | null
          is_publicly_visible?: boolean | null
          is_published?: boolean | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          offers_appointments?: boolean | null
          offers_classes?: boolean | null
          offers_virtual?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id?: string
          phone?: string | null
          price_range?: number | null
          profile_photo_url?: string | null
          rating?: number | null
          relisted_at?: string | null
          review_count?: number | null
          service_radius?: number | null
          service_setting?:
            | Database["public"]["Enums"]["service_setting"]
            | null
          specialties?: string[] | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tip_presets?: number[] | null
          tips_enabled?: boolean | null
          trial_ends_at?: string | null
          unlisted_at?: string | null
          unlisted_reason?: string | null
          updated_at?: string
          view_count?: number | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          amount_paid: number | null
          business_id: string
          canceled_at: string | null
          enrolled_at: string
          id: string
          payment_intent_id: string | null
          session_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          business_id: string
          canceled_at?: string | null
          enrolled_at?: string
          id?: string
          payment_intent_id?: string | null
          session_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          business_id?: string
          canceled_at?: string | null
          enrolled_at?: string
          id?: string
          payment_intent_id?: string | null
          session_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedules: {
        Row: {
          business_id: string
          capacity: number
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          instructor_id: string | null
          is_active: boolean | null
          is_free: boolean | null
          is_virtual: boolean | null
          name: string
          price: number
          virtual_link: string | null
        }
        Insert: {
          business_id: string
          capacity?: number
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_active?: boolean | null
          is_free?: boolean | null
          is_virtual?: boolean | null
          name: string
          price?: number
          virtual_link?: string | null
        }
        Update: {
          business_id?: string
          capacity?: number
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_active?: boolean | null
          is_free?: boolean | null
          is_virtual?: boolean | null
          name?: string
          price?: number
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          business_id: string
          cancel_reason: string | null
          capacity: number
          created_at: string
          end_time: string
          enrolled_count: number | null
          id: string
          is_canceled: boolean | null
          schedule_id: string
          session_date: string
          start_time: string
        }
        Insert: {
          business_id: string
          cancel_reason?: string | null
          capacity: number
          created_at?: string
          end_time: string
          enrolled_count?: number | null
          id?: string
          is_canceled?: boolean | null
          schedule_id: string
          session_date: string
          start_time: string
        }
        Update: {
          business_id?: string
          cancel_reason?: string | null
          capacity?: number
          created_at?: string
          end_time?: string
          enrolled_count?: number | null
          id?: string
          is_canceled?: boolean | null
          schedule_id?: string
          session_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      client_memberships: {
        Row: {
          business_id: string
          canceled_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          membership_id: string
          sessions_used_this_period: number | null
          started_at: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          canceled_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          membership_id: string
          sessions_used_this_period?: number | null
          started_at?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          canceled_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          membership_id?: string
          sessions_used_this_period?: number | null
          started_at?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "business_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          business_id: string
          client_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_pinned: boolean | null
          note_type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          business_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          package_id: string
          purchase_price: number
          purchased_at: string
          sessions_remaining: number
          sessions_total: number
          sessions_used: number | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          package_id: string
          purchase_price: number
          purchased_at?: string
          sessions_remaining: number
          sessions_total: number
          sessions_used?: number | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          package_id?: string
          purchase_price?: number
          purchased_at?: string
          sessions_remaining?: number
          sessions_total?: number
          sessions_used?: number | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_preferences: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          id: string
          preference_key: string
          preference_value: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          preference_key: string
          preference_value: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          preferences: Json | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          preferences?: Json | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      followup_logs: {
        Row: {
          booking_id: string | null
          business_id: string
          discount_code: string | null
          discount_used: boolean | null
          id: string
          message_type: string | null
          rebooked: boolean | null
          rebooked_at: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          business_id: string
          discount_code?: string | null
          discount_used?: boolean | null
          id?: string
          message_type?: string | null
          rebooked?: boolean | null
          rebooked_at?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          business_id?: string
          discount_code?: string | null
          discount_used?: boolean | null
          id?: string
          message_type?: string | null
          rebooked?: boolean | null
          rebooked_at?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_settings: {
        Row: {
          business_id: string
          created_at: string
          days_after_appointment: number | null
          discount_percent: number | null
          discount_valid_days: number | null
          followup_message: string | null
          id: string
          include_discount: boolean | null
          is_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          days_after_appointment?: number | null
          discount_percent?: number | null
          discount_valid_days?: number | null
          followup_message?: string | null
          id?: string
          include_discount?: boolean | null
          is_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          days_after_appointment?: number | null
          discount_percent?: number | null
          discount_valid_days?: number | null
          followup_message?: string | null
          id?: string
          include_discount?: boolean | null
          is_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "gallery_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_posts: {
        Row: {
          after_image_url: string
          before_image_url: string
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          likes_count: number | null
          service_id: string | null
          staff_id: string | null
          title: string | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          after_image_url: string
          before_image_url: string
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          service_id?: string | null
          staff_id?: string | null
          title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          after_image_url?: string
          before_image_url?: string
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          service_id?: string | null
          staff_id?: string | null
          title?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_posts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_posts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_form_questions: {
        Row: {
          form_id: string
          id: string
          is_required: boolean | null
          options: string[] | null
          placeholder: string | null
          question_text: string
          question_type: string
          sort_order: number | null
        }
        Insert: {
          form_id: string
          id?: string
          is_required?: boolean | null
          options?: string[] | null
          placeholder?: string | null
          question_text: string
          question_type?: string
          sort_order?: number | null
        }
        Update: {
          form_id?: string
          id?: string
          is_required?: boolean | null
          options?: string[] | null
          placeholder?: string | null
          question_text?: string
          question_type?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_form_submissions: {
        Row: {
          answers: Json
          booking_id: string | null
          business_id: string
          form_id: string
          id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          booking_id?: string | null
          business_id: string
          form_id: string
          id?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          booking_id?: string | null
          business_id?: string
          form_id?: string
          id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_form_submissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_form_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_forms: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          require_for_new_clients_only: boolean | null
          service_ids: string[] | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          require_for_new_clients_only?: boolean | null
          service_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          require_for_new_clients_only?: boolean | null
          service_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_forms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          min_redemption_points: number
          points_per_dollar: number
          redemption_rate: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          min_redemption_points?: number
          points_per_dollar?: number
          redemption_rate?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          min_redemption_points?: number
          points_per_dollar?: number
          redemption_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          business_id: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          status: string | null
          stripe_payment_intent_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          business_id: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          business_id?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          booking_id: string | null
          business_id: string
          created_at: string
          description: string | null
          id: string
          points: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_images: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_images_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          budget_preference: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          location_state: string | null
          location_zip: string | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone: string | null
          preferred_language: string | null
          privacy_accepted_at: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          saved_business_ids: string[] | null
          service_interests: string[] | null
          setting_preference:
            | Database["public"]["Enums"]["service_setting"]
            | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_preference?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_state?: string | null
          location_zip?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          preferred_language?: string | null
          privacy_accepted_at?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          saved_business_ids?: string[] | null
          service_interests?: string[] | null
          setting_preference?:
            | Database["public"]["Enums"]["service_setting"]
            | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_preference?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_state?: string | null
          location_zip?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone?: string | null
          preferred_language?: string | null
          privacy_accepted_at?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          saved_business_ids?: string[] | null
          service_interests?: string[] | null
          setting_preference?:
            | Database["public"]["Enums"]["service_setting"]
            | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotion_claims: {
        Row: {
          booking_id: string | null
          business_id: string
          claimed_at: string
          id: string
          promotion_id: string
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          business_id: string
          claimed_at?: string
          id?: string
          promotion_id: string
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          business_id?: string
          claimed_at?: string
          id?: string
          promotion_id?: string
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_claims_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_claims_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_claims_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          business_id: string
          code: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean | null
          is_new_client_only: boolean | null
          max_claims: number | null
          start_date: string
          title: string
          total_claimed: number | null
        }
        Insert: {
          business_id: string
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean | null
          is_new_client_only?: boolean | null
          max_claims?: number | null
          start_date: string
          title: string
          total_claimed?: number | null
        }
        Update: {
          business_id?: string
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_new_client_only?: boolean | null
          max_claims?: number | null
          start_date?: string
          title?: string
          total_claimed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          business_id: string
          business_reply: string | null
          business_reply_at: string | null
          client_id: string
          created_at: string
          flag_reason: string | null
          flagged_by: string | null
          id: string
          is_anonymous: boolean | null
          is_flagged: boolean | null
          is_removed: boolean | null
          is_resolved: boolean | null
          rating: number
          text: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          business_id: string
          business_reply?: string | null
          business_reply_at?: string | null
          client_id: string
          created_at?: string
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_removed?: boolean | null
          is_resolved?: boolean | null
          rating: number
          text?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          business_id?: string
          business_reply?: string | null
          business_reply_at?: string | null
          client_id?: string
          created_at?: string
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_flagged?: boolean | null
          is_removed?: boolean | null
          is_resolved?: boolean | null
          rating?: number
          text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bundles: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bundles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          original_price: number | null
          price: number
          service_ids: string[] | null
          session_count: number
          validity_days: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          original_price?: number | null
          price: number
          service_ids?: string[] | null
          session_count: number
          validity_days?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          service_ids?: string[] | null
          session_count?: number
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          category: string | null
          class_capacity: number | null
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          is_class: boolean | null
          is_virtual: boolean | null
          name: string
          price: number
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          class_capacity?: number | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          is_class?: boolean | null
          is_virtual?: boolean | null
          name: string
          price: number
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          class_capacity?: number | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          is_class?: boolean | null
          is_virtual?: boolean | null
          name?: string
          price?: number
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_commissions: {
        Row: {
          booking_id: string
          business_id: string
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          is_paid: boolean | null
          paid_at: string | null
          service_price: number
          staff_id: string
          tip_amount: number | null
        }
        Insert: {
          booking_id: string
          business_id: string
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at?: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          service_price: number
          staff_id: string
          tip_amount?: number | null
        }
        Update: {
          booking_id?: string
          business_id?: string
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          service_price?: number
          staff_id?: string
          tip_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_commissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_commissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          bio: string | null
          business_id: string
          commission_rate: number | null
          commission_type: string | null
          created_at: string
          display_order: number | null
          email: string | null
          id: string
          is_accepting_bookings: boolean | null
          is_active: boolean | null
          name: string
          phone: string | null
          profile_photo_url: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          business_id: string
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          is_accepting_bookings?: boolean | null
          is_active?: boolean | null
          name: string
          phone?: string | null
          profile_photo_url?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          business_id?: string
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          id?: string
          is_accepting_bookings?: boolean | null
          is_active?: boolean | null
          name?: string
          phone?: string | null
          profile_photo_url?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          staff_id: string
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          staff_id: string
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          custom_duration: number | null
          custom_price: number | null
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          custom_duration?: number | null
          custom_price?: number | null
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          custom_duration?: number | null
          custom_price?: number | null
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_off: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string | null
          staff_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          staff_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_business_interests: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          interaction_type: string | null
          subscriber_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          subscriber_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_business_interests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_business_interests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "email_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_inquiries: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          id: string
          message: string
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          id?: string
          message: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          id?: string
          message?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          block_date: string
          business_id: string
          created_at: string
          end_time: string
          id: string
          is_all_day: boolean | null
          notes: string | null
          reason: string | null
          staff_id: string | null
          start_time: string
        }
        Insert: {
          block_date: string
          business_id: string
          created_at?: string
          end_time?: string
          id?: string
          is_all_day?: boolean | null
          notes?: string | null
          reason?: string | null
          staff_id?: string | null
          start_time?: string
        }
        Update: {
          block_date?: string
          business_id?: string
          created_at?: string
          end_time?: string
          id?: string
          is_all_day?: boolean | null
          notes?: string | null
          reason?: string | null
          staff_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_blocks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_usage: {
        Row: {
          business_id: string | null
          email: string
          id: string
          used_at: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          email: string
          id?: string
          used_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          email?: string
          id?: string
          used_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          business_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_loyalty_points: {
        Row: {
          business_id: string
          id: string
          lifetime_points: number
          points_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loyalty_points_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string | null
          flexible_dates: boolean | null
          id: string
          notes: string | null
          notified_at: string | null
          preferred_date: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          service_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string | null
          flexible_dates?: boolean | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          service_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string | null
          flexible_dates?: boolean | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          preferred_date?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          service_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_notifications: {
        Row: {
          available_date: string
          available_time: string
          created_at: string
          id: string
          responded_at: string | null
          response: string
          waitlist_entry_id: string
        }
        Insert: {
          available_date: string
          available_time: string
          created_at?: string
          id?: string
          responded_at?: string | null
          response?: string
          waitlist_entry_id: string
        }
        Update: {
          available_date?: string
          available_time?: string
          created_at?: string
          id?: string
          responded_at?: string | null
          response?: string
          waitlist_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_notifications_waitlist_entry_id_fkey"
            columns: ["waitlist_entry_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      has_used_trial: { Args: { check_email: string }; Returns: boolean }
      record_trial_usage: {
        Args: { p_business_id: string; p_email: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "completed" | "canceled"
      service_setting: "in_studio" | "mobile" | "both"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
      subscription_tier: "basic" | "pro" | "elite"
      user_role: "client" | "business"
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
      booking_status: ["pending", "confirmed", "completed", "canceled"],
      service_setting: ["in_studio", "mobile", "both"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
      ],
      subscription_tier: ["basic", "pro", "elite"],
      user_role: ["client", "business"],
    },
  },
} as const

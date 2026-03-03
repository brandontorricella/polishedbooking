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
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          business_id: string
          client_id: string
          created_at: string
          id: string
          notes: string | null
          service_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
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
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
      businesses: {
        Row: {
          address: string | null
          bio: string | null
          categories: string[] | null
          city: string | null
          cover_photo_url: string | null
          created_at: string
          description: string | null
          email: string | null
          hours: Json | null
          id: string
          is_black_owned: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          is_verified: boolean | null
          location_lat: number | null
          location_lng: number | null
          name: string
          owner_id: string
          phone: string | null
          price_range: number | null
          profile_photo_url: string | null
          rating: number | null
          review_count: number | null
          service_radius: number | null
          service_setting: Database["public"]["Enums"]["service_setting"] | null
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
          trial_ends_at: string | null
          updated_at: string
          view_count: number | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          categories?: string[] | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_black_owned?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          owner_id: string
          phone?: string | null
          price_range?: number | null
          profile_photo_url?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius?: number | null
          service_setting?:
            | Database["public"]["Enums"]["service_setting"]
            | null
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
          trial_ends_at?: string | null
          updated_at?: string
          view_count?: number | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          categories?: string[] | null
          city?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_black_owned?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          price_range?: number | null
          profile_photo_url?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius?: number | null
          service_setting?:
            | Database["public"]["Enums"]["service_setting"]
            | null
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
          trial_ends_at?: string | null
          updated_at?: string
          view_count?: number | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
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
          start_date: string
          title: string
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
          start_date: string
          title: string
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
          start_date?: string
          title?: string
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
          business_id: string
          client_id: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          rating: number
          text: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          rating: number
          text?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          rating?: number
          text?: string | null
          updated_at?: string
        }
        Relationships: [
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
      services: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
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

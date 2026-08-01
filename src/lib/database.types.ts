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
    PostgrestVersion: "14.15"
  }
  ggsm: {
    Tables: {
      app_health: {
        Row: {
          checked_at: string
          id: string
          label: string
        }
        Insert: {
          checked_at?: string
          id?: string
          label: string
        }
        Update: {
          checked_at?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      athlete_checks: {
        Row: {
          athlete_id: string
          checked_on: string
          created_at: string
          id: string
          note: string
        }
        Insert: {
          athlete_id: string
          checked_on?: string
          created_at?: string
          id?: string
          note?: string
        }
        Update: {
          athlete_id?: string
          checked_on?: string
          created_at?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_checks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          check_every_days: number
          created_at: string
          disciplines: string[]
          facebook_url: string
          id: string
          instagram_url: string
          is_active: boolean
          is_starred: boolean
          name: string
          note: string
          updated_at: string
        }
        Insert: {
          check_every_days?: number
          created_at?: string
          disciplines?: string[]
          facebook_url?: string
          id?: string
          instagram_url?: string
          is_active?: boolean
          is_starred?: boolean
          name: string
          note?: string
          updated_at?: string
        }
        Update: {
          check_every_days?: number
          created_at?: string
          disciplines?: string[]
          facebook_url?: string
          id?: string
          instagram_url?: string
          is_active?: boolean
          is_starred?: boolean
          name?: string
          note?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          locale: string | null
          name: string
          platform: string
          reminder_after_days: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string | null
          name: string
          platform: string
          reminder_after_days?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string | null
          name?: string
          platform?: string
          reminder_after_days?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contests: {
        Row: {
          channel_id: string | null
          created_at: string
          ends_on: string
          id: string
          name: string
          note: string
          prize: string
          starts_on: string
          status: string
          tracking_code: string
          updated_at: string
          url: string
          winner_address: string
          winner_contact: string
          winner_name: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          ends_on: string
          id?: string
          name: string
          note?: string
          prize?: string
          starts_on: string
          status?: string
          tracking_code?: string
          updated_at?: string
          url?: string
          winner_address?: string
          winner_contact?: string
          winner_name?: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          ends_on?: string
          id?: string
          name?: string
          note?: string
          prize?: string
          starts_on?: string
          status?: string
          tracking_code?: string
          updated_at?: string
          url?: string
          winner_address?: string
          winner_contact?: string
          winner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contests_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          is_sponsored: boolean
          kind: string
          name: string
          note: string
          place: string
          promo_lead_days: number
          starts_on: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          is_sponsored?: boolean
          kind?: string
          name: string
          note?: string
          place?: string
          promo_lead_days?: number
          starts_on: string
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          is_sponsored?: boolean
          kind?: string
          name?: string
          note?: string
          place?: string
          promo_lead_days?: number
          starts_on?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          created_at: string
          detail: string
          id: string
          kind: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_types: {
        Row: {
          code: string
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          channel_id: string
          contest_id: string | null
          created_at: string
          event_id: string | null
          id: string
          note: string
          post_type_id: string | null
          publish_on: string
          status: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          channel_id: string
          contest_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          note?: string
          post_type_id?: string | null
          publish_on: string
          status?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Update: {
          channel_id?: string
          contest_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          note?: string
          post_type_id?: string | null
          publish_on?: string
          status?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_post_type_id_fkey"
            columns: ["post_type_id"]
            isOneToOne: false
            referencedRelation: "post_types"
            referencedColumns: ["id"]
          },
        ]
      }
      recording_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          athlete_id: string | null
          created_at: string
          id: string
          idea: string
          is_done: boolean
          note: string
          reference_url: string
          stage_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          id?: string
          idea?: string
          is_done?: boolean
          note?: string
          reference_url?: string
          stage_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          id?: string
          idea?: string
          is_done?: boolean
          note?: string
          reference_url?: string
          stage_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "recording_stages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  ggsm: {
    Enums: {},
  },
} as const

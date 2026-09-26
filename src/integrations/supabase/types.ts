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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analysis_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          opponent_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          opponent_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          opponent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_files_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "opponents"
            referencedColumns: ["id"]
          },
        ]
      }
      client_login_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_address: unknown
          login_code: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_address?: unknown
          login_code: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_address?: unknown
          login_code?: string
          success?: boolean
        }
        Relationships: []
      }
      client_sessions: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_active: string
          login_code: string
          session_token: string | null
          user_agent: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_active?: string
          login_code: string
          session_token?: string | null
          user_agent?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_active?: string
          login_code?: string
          session_token?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          login_code: string
          name: string
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          login_code: string
          name: string
          type: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          login_code?: string
          name?: string
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: []
      }
      contact_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          last_submission: string | null
          submission_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: unknown
          last_submission?: string | null
          submission_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          last_submission?: string | null
          submission_count?: number | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      deck_files: {
        Row: {
          card_ids: number[] | null
          created_at: string
          deck_link: string
          deck_name: string
          deck_number: number
          deck_set_id: string
          id: string
        }
        Insert: {
          card_ids?: number[] | null
          created_at?: string
          deck_link: string
          deck_name: string
          deck_number: number
          deck_set_id: string
          id?: string
        }
        Update: {
          card_ids?: number[] | null
          created_at?: string
          deck_link?: string
          deck_name?: string
          deck_number?: number
          deck_set_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_files_deck_set_id_fkey"
            columns: ["deck_set_id"]
            isOneToOne: false
            referencedRelation: "deck_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_sets: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_sets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      opponents: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opponents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_security_audit: {
        Args: never
        Returns: {
          has_anon_policies: boolean
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      arc_crew_create: {
        Args: { p_flag: Json; p_name: string }
        Returns: string
      }
      arc_crew_edit: {
        Args: { p_flag: Json; p_name: string }
        Returns: undefined
      }
      arc_crew_join: { Args: { p_code: string }; Returns: string }
      arc_crew_kick: { Args: { p_user: string }; Returns: undefined }
      arc_crew_leave: { Args: never; Returns: undefined }
      arc_cron_check: { Args: { p_secret: string }; Returns: boolean }
      arc_delete_account: { Args: never; Returns: undefined }
      arc_friend_add: { Args: { p_code: string }; Returns: string }
      arc_friend_answer: {
        Args: { p_accept: boolean; p_user: string }
        Returns: undefined
      }
      arc_friend_remove: { Args: { p_user: string }; Returns: undefined }
      arc_gym_create: {
        Args: { p_city: string; p_name: string }
        Returns: string
      }
      arc_gym_find: { Args: { p_query: string }; Returns: Json }
      arc_gym_join: { Args: { p_code: string }; Returns: string }
      arc_gym_leave: { Args: never; Returns: undefined }
      arc_gym_visible: { Args: { p_visible: boolean }; Returns: undefined }
      arc_pull: {
        Args: { p_limit?: number; p_since?: number }
        Returns: {
          data: Json
          deleted: boolean
          id: string
          kind: string
          rev: number
        }[]
      }
      arc_push: { Args: { p_rows: Json }; Returns: number }
      arc_push_result: {
        Args: { p_endpoint: string; p_gone: boolean; p_ok: boolean }
        Returns: undefined
      }
      arc_push_subscribe: {
        Args: { p_auth: string; p_endpoint: string; p_p256dh: string }
        Returns: undefined
      }
      arc_push_unsubscribe: { Args: { p_endpoint: string }; Returns: undefined }
      arc_reminder_claim: {
        Args: {
          p_channel: string
          p_day: string
          p_slot: string
          p_user: string
        }
        Returns: boolean
      }
      arc_reminder_config: { Args: never; Returns: Json }
      arc_reminder_targets: {
        Args: { p_user?: string }
        Returns: {
          email: string
          pauses: Json
          plan: Json
          subs: Json
          user_id: string
        }[]
      }
      arc_set_email_ready: { Args: { p_ready: boolean }; Returns: undefined }
      arc_social_disable: { Args: never; Returns: undefined }
      arc_social_publish: {
        Args: {
          p_card: Json
          p_create?: boolean
          p_name: string
          p_share_times?: boolean
          p_slots?: Json
        }
        Returns: string
      }
      arc_social_state: { Args: never; Returns: Json }
      arc_vapid_init: {
        Args: { p_private: string; p_public: string }
        Returns: Json
      }
      arc_vapid_keys: { Args: never; Returns: Json }
      audit_table_security: {
        Args: never
        Returns: {
          has_anon_policies: boolean
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      authenticate_client_secure: {
        Args: {
          ip_address_param?: unknown
          login_code_param: string
          user_agent_param?: string
        }
        Returns: {
          client_id: string
          client_name: string
          client_type: Database["public"]["Enums"]["client_type"]
          is_active: boolean
          session_token: string
        }[]
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      energy_dashboard: { Args: never; Returns: Json }
      fragrance_status: { Args: never; Returns: Json }
      generate_secure_login_code: { Args: never; Returns: string }
      get_admin_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      get_client_analysis_files_secure: {
        Args: { session_token_param: string }
        Returns: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          opponent_id: string
        }[]
      }
      get_client_deck_files_secure: {
        Args: { session_token_param: string }
        Returns: {
          card_ids: number[]
          created_at: string
          deck_link: string
          deck_name: string
          deck_number: number
          deck_set_id: string
          id: string
        }[]
      }
      get_client_deck_sets_secure: {
        Args: { session_token_param: string }
        Returns: {
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
        }[]
      }
      get_client_opponents_secure: {
        Args: { session_token_param: string }
        Returns: {
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
        }[]
      }
      get_session_client_info: {
        Args: { session_token_param: string }
        Returns: {
          client_id: string
          client_name: string
          client_type: Database["public"]["Enums"]["client_type"]
        }[]
      }
      github_contributions: { Args: never; Returns: Json }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      log_fragrance: {
        Args: { p_house?: string; p_name: string; p_token: string }
        Returns: Json
      }
      privacy_retention_cleanup: { Args: never; Returns: undefined }
      racing_index: { Args: never; Returns: Json }
      racing_race: { Args: { p_session_key: number }; Returns: Json }
      racing_season: { Args: { p_year: number }; Returns: Json }
      security_maintenance: { Args: never; Returns: undefined }
      submit_contact_form_secure: {
        Args: {
          email_param: string
          ip_address_param?: unknown
          message_param: string
          name_param: string
        }
        Returns: string
      }
      validate_client_session: {
        Args: { session_token_param: string }
        Returns: {
          client_id: string
          client_name: string
          client_type: Database["public"]["Enums"]["client_type"]
        }[]
      }
    }
    Enums: {
      admin_role: "super_admin" | "admin"
      client_type: "player" | "team"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      admin_role: ["super_admin", "admin"],
      client_type: ["player", "team"],
    },
  },
} as const

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
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          store_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          store_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          mode: Database["public"]["Enums"]["loyalty_mode"]
          points_per_currency: number
          stamps_required: number
          store_id: string
          updated_at: string
          welcome_points: number
          welcome_stamps: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["loyalty_mode"]
          points_per_currency?: number
          stamps_required?: number
          store_id: string
          updated_at?: string
          welcome_points?: number
          welcome_stamps?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          mode?: Database["public"]["Enums"]["loyalty_mode"]
          points_per_currency?: number
          stamps_required?: number
          store_id?: string
          updated_at?: string
          welcome_points?: number
          welcome_stamps?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          customer_id: string
          id: string
          joined_at: string
          last_activity_at: string
          lifetime_points: number
          lifetime_stamps: number
          points_balance: number
          stamps_balance: number
          status: string
          store_id: string
          welcome_granted: boolean
        }
        Insert: {
          customer_id: string
          id?: string
          joined_at?: string
          last_activity_at?: string
          lifetime_points?: number
          lifetime_stamps?: number
          points_balance?: number
          stamps_balance?: number
          status?: string
          store_id: string
          welcome_granted?: boolean
        }
        Update: {
          customer_id?: string
          id?: string
          joined_at?: string
          last_activity_at?: string
          lifetime_points?: number
          lifetime_stamps?: number
          points_balance?: number
          stamps_balance?: number
          status?: string
          store_id?: string
          welcome_granted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          customer_id: string
          delivered: boolean
          delivered_at: string | null
          error: string | null
          event_type: string
          id: string
          payload: Json
          store_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivered?: boolean
          delivered_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          store_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivered?: boolean
          delivered_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_merchant: boolean
          language: string
          notifications_enabled: boolean
          telegram_id: number | null
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_merchant?: boolean
          language?: string
          notifications_enabled?: boolean
          telegram_id?: number | null
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_merchant?: boolean
          language?: string
          notifications_enabled?: boolean
          telegram_id?: number | null
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qr_tokens: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          kind: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string
          id?: string
          kind?: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          kind?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          membership_id: string
          points_spent: number
          redeemed_at: string | null
          redeemed_by: string | null
          reward_id: string
          stamps_spent: number
          status: string
          store_id: string
          token: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string
          id?: string
          membership_id: string
          points_spent?: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          reward_id: string
          stamps_spent?: number
          status?: string
          store_id: string
          token?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          membership_id?: string
          points_spent?: number
          redeemed_at?: string | null
          redeemed_by?: string | null
          reward_id?: string
          stamps_spent?: number
          status?: string
          store_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_cost: number | null
          program_id: string | null
          stamps_cost: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_cost?: number | null
          program_id?: string | null
          stamps_cost?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_cost?: number | null
          program_id?: string | null
          stamps_cost?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          category: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          join_token: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          join_token?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          join_token?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          actor_id: string | null
          created_at: string
          customer_id: string
          id: string
          membership_id: string
          note: string | null
          points_delta: number
          purchase_amount: number | null
          reward_id: string | null
          stamps_delta: number
          store_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          membership_id: string
          note?: string | null
          points_delta?: number
          purchase_amount?: number | null
          reward_id?: string | null
          stamps_delta?: number
          store_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          membership_id?: string
          note?: string | null
          points_delta?: number
          purchase_amount?: number | null
          reward_id?: string | null
          stamps_delta?: number
          store_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_loyalty: {
        Args: {
          _action?: string
          _amount?: number
          _store_id: string
          _token: string
        }
        Returns: Json
      }
      confirm_redemption: {
        Args: { _store_id: string; _token: string }
        Returns: Json
      }
      get_store_by_join_token: {
        Args: { _token: string }
        Returns: {
          already_member: boolean
          category: string
          currency: string
          logo_url: string
          mode: Database["public"]["Enums"]["loyalty_mode"]
          points_per_currency: number
          stamps_required: number
          store_id: string
          store_name: string
          welcome_points: number
          welcome_stamps: number
        }[]
      }
      is_store_owner: { Args: { _store_id: string }; Returns: boolean }
      issue_customer_qr: { Args: never; Returns: string }
      join_store: { Args: { _token: string }; Returns: Json }
      lookup_customer_qr: {
        Args: { _store_id: string; _token: string }
        Returns: Json
      }
      redeem_reward: {
        Args: { _membership_id: string; _reward_id: string }
        Returns: Json
      }
      store_stats: { Args: { _store_id: string }; Returns: Json }
      validate_reward_token: {
        Args: { _store_id: string; _token: string }
        Returns: Json
      }
    }
    Enums: {
      loyalty_mode: "points" | "stamps"
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
      loyalty_mode: ["points", "stamps"],
    },
  },
} as const

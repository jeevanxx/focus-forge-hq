export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          notes: string | null
          done: boolean
          priority: "low" | "med" | "high"
          due_date: string
          estimate_min: number | null
          tag: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          notes?: string | null
          done?: boolean
          priority?: "low" | "med" | "high"
          due_date: string
          estimate_min?: number | null
          tag?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string
          streak: number
          target: number
          color: "ember" | "amber" | "violet" | "teal"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          emoji?: string
          streak?: number
          target?: number
          color?: "ember" | "amber" | "violet" | "teal"
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["habits"]["Insert"]>
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          logged_date: string
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          logged_date: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["habit_logs"]["Insert"]>
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          duration_min: number
          task_title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          duration_min: number
          task_title?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["focus_sessions"]["Insert"]>
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> =
  (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export const Constants = { public: { Enums: {} } } as const

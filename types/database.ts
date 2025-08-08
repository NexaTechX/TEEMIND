export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
      }
      mindmaps: {
        Row: {
          id: string
          message_id: string
          mindmap_data: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          mindmap_data: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          mindmap_data?: string
          created_at?: string
        }
      }
      knowledge_chunks: {
        Row: {
          id: string
          content: string
          metadata: Json
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          content: string
          metadata: Json
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          metadata?: Json
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
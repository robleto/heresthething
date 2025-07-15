import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for public operations (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations with elevated permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type Database = {
  public: {
    Tables: {
      advice_items: {
        Row: {
          id: string
          notion_id: string
          title: string
          slug: string
          image_url: string | null
          optimized_image_url: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          notion_id: string
          title: string
          slug: string
          image_url?: string | null
          optimized_image_url?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          notion_id?: string
          title?: string
          slug?: string
          image_url?: string | null
          optimized_image_url?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
    }
  }
}

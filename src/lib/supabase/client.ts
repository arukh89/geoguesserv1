import { createBrowserClient } from "@supabase/ssr"

const DEFAULT_SUPABASE_URL = "https://nlnayrlaohukkxejlxsy.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbmF5cmxhb2h1a2t4ZWpseHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTkwMzEsImV4cCI6MjA4MTE3NTAzMX0.kvLl0bMPNy_pC_XG3hIlRs2ryknjJPrzK5k1zQS92eI"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check your .env file.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export { createClient as createBrowserClient }

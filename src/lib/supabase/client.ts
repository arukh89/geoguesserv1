import { createBrowserClient } from "@supabase/ssr"

// Supabase project configuration for nlnayrlaohukkxejlxsy
const SUPABASE_URL = "https://nlnayrlaohukkxejlxsy.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sbmF5cmxhb2h1a2t4ZWpseHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTkwMzEsImV4cCI6MjA4MTE3NTAzMX0.kvLl0bMPNy_pC_XG3hIlRs2ryknjJPrzK5k1zQS92eI"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
  )
}

export { createClient as createBrowserClient }

import { createBrowserClient } from "@supabase/ssr"

const DEFAULT_SUPABASE_URL = "https://igcvudmczeanduochpyj.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnY3Z1ZG1jemVhbmR1b2NocHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTg4MDgsImV4cCI6MjA4MTIzNDgwOH0._By2t3ygx0tx-uJuEjiuj9k08qpo215voZgEqfnYkck"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  )
}

export { createClient as createBrowserClient }

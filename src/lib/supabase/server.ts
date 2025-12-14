import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const DEFAULT_SUPABASE_URL = "https://igcvudmczeanduochpyj.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnY3Z1ZG1jemVhbmR1b2NocHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTg4MDgsImV4cCI6MjA4MTIzNDgwOH0._By2t3ygx0tx-uJuEjiuj9k08qpo215voZgEqfnYkck"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

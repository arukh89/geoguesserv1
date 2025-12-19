import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

/**
 * Create a Supabase client for browser-side usage
 * Uses anon key for public operations
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Alias for backward compatibility - both functions are identical
export const createBrowserClient = createClient

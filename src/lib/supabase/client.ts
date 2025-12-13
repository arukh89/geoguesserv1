import { createBrowserClient } from "@supabase/ssr"

const DEFAULT_SUPABASE_URL = "https://example.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY = "public-anon-key"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  )
}

export { createClient as createBrowserClient }

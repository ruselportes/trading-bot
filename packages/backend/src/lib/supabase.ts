import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY — DB will not be available')
    return null
  }

  client = createClient(url, key)
  return client
}

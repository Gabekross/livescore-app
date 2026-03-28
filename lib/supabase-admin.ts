// lib/supabase-admin.ts
// Server-only Supabase client using the SERVICE ROLE key.
// Use ONLY in API routes for admin operations (creating users, etc).
// NEVER import from client components or expose the service role key.

import { createClient } from '@supabase/supabase-js'

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL env vars. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (never prefix with NEXT_PUBLIC_).'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

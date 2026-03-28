// lib/org-server.ts
// SERVER-ONLY — do NOT import this in any 'use client' component or
// any module that is transitively imported by a client component.
// Use lib/org.ts → getOrganizationId() for client-side org resolution instead.
//
// Resolution order:
//   1. x-org-slug header (set by middleware from subdomain)
//   2. NEXT_PUBLIC_ORGANIZATION_SLUG env var (single-org fallback)

import { headers } from 'next/headers'
import { createServerSupabaseClient } from './supabase-server'

/**
 * Resolves the current organization's UUID on the server side.
 * Use in: Server Components, Server Actions, API Route handlers.
 */
export async function getOrganizationIdServer(): Promise<string> {
  const headerStore = headers()
  const slug = headerStore.get('x-org-slug') || process.env.NEXT_PUBLIC_ORGANIZATION_SLUG

  if (!slug) {
    throw new Error(
      'Could not determine organization. ' +
      'Access the site via a subdomain (e.g. my-league.yourdomain.com) ' +
      'or set NEXT_PUBLIC_ORGANIZATION_SLUG in .env.local.'
    )
  }

  const supabaseServer = createServerSupabaseClient()

  const { data, error } = await supabaseServer
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw new Error(`Organization with slug '${slug}' not found.`)
  }

  return data.id
}

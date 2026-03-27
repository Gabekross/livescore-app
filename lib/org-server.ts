// lib/org-server.ts
// SERVER-ONLY — do NOT import this in any 'use client' component or
// any module that is transitively imported by a client component.
// Use lib/org.ts → getOrganizationId() for client-side org resolution instead.

import { createServerSupabaseClient } from './supabase-server'

/**
 * Resolves the current organization's UUID on the server side.
 * Use in: Server Components, Server Actions, API Route handlers.
 */
export async function getOrganizationIdServer(domainHint?: string): Promise<string> {
  // Server-side has no persistent module cache between requests in serverless.
  // For single-org deployments the slug→UUID lookup is fast (indexed).
  const supabaseServer = createServerSupabaseClient()

  const slug = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG
  if (!slug) {
    throw new Error('NEXT_PUBLIC_ORGANIZATION_SLUG is not set.')
  }

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

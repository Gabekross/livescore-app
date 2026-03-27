// lib/org.ts
// Organization resolution for the current deployment.
//
// Strategy: env-var based (NEXT_PUBLIC_ORGANIZATION_SLUG).
// The slug is resolved to an organization_id on first call and cached in memory.
//
// Extension point: resolveOrganization() accepts an optional domainHint parameter.
// When domain-based routing is added, pass the request hostname here and this
// function will query organizations.domain instead of the env-var slug.
// No other code needs to change — callers always get back an org UUID.

import { supabase } from './supabase'

// Module-level cache — survives the component lifecycle, reset on page refresh.
// In server-side code (RSC, API routes) use the server client version below.
let _cachedOrgId: string | null = null

export async function getOrganizationId(domainHint?: string): Promise<string> {
  if (_cachedOrgId) return _cachedOrgId

  // Future: if domainHint is provided, resolve by domain column instead.
  // const column = domainHint ? 'domain' : 'slug'
  // const value  = domainHint ?? process.env.NEXT_PUBLIC_ORGANIZATION_SLUG
  const slug = process.env.NEXT_PUBLIC_ORGANIZATION_SLUG
  if (!slug) {
    throw new Error(
      'NEXT_PUBLIC_ORGANIZATION_SLUG is not set. ' +
      'Add it to .env.local (e.g. NEXT_PUBLIC_ORGANIZATION_SLUG=jcl26).'
    )
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw new Error(
      `Organization with slug '${slug}' not found. ` +
      'Run supabase/seed.sql against your Supabase project first.'
    )
  }

  _cachedOrgId = data.id as string
  return _cachedOrgId
}

// ─── Server-side version ──────────────────────────────────────────────────────
// Moved to lib/org-server.ts to prevent Next.js from tracing next/headers into
// the client bundle. Import getOrganizationIdServer from '@/lib/org-server'.

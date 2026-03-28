// lib/org.ts
// Client-side organization resolution.
//
// Resolution order:
//   1. Subdomain from window.location.hostname
//   2. NEXT_PUBLIC_ORGANIZATION_SLUG env var (single-org fallback)
//
// The slug is resolved to an organization_id on first call and cached in memory.

import { supabase } from './supabase'
import { getOrgSlugFromHostname } from './subdomain'

// Module-level cache — survives the component lifecycle, reset on page refresh.
let _cachedOrgId: string | null = null

export async function getOrganizationId(): Promise<string> {
  if (_cachedOrgId) return _cachedOrgId

  // Try subdomain first, then env var fallback
  const slug = (typeof window !== 'undefined' ? getOrgSlugFromHostname(window.location.hostname) : null)
    || process.env.NEXT_PUBLIC_ORGANIZATION_SLUG

  if (!slug) {
    throw new Error(
      'Could not determine organization. ' +
      'Access the site via a subdomain (e.g. my-league.yourdomain.com) ' +
      'or set NEXT_PUBLIC_ORGANIZATION_SLUG in .env.local.'
    )
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw new Error(`Organization with slug '${slug}' not found.`)
  }

  _cachedOrgId = data.id as string
  return _cachedOrgId
}

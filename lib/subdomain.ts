// lib/subdomain.ts
// Shared subdomain extraction logic used by middleware, server components,
// and client components.
//
// Convention:
//   {org-slug}.localhost:3000     (dev)
//   {org-slug}.yourdomain.com    (prod)
//
// Admin/auth pages work on any subdomain — org is resolved from the user's profile.
// Public pages resolve org from the subdomain.

/**
 * Extracts the organization slug from a hostname.
 * Returns null if the hostname has no subdomain (bare root domain).
 *
 * Examples:
 *   "jcl26.localhost"       → "jcl26"
 *   "my-league.example.com" → "my-league"
 *   "localhost"              → null
 *   "example.com"           → null
 *   "www.example.com"       → "www" (caller can filter)
 */
export function extractSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(':')[0]

  // localhost special case: jcl26.localhost → "jcl26"
  if (host === 'localhost' || host === '127.0.0.1') return null
  if (host.endsWith('.localhost')) {
    const sub = host.slice(0, -'.localhost'.length)
    return sub || null
  }

  // IP addresses — no subdomains
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null

  // Standard domain: split by dots
  const parts = host.split('.')

  // "example.com" → 2 parts → no subdomain
  // "jcl26.example.com" → 3 parts → subdomain = "jcl26"
  // "jcl26.co.uk" → 3 parts but co.uk is TLD — handle common cases
  // For simplicity, if ROOT_DOMAIN env is set, use it; otherwise assume
  // last 2 parts are the root domain.
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (rootDomain) {
    const root = rootDomain.split(':')[0] // strip port from root domain too
    if (host === root) return null
    if (host.endsWith('.' + root)) {
      const sub = host.slice(0, -(root.length + 1))
      return sub || null
    }
    return null // hostname doesn't match root domain at all
  }

  // Fallback: assume last 2 segments are the root domain
  if (parts.length <= 2) return null
  return parts[0] || null
}

/** Reserved subdomains that should not resolve to an organization */
const RESERVED = new Set(['www', 'admin', 'api', 'app', 'mail', 'ftp'])

/**
 * Returns the org slug from the hostname, or null if it's a reserved/missing subdomain.
 */
export function getOrgSlugFromHostname(hostname: string): string | null {
  const sub = extractSubdomain(hostname)
  if (!sub || RESERVED.has(sub)) return null
  return sub
}

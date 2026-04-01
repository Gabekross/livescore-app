// lib/seo.ts
// Centralised SEO / URL helpers for consistent canonical URLs, sitemap
// generation, and metadata across the multi-tenant platform.
//
// Production hostname layout:
//   www.kolusports.com      → main public site
//   kolusports.com          → redirects to www (handled by Vercel)
//   app.kolusports.com      → admin area
//   {org}.kolusports.com    → tenant public sites
//
// Environment variables used:
//   NEXT_PUBLIC_SITE_URL     → primary canonical origin (e.g. https://www.kolusports.com)
//   NEXT_PUBLIC_ROOT_DOMAIN  → bare root domain (e.g. kolusports.com)

/**
 * The primary public-site origin used for SEO output (sitemap, robots,
 * canonical URLs, OG metadata).  Strips trailing slash.
 *
 * In production this must be set to `https://www.kolusports.com`.
 * Falls back to localhost for local development.
 */
export const CANONICAL_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? 'http://localhost:3000'

/**
 * Build an absolute canonical URL for a given pathname.
 * Always uses the primary canonical origin (www).
 */
export function canonicalUrl(pathname: string): string {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${CANONICAL_ORIGIN}${clean}`
}

/**
 * Resolve the correct metadataBase URL for a request.
 *
 * - For the main site (www / apex / no subdomain) → primary canonical origin
 * - For tenant subdomains → https://{org}.kolusports.com
 * - For app subdomain → primary canonical origin (admin isn't indexed)
 * - For dev → http://localhost:3000
 */
export function resolveMetadataBase(host: string | null): URL {
  if (!host) return new URL(CANONICAL_ORIGIN)

  const hostname = host.split(':')[0]
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(':')[0]

  // Dev environment — no root domain or localhost
  if (!rootDomain || hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return new URL(CANONICAL_ORIGIN)
  }

  // Main site (bare root or www)
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return new URL(CANONICAL_ORIGIN)
  }

  // Reserved subdomains (app, admin, api) → use canonical origin
  const RESERVED = ['app', 'admin', 'api', 'mail', 'ftp']
  if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.slice(0, -(rootDomain.length + 1))
    if (RESERVED.includes(sub)) {
      return new URL(CANONICAL_ORIGIN)
    }
    // Tenant subdomain → use tenant origin
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    return new URL(`${protocol}://${hostname}`)
  }

  return new URL(CANONICAL_ORIGIN)
}

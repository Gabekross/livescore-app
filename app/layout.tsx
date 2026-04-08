// app/layout.tsx
// Root layout — server component.
// Fetches org site settings once per request and passes them down to the
// client nav / footer.  Falls back gracefully if DB is unreachable.

import type { Metadata }    from 'next'
import { headers }          from 'next/headers'
import { Toaster }          from 'react-hot-toast'
import PublicNav            from '@/components/layouts/PublicNav'
import PublicFooter         from '@/components/layouts/PublicFooter'
import { resolveMetadataBase } from '@/lib/seo'
import '@/app/globals.css'

// ── Org / site-settings fetch (best-effort) ───────────────────────────────────
interface SiteSettings {
  site_name:    string
  site_tagline: string | null
  logo_url:     string | null
  footer_text:  string | null
  contact_email: string | null
  active_theme: string
  /** True when we successfully resolved an organization for this request. */
  isOrgSite:    boolean
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    site_name:     'KoluSports',
    site_tagline:  null,
    logo_url:      null,
    footer_text:   null,
    contact_email: null,
    active_theme:  'theme-uefa-dark',
    isOrgSite:     false,   // no org resolved → show platform marketing nav
  }

  try {
    // Dynamic imports prevent next/headers leaking into the client bundle
    const { getOrganizationIdServer }    = await import('@/lib/org-server')
    const { createServerSupabaseClient } = await import('@/lib/supabase-server')

    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const { data } = await supabase
      .from('site_settings')
      .select('site_name, site_tagline, logo_url, footer_text, contact_email, active_theme')
      .eq('organization_id', orgId)
      .single()

    return data
      ? { ...defaults, ...data, isOrgSite: true }
      : { ...defaults, isOrgSite: true }  // org resolved but no settings row yet
  } catch {
    // Dev mode / DB not yet seeded / no org in context — show platform defaults
    return defaults
  }
}

// ── Dynamic root metadata (provides metadataBase + fallback title) ────────────
export async function generateMetadata(): Promise<Metadata> {
  const host = headers().get('host')
  const metadataBase = resolveMetadataBase(host)

  return {
    metadataBase,
    title: {
      default:  'KoluSports',
      template: '%s | KoluSports',
    },
    description: 'Live scores, fixtures, standings, and more for leagues and tournaments.',
    // PWA & mobile
    viewport: {
      width:        'device-width',
      initialScale: 1,
      maximumScale: 5,
      viewportFit:  'cover',
    },
    themeColor: [
      { media: '(prefers-color-scheme: dark)',  color: '#070710' },
      { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    ],
    appleWebApp: {
      capable:          true,
      statusBarStyle:   'black-translucent',
      title:            'KoluSports',
    },
    icons: {
      icon:  [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    // Prevent Vercel preview URLs and non-www from being indexed
    ...(isNonCanonicalHost(host) ? { robots: { index: false, follow: false } } : {}),
  }
}

/**
 * Returns true if the current host is a Vercel preview/deployment URL
 * or any hostname that should not be indexed by search engines.
 */
function isNonCanonicalHost(host: string | null): boolean {
  if (!host) return false
  const hostname = host.split(':')[0]
  // Block indexing of Vercel preview/deployment URLs
  if (hostname.endsWith('.vercel.app')) return true
  // Block indexing of bare apex if www is canonical (handled by Vercel redirect,
  // but belt-and-suspenders)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(':')[0]
  if (rootDomain && hostname === rootDomain) return true
  return false
}

// ── Root layout ───────────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await fetchSiteSettings()

  return (
    <html lang="en" data-theme={settings.active_theme}>
      <body>
        <PublicNav
          siteName={settings.site_name}
          siteLogo={settings.logo_url}
          isOrgSite={settings.isOrgSite}
        />

        {children}

        <PublicFooter
          siteName={settings.site_name}
          footerText={settings.footer_text}
          contactEmail={settings.contact_email}
          logoUrl={settings.logo_url}
          isOrgSite={settings.isOrgSite}
        />

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--color-card)',
              color:      'var(--color-text)',
              border:     '1px solid var(--color-border)',
            },
          }}
        />
      </body>
    </html>
  )
}

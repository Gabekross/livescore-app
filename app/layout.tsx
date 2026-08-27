// app/layout.tsx
// Root layout — server component.
// Fetches org site settings once per request and passes them down to the
// client nav / footer.  Falls back gracefully if DB is unreachable.

import type { Metadata }    from 'next'
import { headers }          from 'next/headers'
import { Toaster }          from 'react-hot-toast'
import PublicNav            from '@/components/layouts/PublicNav'
import PublicFooter         from '@/components/layouts/PublicFooter'
import GlobalSponsorStrip   from '@/components/layouts/GlobalSponsorStrip'
import AnalyticsTracker     from '@/components/analytics/AnalyticsTracker'
import { resolveMetadataBase, CANONICAL_ORIGIN } from '@/lib/seo'
import { getPlatformSettings }   from '@/lib/platform-settings-server'
import { PlatformSettingsProvider } from '@/contexts/PlatformSettingsContext'
import type { SponsorItem } from '@/components/ui/SponsorStrip'
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
  organization_id: string | null
  public_site_enabled: boolean
  public_site_paused_reason: string | null
  /** Org-wide active sponsors — passed to GlobalSponsorStrip. */
  sponsors:     SponsorItem[]
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
    organization_id: null,
    public_site_enabled: true,
    public_site_paused_reason: null,
    sponsors:      [],
  }

  // Skip DB calls for admin/platform/auth routes — they don't need org settings
  if (headers().get('x-admin-route') === '1') return defaults

  try {
    // Dynamic imports prevent next/headers leaking into the client bundle
    const { getOrganizationIdServer }    = await import('@/lib/org-server')
    const { createServerSupabaseClient } = await import('@/lib/supabase-server')

    const orgId    = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const [orgRes, settingsRes, sponsorsRes] = await Promise.all([
      supabase
        .from('organizations')
        .select('public_site_enabled, public_site_paused_reason')
        .eq('id', orgId)
        .single(),

      supabase
        .from('site_settings')
        .select('site_name, site_tagline, logo_url, footer_text, contact_email, active_theme')
        .eq('organization_id', orgId)
        .single(),

      // Org-wide sponsors (tournament_id IS NULL) shown across all public pages
      supabase
        .from('sponsors')
        .select('id, name, logo_url, website_url, tagline, tier')
        .eq('organization_id', orgId)
        .is('tournament_id', null)
        .eq('is_active', true)
        .order('display_order')
        .order('name'),
    ])

    const sponsors = (sponsorsRes.data || []) as SponsorItem[]
    const orgStatus = {
      public_site_enabled: orgRes.data?.public_site_enabled ?? true,
      public_site_paused_reason: orgRes.data?.public_site_paused_reason ?? null,
    }

    return settingsRes.data
      ? { ...defaults, ...settingsRes.data, ...orgStatus, isOrgSite: true, organization_id: orgId, sponsors }
      : { ...defaults, ...orgStatus, isOrgSite: true, organization_id: orgId, sponsors }
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
    alternates: {
      canonical: CANONICAL_ORIGIN,
    },
    openGraph: {
      type:      'website',
      url:       CANONICAL_ORIGIN,
      siteName:  'KoluSports',
      title:     'KoluSports',
      description: 'Live scores, fixtures, standings, and more for leagues and tournaments.',
    },
    twitter: {
      card:        'summary_large_image',
      title:       'KoluSports',
      description: 'Live scores, fixtures, standings, and more for leagues and tournaments.',
    },
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

function PublicSiteUnavailable({ siteName, logoUrl }: { siteName: string; logoUrl: string | null }) {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 'clamp(1.25rem, 4vw, 3rem)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent 42%), var(--color-bg)',
      color: 'var(--color-text)',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 560,
        textAlign: 'center',
        padding: 'clamp(2rem, 6vw, 3.5rem) clamp(1.25rem, 5vw, 2.5rem)',
      }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={siteName}
            style={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              margin: '0 auto 1.25rem',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 1.25rem',
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            fontSize: '1.6rem',
            fontWeight: 800,
          }}>
            {siteName.charAt(0).toUpperCase()}
          </div>
        )}
        <p style={{
          margin: '0 0 0.5rem',
          fontSize: '0.78rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-dim)',
        }}>
          {siteName}
        </p>
        <h1 style={{
          margin: '0 0 0.85rem',
          fontSize: 'clamp(2rem, 6vw, 3.25rem)',
          lineHeight: 1.05,
          letterSpacing: 0,
        }}>
          We&apos;ll Be Back Soon
        </h1>
        <p style={{
          margin: '0 auto',
          maxWidth: 440,
          fontSize: 'clamp(1rem, 2.4vw, 1.12rem)',
          lineHeight: 1.65,
          color: 'var(--color-text-muted)',
        }}>
          This website is temporarily unavailable while the organization updates its site.
          Please check back later.
        </p>
      </section>
    </main>
  )
}

// ── Root layout ───────────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [settings, platformSettings] = await Promise.all([
    fetchSiteSettings(),
    getPlatformSettings(),
  ])

  return (
    <html lang="en" data-theme={settings.active_theme}>
      <body>
        <PlatformSettingsProvider initial={{ demoMode: platformSettings.demoMode }}>
          {settings.isOrgSite && !settings.public_site_enabled ? (
            <PublicSiteUnavailable
              siteName={settings.site_name}
              logoUrl={settings.logo_url}
            />
          ) : (
            <>
          <PublicNav
            siteName={settings.site_name}
            siteLogo={settings.logo_url}
            isOrgSite={settings.isOrgSite}
          />

          {settings.isOrgSite && settings.organization_id && (
            <AnalyticsTracker
              organizationId={settings.organization_id}
              eventType="site_visit"
            />
          )}

          {children}

          <GlobalSponsorStrip sponsors={settings.sponsors} />

          <PublicFooter
            siteName={settings.site_name}
            footerText={settings.footer_text}
            contactEmail={settings.contact_email}
            logoUrl={settings.logo_url}
            isOrgSite={settings.isOrgSite}
          />
            </>
          )}
        </PlatformSettingsProvider>

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

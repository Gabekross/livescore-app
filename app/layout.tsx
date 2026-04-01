// app/layout.tsx
// Root layout — server component.
// Fetches org site settings once per request and passes them down to the
// client nav / footer.  Falls back gracefully if DB is unreachable.

import type { Metadata }    from 'next'
import { Toaster }          from 'react-hot-toast'
import PublicNav            from '@/components/layouts/PublicNav'
import PublicFooter         from '@/components/layouts/PublicFooter'
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
    site_name:     'Football Live',
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

// ── Static metadata (enhanced per-page via generateMetadata) ─────────────────
export const metadata: Metadata = {
  title: {
    default:  'Football Live',
    template: '%s | Football Live',
  },
  description: 'Live football scores, fixtures, standings and more.',
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

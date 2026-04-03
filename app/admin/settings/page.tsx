'use client'

// app/admin/settings/page.tsx
// Site settings — branding, theme, SEO defaults, footer.
// Updates the site_settings row for the current organization.

import { useEffect, useState } from 'react'
import { supabase }            from '@/lib/supabase'
import { useAdminOrg }         from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }     from '@/components/admin/AdminOrgGate'
import MediaPicker             from '@/components/admin/MediaPicker'
import BillingSection          from '@/components/admin/BillingSection'
import toast                   from 'react-hot-toast'
import styles                  from '@/styles/components/AdminSettings.module.scss'

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEMES = [
  {
    id:     'theme-uefa-dark',
    name:   'UEFA Dark',
    swatch: ['#070710', '#2563eb', '#13132a'],
  },
  {
    id:     'theme-green-gold',
    name:   'Forest Green',
    swatch: ['#060c08', '#16a34a', '#111a14'],
  },
  {
    id:     'theme-slate',
    name:   'Midnight Slate',
    swatch: ['#0c0c0f', '#7c3aed', '#1a1a1f'],
  },
  {
    id:     'theme-blue-light',
    name:   'Professional Light',
    swatch: ['#eef4fb', '#2563eb', '#ffffff'],
  },
]

// ── Default settings ──────────────────────────────────────────────────────────
interface SiteSettings {
  site_name:   string
  site_tagline: string
  logo_url:    string
  favicon_url: string
  active_theme: string
  primary_color: string
  og_image_url:  string
  footer_text:   string
  contact_email: string
}

const DEFAULTS: SiteSettings = {
  site_name:    '',
  site_tagline: '',
  logo_url:     '',
  favicon_url:  '',
  active_theme: 'theme-uefa-dark',
  primary_color: '',
  og_image_url:  '',
  footer_text:   '',
  contact_email: '',
}

// ── Component ─────────────────────────────────────────────────────────────────
function getPublicSiteUrl(slug: string | null): string | null {
  if (!slug) return null
  if (typeof window === 'undefined') return null
  const { protocol, hostname, port } = window.location
  // In dev (localhost), use slug.localhost:port
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const portSuffix = port ? `:${port}` : ''
    return `${protocol}//${slug}.localhost${portSuffix}`
  }
  // In prod, replace current subdomain or prepend to root domain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (rootDomain) {
    return `${protocol}//${slug}.${rootDomain}`
  }
  // Fallback: assume current host minus any existing subdomain
  const parts = hostname.split('.')
  const root = parts.length > 2 ? parts.slice(1).join('.') : hostname
  return `${protocol}//${slug}.${root}${port ? `:${port}` : ''}`
}

export default function AdminSettingsPage() {
  const { orgId, orgSlug, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const [showOgPicker,   setShowOgPicker]   = useState(false)

  useEffect(() => {
    if (!orgId) return
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single()

      if (data) {
        setSettingsId(data.id)
        setSettings({
          site_name:     data.site_name    || '',
          site_tagline:  data.site_tagline || '',
          logo_url:      data.logo_url     || '',
          favicon_url:   data.favicon_url  || '',
          active_theme:  data.active_theme || 'theme-uefa-dark',
          primary_color: data.primary_color || '',
          og_image_url:  data.og_image_url  || '',
          footer_text:   data.footer_text   || '',
          contact_email: data.contact_email || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [orgId])

  const set = (field: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!orgId) return
    setSaving(true)

    const payload = {
      organization_id: orgId,
      site_name:       settings.site_name.trim(),
      site_tagline:    settings.site_tagline.trim(),
      logo_url:        settings.logo_url.trim()     || null,
      favicon_url:     settings.favicon_url.trim()  || null,
      active_theme:    settings.active_theme,
      primary_color:   settings.primary_color.trim() || null,
      og_image_url:    settings.og_image_url.trim()   || null,
      footer_text:     settings.footer_text.trim()   || null,
      contact_email:   settings.contact_email.trim() || null,
      updated_at:      new Date().toISOString(),
    }

    let error

    if (settingsId) {
      const { error: e } = await supabase
        .from('site_settings')
        .update(payload)
        .eq('id', settingsId)
      error = e
    } else {
      const { data: inserted, error: e } = await supabase
        .from('site_settings')
        .insert(payload)
        .select('id')
        .single()
      if (inserted) setSettingsId(inserted.id)
      error = e
    }

    if (error) {
      toast.error(`Failed to save: ${error.message}`)
    } else {
      toast.success('Settings saved!')
      setSaved(true)
    }
    setSaving(false)
  }

  if (orgGate) return orgGate
  if (loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading settings…</div>

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Site Settings</h1>
      <p className={styles.subheading}>
        Configure your organisation&apos;s public branding, theme, and SEO defaults.
      </p>

      {/* ── Public Site URL ── */}
      {orgSlug && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Your Public Site</div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Site URL Slug
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.85rem', background: '#f9fafb',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              fontFamily: 'monospace', fontSize: '0.88rem', color: '#374151',
            }}>
              {orgSlug}
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Public Website URL <span className={styles.labelHint}>(share this with your audience)</span>
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <a
                href={getPublicSiteUrl(orgSlug) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.65rem 0.85rem', background: '#eff6ff',
                  border: '1px solid #bfdbfe', borderRadius: '8px',
                  fontFamily: 'monospace', fontSize: '0.88rem', color: '#2563eb',
                  textDecoration: 'none', fontWeight: 500,
                }}
              >
                {getPublicSiteUrl(orgSlug)}
                <span style={{ fontSize: '0.75rem' }}>&#8599;</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Identity ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Identity</div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Site Name *</label>
          <input
            type="text"
            className={styles.input}
            value={settings.site_name}
            onChange={(e) => set('site_name', e.target.value)}
            placeholder="JCL 2026"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Tagline <span className={styles.labelHint}>(shown on homepage hero)</span>
          </label>
          <input
            type="text"
            className={styles.input}
            value={settings.site_tagline}
            onChange={(e) => set('site_tagline', e.target.value)}
            placeholder="Official League Platform"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Footer Text</label>
          <input
            type="text"
            className={styles.input}
            value={settings.footer_text}
            onChange={(e) => set('footer_text', e.target.value)}
            placeholder="© 2026 JCL. All rights reserved."
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Contact Email{' '}
            <span className={styles.labelHint}>(shown as &ldquo;Contact Us&rdquo; link in footer)</span>
          </label>
          <input
            type="email"
            className={styles.input}
            value={settings.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
            placeholder="info@yourleague.com"
          />
        </div>
      </div>

      {/* ── Logo & Favicon ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Logo &amp; Favicon</div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Logo URL <span className={styles.labelHint}>(displayed in nav; recommended 200×200px)</span>
          </label>
          <div className={styles.logoRow}>
            <div>
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className={styles.logoPreview} />
              ) : (
                <div className={styles.logoPlaceholder}>⚽</div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                className={styles.input}
                value={settings.logo_url}
                onChange={(e) => set('logo_url', e.target.value)}
                placeholder="https://example.com/logo.png"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowLogoPicker(true)}
                style={{
                  padding: '0.5rem 0.9rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Browse
              </button>
            </div>
          </div>

          <MediaPicker
            open={showLogoPicker}
            onClose={() => setShowLogoPicker(false)}
            onSelect={(url) => { set('logo_url', url); setShowLogoPicker(false) }}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Favicon URL <span className={styles.labelHint}>(16×16 or 32×32 .ico / .png)</span></label>
          <input
            type="url"
            className={styles.input}
            value={settings.favicon_url}
            onChange={(e) => set('favicon_url', e.target.value)}
            placeholder="https://example.com/favicon.ico"
          />
        </div>
      </div>

      {/* ── Theme ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Public Theme</div>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1rem' }}>
          Select the colour theme for your public-facing site. Changes take effect on next page load.
        </p>

        <div className={styles.themeGrid}>
          {THEMES.map((theme) => (
            <label
              key={theme.id}
              className={`${styles.themeOption} ${settings.active_theme === theme.id ? styles.themeOptionSelected : ''}`}
            >
              <input
                type="radio"
                name="theme"
                value={theme.id}
                checked={settings.active_theme === theme.id}
                onChange={() => set('active_theme', theme.id)}
              />
              <div className={styles.themeSwatch}>
                {theme.swatch.map((color, i) => (
                  <div key={i} className={styles.themeSwatchSegment} style={{ background: color }} />
                ))}
              </div>
              <span className={styles.themeName}>{theme.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── SEO ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>SEO &amp; Social</div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            Default OG Image URL{' '}
            <span className={styles.labelHint}>(used when no page-specific image is set)</span>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="url"
              className={styles.input}
              value={settings.og_image_url}
              onChange={(e) => set('og_image_url', e.target.value)}
              placeholder="https://example.com/og-default.jpg"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowOgPicker(true)}
              style={{
                padding: '0.5rem 0.9rem',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Browse
            </button>
          </div>

          <MediaPicker
            open={showOgPicker}
            onClose={() => setShowOgPicker(false)}
            onSelect={(url) => { set('og_image_url', url); setShowOgPicker(false) }}
          />
        </div>
      </div>

      {/* ── Billing ── */}
      <BillingSection />

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <span className={styles.savedMsg}>✓ Saved</span>}
      </div>
    </div>
  )
}

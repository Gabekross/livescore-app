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

// ── Theme preview token sets ──────────────────────────────────────────────────
interface ThemeTokens {
  bg:        string
  nav:       string
  card:      string
  border:    string
  accent:    string
  text:      string
  textMuted: string
  live:      string
  scheduled: string
}

// Renders a homepage-style site mockup using the theme's real token values.
// siteName → pulled from settings (falls back to "Kolusports").
// All styles inlined — zero CSS leakage, works for dark + light themes.
function ThemePreviewMock({
  tokens,
  siteName = 'Kolusports',
}: {
  tokens:   ThemeTokens
  siteName?: string
}) {
  const name = siteName.trim() || 'Kolusports'
  // Truncate nav label so it never wraps
  const navLabel = name.length > 22 ? name.slice(0, 20) + '…' : name

  const matchRow = (
    badge: string, bColor: string,
    home: string, away: string,
    right: React.ReactNode,
    key: number,
  ) => (
    <div key={key} style={{
      background:   tokens.card,
      border:       `1px solid ${tokens.border}`,
      borderRadius: '4px',
      padding:      '3px 6px',
      display:      'flex',
      alignItems:   'center',
      gap:          '5px',
    }}>
      {/* Status badge */}
      <div style={{
        background:    `${bColor}22`,
        color:         bColor,
        fontSize:      '5px',
        fontWeight:    700,
        padding:       '1px 3px',
        borderRadius:  '99px',
        border:        `1px solid ${bColor}44`,
        flexShrink:    0,
        letterSpacing: '0.04em',
      }}>{badge}</div>
      {/* Teams */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '6.5px', fontWeight: 600, color: tokens.text,      lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{home}</div>
        <div style={{ fontSize: '6.5px', fontWeight: 600, color: tokens.textMuted, lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{away}</div>
      </div>
      {right}
    </div>
  )

  return (
    <div style={{
      width:         '100%',
      height:        '248px',
      background:    tokens.bg,
      borderRadius:  '8px',
      overflow:      'hidden',
      border:        `1px solid ${tokens.border}`,
      display:       'flex',
      flexDirection: 'column',
      fontFamily:    'inherit',
      pointerEvents: 'none',
      userSelect:    'none',
    }}>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <div style={{
        background:   tokens.nav,
        padding:      '5px 10px',
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
        borderBottom: `1px solid ${tokens.border}`,
        flexShrink:   0,
      }}>
        {/* Logo dot */}
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: tokens.accent, flexShrink: 0 }} />
        <span style={{ fontSize: '7px', fontWeight: 700, color: tokens.text, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {navLabel}
        </span>
        {/* Hamburger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          {[12, 12, 8].map((w, i) => (
            <div key={i} style={{ width: w, height: 1.5, borderRadius: 1, background: tokens.text, opacity: 0.55 }} />
          ))}
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{
        padding:      '7px 10px 6px',
        borderBottom: `1px solid ${tokens.border}`,
        flexShrink:   0,
        background:   tokens.bg,
      }}>
        <div style={{
          fontSize:    '10px',
          fontWeight:  800,
          color:       tokens.accent,
          lineHeight:  1.2,
          marginBottom:'2px',
          overflow:    'hidden',
          display:     '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>
          {name}
        </div>
        <div style={{ fontSize: '6px', color: tokens.textMuted, marginBottom: '5px', lineHeight: 1.4 }}>
          Live scores, fixtures &amp; standings
        </div>
        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ background: tokens.accent, color: '#fff', fontSize: '5.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px' }}>
            Fixtures &amp; Results
          </div>
          <div style={{ background: 'transparent', color: tokens.text, fontSize: '5.5px', fontWeight: 600, padding: '2px 7px', borderRadius: '99px', border: `1px solid ${tokens.border}` }}>
            Standings
          </div>
        </div>
      </div>

      {/* ── Live Now ──────────────────────────────────────────── */}
      <div style={{
        background:   `${tokens.live}0c`,
        borderBottom: `1px solid ${tokens.live}30`,
        padding:      '5px 8px',
        flexShrink:   0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: tokens.live, flexShrink: 0 }} />
          <span style={{ fontSize: '5.5px', fontWeight: 700, color: tokens.live, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            Live Now
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {matchRow('LIVE', tokens.live, 'Team A', 'Team D', (
            <div style={{ fontSize: '8.5px', fontWeight: 800, color: tokens.text, flexShrink: 0 }}>4–1</div>
          ), 0)}
          {matchRow('LIVE', tokens.live, 'Team G', 'Team B', (
            <div style={{ fontSize: '8.5px', fontWeight: 800, color: tokens.text, flexShrink: 0 }}>2–0</div>
          ), 1)}
        </div>
      </div>

      {/* ── Upcoming Fixtures ─────────────────────────────────── */}
      <div style={{ padding: '5px 8px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '6.5px', fontWeight: 700, color: tokens.text }}>Upcoming Fixtures</span>
          <span style={{ fontSize: '5.5px', fontWeight: 600, color: tokens.accent }}>All fixtures →</span>
        </div>
        {matchRow('SCH', tokens.scheduled, 'Team C', 'Team F', (
          <div style={{ fontSize: '6px', fontWeight: 600, color: tokens.scheduled, flexShrink: 0 }}>21:33</div>
        ), 2)}
      </div>

      {/* Accent bottom bar */}
      <div style={{ height: 3, background: tokens.accent, opacity: 0.85, flexShrink: 0 }} />
    </div>
  )
}

// ── Theme definitions ─────────────────────────────────────────────────────────
const THEMES: Array<{
  id: string; name: string; category: string; swatch: string[]; tokens: ThemeTokens
}> = [
  {
    id: 'theme-uefa-dark', name: 'UEFA Dark', category: 'Classic Dark',
    swatch: ['#070710', '#2563eb', '#13132a'],
    tokens: { bg: '#070710', nav: '#09091a', card: '#13132a', border: '#1c1c35',
              accent: '#2563eb', text: '#e8e8f4', textMuted: '#7272a0',
              live: '#ef4444', scheduled: '#60a5fa' },
  },
  {
    id: 'theme-green-gold', name: 'Forest Green', category: 'Classic Dark',
    swatch: ['#060c08', '#16a34a', '#111a14'],
    tokens: { bg: '#060c08', nav: '#080f0a', card: '#111a14', border: '#162019',
              accent: '#16a34a', text: '#e8f4ec', textMuted: '#6a9a78',
              live: '#ef4444', scheduled: '#fbbf24' },
  },
  {
    id: 'theme-slate', name: 'Midnight Slate', category: 'Classic Dark',
    swatch: ['#0c0c0f', '#7c3aed', '#1a1a1f'],
    tokens: { bg: '#0c0c0f', nav: '#0a0a0d', card: '#1a1a1f', border: '#1f1f28',
              accent: '#7c3aed', text: '#f0f0f5', textMuted: '#8080a0',
              live: '#ef4444', scheduled: '#60a5fa' },
  },
  {
    id: 'theme-blue-light', name: 'Professional Light', category: 'Classic Light',
    swatch: ['#eef4fb', '#2563eb', '#ffffff'],
    tokens: { bg: '#eef4fb', nav: '#ffffff', card: '#ffffff', border: '#e2e8f0',
              accent: '#2563eb', text: '#0f172a', textMuted: '#475569',
              live: '#dc2626', scheduled: '#2563eb' },
  },
  {
    id: 'graphite-pulse', name: 'Graphite Pulse', category: 'Premium Dark',
    swatch: ['#080C10', '#14B8A6', '#151D26'],
    tokens: { bg: '#080C10', nav: '#080C10', card: '#151D26', border: '#1C2733',
              accent: '#14B8A6', text: '#F5F8FB', textMuted: '#9AA8B5',
              live: '#F43F5E', scheduled: '#38BDF8' },
  },
  {
    id: 'luxury-dark', name: 'Luxury Dark', category: 'Luxury',
    swatch: ['#091A22', '#FF8C42', '#11222A'],
    tokens: { bg: '#091A22', nav: '#0B1D26', card: '#102229', border: 'rgba(255,255,255,0.08)',
              accent: '#FF8C42', text: '#E6F1F3', textMuted: '#9FB7BB',
              live: '#EF4444', scheduled: '#7ECFD4' },
  },
  {
    id: 'luxury-light', name: 'Luxury Light', category: 'Luxury',
    swatch: ['#F4F8FA', '#E57A2E', '#ffffff'],
    tokens: { bg: '#F4F8FA', nav: '#F4F8FA', card: '#ffffff', border: 'rgba(9,26,34,0.08)',
              accent: '#E57A2E', text: '#102229', textMuted: '#415860',
              live: '#DC2626', scheduled: '#0D7D8A' },
  },
  {
    id: 'naija-green', name: 'Naija Green', category: 'Flag Series',
    swatch: ['#050D07', '#00A651', '#0F2018'],
    tokens: { bg: '#050D07', nav: '#060F09', card: '#0F2018', border: '#132518',
              accent: '#00A651', text: '#E5F2E8', textMuted: '#6B9A76',
              live: '#EF4444', scheduled: '#56CCB8' },
  },
  {
    id: 'ghana-gold', name: 'Ghana Gold', category: 'Flag Series',
    swatch: ['#0D0900', '#FCD116', '#1E1500'],
    tokens: { bg: '#0D0900', nav: '#0D0900', card: '#1E1500', border: '#221900',
              accent: '#FCD116', text: '#F5EDD0', textMuted: '#B89040',
              live: '#CE1126', scheduled: '#5BC8A8' },
  },
]

// ── Theme preview modal ────────────────────────────────────────────────────────
function ThemePreviewModal({
  theme,
  isApplied,
  siteName,
  onClose,
  onApply,
}: {
  theme:     typeof THEMES[number]
  isApplied: boolean
  siteName:  string
  onClose:   () => void
  onApply:   () => void
}) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close preview">✕</button>
        <ThemePreviewMock tokens={theme.tokens} siteName={siteName} />
        <div className={styles.modalMeta}>
          <div className={styles.modalThemeName}>{theme.name}</div>
          <div className={styles.modalThemeCategory}>{theme.category}</div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.modalCancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={`${styles.modalApplyBtn} ${isApplied ? styles.modalApplyBtnApplied : ''}`}
            onClick={onApply}
          >
            {isApplied ? '✓ Applied' : 'Apply Theme'}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [showLogoPicker,  setShowLogoPicker]  = useState(false)
  const [showOgPicker,    setShowOgPicker]    = useState(false)
  const [previewThemeId,  setPreviewThemeId]  = useState<string | null>(null)

  // Close preview modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewThemeId(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
      setTimeout(() => setSaved(false), 3000)
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
              <span className={styles.themeCategory}>{theme.category}</span>
              <button
                type="button"
                className={styles.previewBtn}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPreviewThemeId(theme.id) }}
                aria-label={`Preview ${theme.name} theme`}
              >
                👁 Preview
              </button>
            </label>
          ))}
        </div>

        {/* Theme preview modal */}
        {previewThemeId && (() => {
          const t = THEMES.find(th => th.id === previewThemeId)
          if (!t) return null
          return (
            <ThemePreviewModal
              theme={t}
              isApplied={settings.active_theme === previewThemeId}
              siteName={settings.site_name.trim() || 'Kolusports'}
              onClose={() => setPreviewThemeId(null)}
              onApply={() => { set('active_theme', previewThemeId); setPreviewThemeId(null) }}
            />
          )
        })()}
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

'use client'

// app/admin/sponsors/page.tsx
// Manage sponsor records for the organisation.
// Scope selector switches between global (homepage strip) and per-tournament sponsors.

import { useEffect, useState, useCallback } from 'react'
import { supabase }          from '@/lib/supabase'
import { useAdminOrg }       from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }   from '@/components/admin/AdminOrgGate'
import MediaPicker           from '@/components/admin/MediaPicker'
import toast                 from 'react-hot-toast'
import styles                from '@/styles/components/AdminSponsors.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tournament { id: string; name: string }

interface Sponsor {
  id:              string
  organization_id: string
  tournament_id:   string | null
  name:            string
  logo_url:        string | null
  website_url:     string | null
  tagline:         string | null
  tier:            string
  display_order:   number
  is_active:       boolean
}

interface FormState {
  name:          string
  logo_url:      string
  website_url:   string
  tagline:       string
  tier:          string
  display_order: number
  is_active:     boolean
}

const TIERS = ['title', 'gold', 'silver', 'bronze'] as const

const BLANK: FormState = {
  name: '', logo_url: '', website_url: '', tagline: '',
  tier: 'gold', display_order: 0, is_active: true,
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminSponsorsPage() {
  const { orgId }  = useAdminOrg()
  const orgGate    = useAdminOrgGate()

  const [tournaments,     setTournaments]     = useState<Tournament[]>([])
  const [scopeId,         setScopeId]         = useState<string>('__global__')
  const [sponsors,        setSponsors]        = useState<Sponsor[]>([])
  const [loading,         setLoading]         = useState(true)
  const [showForm,        setShowForm]        = useState(false)
  const [editId,          setEditId]          = useState<string | null>(null)
  const [form,            setForm]            = useState<FormState>(BLANK)
  const [saving,          setSaving]          = useState(false)
  const [showLogoPicker,  setShowLogoPicker]  = useState(false)

  // ── Load tournaments for scope dropdown ──────────────────────────────────
  useEffect(() => {
    if (!orgId) return
    supabase
      .from('tournaments')
      .select('id, name')
      .eq('organization_id', orgId)
      .order('name')
      .then(({ data }) => setTournaments(data || []))
  }, [orgId])

  // ── Load sponsors for current scope ──────────────────────────────────────
  const loadSponsors = useCallback(async () => {
    if (!orgId) return
    setLoading(true)

    let query = supabase
      .from('sponsors')
      .select('*')
      .eq('organization_id', orgId)
      .order('display_order')
      .order('name')

    if (scopeId === '__global__') {
      query = query.is('tournament_id', null)
    } else {
      query = query.eq('tournament_id', scopeId)
    }

    const { data } = await query
    setSponsors(data || [])
    setLoading(false)
  }, [orgId, scopeId])

  useEffect(() => { loadSponsors() }, [loadSponsors])

  // ── Form helpers ─────────────────────────────────────────────────────────
  const f = (key: keyof FormState, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const openAdd = () => {
    setEditId(null)
    setForm(BLANK)
    setShowForm(true)
  }

  const openEdit = (s: Sponsor) => {
    setEditId(s.id)
    setForm({
      name:          s.name,
      logo_url:      s.logo_url      || '',
      website_url:   s.website_url   || '',
      tagline:       s.tagline       || '',
      tier:          s.tier,
      display_order: s.display_order,
      is_active:     s.is_active,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!orgId) return
    if (!form.name.trim()) { toast.error('Business name is required'); return }

    setSaving(true)

    const payload = {
      organization_id: orgId,
      tournament_id:   scopeId === '__global__' ? null : scopeId,
      name:            form.name.trim(),
      logo_url:        form.logo_url.trim()    || null,
      website_url:     form.website_url.trim() || null,
      tagline:         form.tagline.trim()     || null,
      tier:            form.tier,
      display_order:   form.display_order,
      is_active:       form.is_active,
    }

    const { error } = editId
      ? await supabase.from('sponsors').update(payload).eq('id', editId)
      : await supabase.from('sponsors').insert(payload)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(editId ? 'Sponsor updated' : 'Sponsor added')
      setShowForm(false)
      setEditId(null)
      setForm(BLANK)
      loadSponsors()
    }
    setSaving(false)
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('sponsors').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Sponsor deleted'); loadSponsors() }
  }

  // ── Toggle active ────────────────────────────────────────────────────────
  const handleToggle = async (s: Sponsor) => {
    const { error } = await supabase
      .from('sponsors')
      .update({ is_active: !s.is_active })
      .eq('id', s.id)
    if (!error) loadSponsors()
  }

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (orgGate) return orgGate

  const scopeLabel = scopeId === '__global__'
    ? 'Global — shown on all pages'
    : (tournaments.find((t) => t.id === scopeId)?.name ?? 'Tournament')

  return (
    <div className={styles.container}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Sponsors</h1>
          <p className={styles.subheading}>
            Manage sponsor logos and links. <strong>Global</strong> sponsors appear
            on the homepage and across the site. <strong>Tournament</strong> sponsors
            appear on that tournament&apos;s public page.
          </p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          + Add Sponsor
        </button>
      </div>

      {/* Scope selector */}
      <div className={styles.scopeRow}>
        <label className={styles.scopeLabel}>Scope:</label>
        <select
          className={styles.scopeSelect}
          value={scopeId}
          onChange={(e) => { setScopeId(e.target.value); setShowForm(false) }}
        >
          <option value="__global__">🌐 Global (all pages)</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>🏆 {t.name}</option>
          ))}
        </select>
      </div>

      {/* ── Add / Edit form ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formTitle}>
            {editId ? 'Edit Sponsor' : `Add Sponsor — ${scopeLabel}`}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Business Name *</label>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => f('name', e.target.value)}
                placeholder="Acme Corp"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tier</label>
              <select
                className={styles.input}
                value={form.tier}
                onChange={(e) => f('tier', e.target.value)}
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Website URL</label>
            <input
              className={styles.input}
              value={form.website_url}
              onChange={(e) => f('website_url', e.target.value)}
              placeholder="https://sponsor.com"
              type="url"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Tagline{' '}
              <span className={styles.hint}>(optional — short description or slogan)</span>
            </label>
            <input
              className={styles.input}
              value={form.tagline}
              onChange={(e) => f('tagline', e.target.value)}
              placeholder="Powering Champions"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Logo</label>
            <div className={styles.logoRow}>
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo preview" className={styles.logoPreview} />
              )}
              <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
                <input
                  className={styles.input}
                  value={form.logo_url}
                  onChange={(e) => f('logo_url', e.target.value)}
                  placeholder="https://…/logo.png"
                  type="url"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className={styles.browseBtn}
                  onClick={() => setShowLogoPicker(true)}
                >
                  Browse
                </button>
              </div>
            </div>
            <MediaPicker
              open={showLogoPicker}
              onClose={() => setShowLogoPicker(false)}
              onSelect={(url) => { f('logo_url', url); setShowLogoPicker(false) }}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.fieldGroup} style={{ flex: '0 0 130px' }}>
              <label className={styles.label}>
                Order{' '}
                <span className={styles.hint}>(lower = first)</span>
              </label>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => f('display_order', Number(e.target.value))}
              />
            </div>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => f('is_active', e.target.checked)}
              />
              Active (visible on public site)
            </label>
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.cancelBtn}
              onClick={() => { setShowForm(false); setEditId(null) }}
            >
              Cancel
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Sponsor'}
            </button>
          </div>
        </div>
      )}

      {/* ── Sponsor list ──────────────────────────────────────────────────────── */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : sponsors.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤝</div>
          <div className={styles.emptyTitle}>No sponsors yet</div>
          <p className={styles.emptyText}>
            Add your first sponsor to display their logo on the{' '}
            {scopeId === '__global__' ? 'homepage' : 'tournament page'}.
          </p>
        </div>
      ) : (
        <div className={styles.sponsorList}>
          {sponsors.map((s) => (
            <div
              key={s.id}
              className={`${styles.sponsorRow} ${!s.is_active ? styles.inactive : ''}`}
            >
              {/* Logo */}
              <div className={styles.sponsorLogo}>
                {s.logo_url
                  ? <img src={s.logo_url} alt={s.name} />
                  : <span className={styles.noLogo}>No logo</span>
                }
              </div>

              {/* Info */}
              <div className={styles.sponsorInfo}>
                <div className={styles.sponsorName}>{s.name}</div>
                {s.tagline    && <div className={styles.sponsorTagline}>{s.tagline}</div>}
                {s.website_url && <div className={styles.sponsorUrl}>{s.website_url}</div>}
              </div>

              {/* Tier + active badges */}
              <div className={styles.sponsorMeta}>
                <span className={`${styles.tierBadge} ${styles[s.tier as keyof typeof styles]}`}>
                  {s.tier}
                </span>
                {!s.is_active && (
                  <span className={styles.inactiveBadge}>Hidden</span>
                )}
              </div>

              {/* Actions */}
              <div className={styles.sponsorActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleToggle(s)}
                  title={s.is_active ? 'Hide from site' : 'Show on site'}
                >
                  {s.is_active ? '👁' : '🚫'}
                </button>
                <button className={styles.actionBtn} onClick={() => openEdit(s)}>
                  Edit
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(s.id, s.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

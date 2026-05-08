'use client'

// components/admin/PostForm.tsx
// Shared form for creating and editing posts (news/blog).
// Used by /admin/news/new and /admin/news/[id]/edit.

import { useState, useEffect, lazy, Suspense } from 'react'
import Link                     from 'next/link'
import { useRouter }            from 'next/navigation'
import toast                    from 'react-hot-toast'
import { supabase }             from '@/lib/supabase'
import { useAdminOrg }          from '@/contexts/AdminOrgContext'
import { useAdminOrgGate }      from '@/components/admin/AdminOrgGate'
import { toSlug, isValidSlug }  from '@/lib/utils/slug'
import MediaPicker              from '@/components/admin/MediaPicker'
import styles                   from '@/styles/components/AdminNews.module.scss'

// Lazy-load TipTap editor so it doesn't bloat the initial admin bundle
const RichTextEditor = lazy(() => import('@/components/admin/RichTextEditor'))

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tournament { id: string; name: string }

export interface PostFormValues {
  title:           string
  slug:            string
  excerpt:         string
  body:            string
  cover_image_url: string
  cover_images:    string[]
  og_image_url:    string
  seo_title:       string
  seo_description: string
  status:          'draft' | 'published'
  tournament_id:   string
}

interface Props {
  /** If provided, we are editing an existing post */
  postId?:       string
  initialValues?: Partial<PostFormValues>
  heading:       string
}

const EMPTY: PostFormValues = {
  title:           '',
  slug:            '',
  excerpt:         '',
  body:            '',
  cover_image_url: '',
  cover_images:    [],
  og_image_url:    '',
  seo_title:       '',
  seo_description: '',
  status:          'draft',
  tournament_id:   '',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PostForm({ postId, initialValues, heading }: Props) {
  const router   = useRouter()
  const { orgId, loading: orgLoading } = useAdminOrg()
  const orgGate = useAdminOrgGate()
  const [values, setValues]       = useState<PostFormValues>({ ...EMPTY, ...initialValues })
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [saving,  setSaving]      = useState(false)
  const [slugEdited, setSlugEdited] = useState(!!postId) // don't auto-derive slug when editing
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [showOgPicker, setShowOgPicker]       = useState(false)
  const [coverCarouselIndex, setCoverCarouselIndex] = useState(0)

  useEffect(() => {
    if (!orgId) return
    ;(async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name')
      setTournaments((data || []) as Tournament[])
    })()
  }, [orgId])

  const set = (field: Exclude<keyof PostFormValues, 'cover_images'>, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value }
      // Auto-derive slug from title only if user hasn't manually set it
      if (field === 'title' && !slugEdited) {
        next.slug = toSlug(value)
      }
      return next
    })
  }

  // ── Cover image carousel helpers ──────────────────────────────────────────
  const addCoverImage = (url: string) => {
    setValues((prev) => {
      if (prev.cover_images.includes(url)) return prev
      const next = [...prev.cover_images, url]
      setCoverCarouselIndex(next.length - 1)
      return {
        ...prev,
        cover_images:    next,
        // auto-select as cover if it's the first image added
        cover_image_url: prev.cover_image_url || url,
      }
    })
  }

  const removeCoverImage = (url: string) => {
    setValues((prev) => {
      const next = prev.cover_images.filter((u) => u !== url)
      setCoverCarouselIndex((i) => Math.min(i, Math.max(0, next.length - 1)))
      return {
        ...prev,
        cover_images:    next,
        cover_image_url: prev.cover_image_url === url ? (next[0] ?? '') : prev.cover_image_url,
      }
    })
  }

  const setCoverImage = (url: string) => set('cover_image_url', url)

  const handleSlugChange = (raw: string) => {
    setSlugEdited(true)
    set('slug', raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
  }

  const handleSave = async (publishNow = false) => {
    if (!values.title.trim()) { toast.error('Title is required'); return }
    if (!isValidSlug(values.slug)) { toast.error('Slug must contain only lowercase letters, numbers, and hyphens'); return }

    if (!orgId) return
    setSaving(true)
    const published_at = publishNow || values.status === 'published'
      ? new Date().toISOString()
      : null

    const payload = {
      organization_id: orgId,
      title:           values.title.trim(),
      slug:            values.slug.trim(),
      excerpt:         values.excerpt.trim() || null,
      body:            values.body.trim() || null,
      cover_image_url: values.cover_image_url.trim() || null,
      cover_images:    values.cover_images,
      og_image_url:    values.og_image_url.trim() || null,
      seo_title:       values.seo_title.trim() || null,
      seo_description: values.seo_description.trim() || null,
      status:          publishNow ? 'published' : values.status,
      tournament_id:   values.tournament_id || null,
      ...(publishNow || values.status === 'draft' ? { published_at } : {}),
    }

    let error: Error | null = null

    if (postId) {
      const { error: e } = await supabase.from('posts').update(payload).eq('id', postId)
      error = e
    } else {
      const { error: e } = await supabase.from('posts').insert(payload)
      error = e
    }

    if (error) {
      toast.error(`Failed to save: ${error.message}`)
    } else {
      toast.success(postId ? 'Post updated!' : 'Post created!')
      router.push('/admin/news')
    }
    setSaving(false)
  }

  if (orgGate) return orgGate

  const coverImages    = values.cover_images
  const activeCoverUrl = values.cover_image_url.trim()
  const carouselIdx    = Math.min(coverCarouselIndex, Math.max(0, coverImages.length - 1))

  return (
    <div className={styles.formContainer}>
      <Link href="/admin/news" className={styles.cancelBtn} style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        ← Back to News
      </Link>
      <h1 className={styles.heading}>{heading}</h1>

      <div className={styles.formGrid}>
        {/* ── Main column ── */}
        <div className={styles.formMain}>
          {/* Title */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              className={styles.input}
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Match Report: City vs United"
            />
          </div>

          {/* Slug */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Slug{' '}
              <span className={styles.labelHint}>(URL: /news/your-slug)</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={values.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="match-report-city-vs-united"
            />
            <div className={styles.slugPreview}>/news/{values.slug || '…'}</div>
          </div>

          {/* Excerpt */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Excerpt{' '}
              <span className={styles.labelHint}>(shown on listing cards and meta description)</span>
            </label>
            <textarea
              className={styles.textareaShort}
              value={values.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="A brief summary of the article…"
              rows={2}
            />
          </div>

          {/* Body — Rich Text Editor */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Content{' '}
              <span className={styles.labelHint}>(rich text editor)</span>
            </label>
            <Suspense fallback={<div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.85rem' }}>Loading editor...</div>}>
              <RichTextEditor
                value={values.body}
                onChange={(html) => set('body', html)}
              />
            </Suspense>
          </div>

          {/* SEO section */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>SEO Overrides</div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                SEO Title <span className={styles.labelHint}>(defaults to Title)</span>
              </label>
              <input type="text" className={styles.input} value={values.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="Optional page title override" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                SEO Description <span className={styles.labelHint}>(defaults to Excerpt)</span>
              </label>
              <textarea className={styles.textareaShort} value={values.seo_description} onChange={(e) => set('seo_description', e.target.value)} placeholder="Optional meta description…" rows={2} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>OG Image URL <span className={styles.labelHint}>(social share image)</span></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="url" className={styles.input} value={values.og_image_url} onChange={(e) => set('og_image_url', e.target.value)} placeholder="https://…" style={{ flex: 1 }} />
                <button type="button" className={styles.editBtn} onClick={() => setShowOgPicker(true)} style={{ whiteSpace: 'nowrap' }}>Browse</button>
              </div>
            </div>

          <MediaPicker
            open={showOgPicker}
            onClose={() => setShowOgPicker(false)}
            onSelect={(url) => { set('og_image_url', url); setShowOgPicker(false) }}
          />
          </div>

          {/* Buttons */}
          <div className={styles.buttonRow}>
            <button className={styles.saveBtn} onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving…' : postId ? 'Save Changes' : 'Save Draft'}
            </button>
            {values.status !== 'published' && (
              <button className={styles.publishSaveBtn} onClick={() => handleSave(true)} disabled={saving}>
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            )}
            <Link href="/admin/news" className={styles.cancelBtn}>
              Cancel
            </Link>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className={styles.formSide}>
          {/* Status */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>Status</div>
            <select
              className={styles.select}
              value={values.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Cover image carousel manager */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>
              Cover Images
              <span className={styles.labelHint} style={{ marginLeft: '0.4rem', textTransform: 'none', letterSpacing: 0 }}>
                ({coverImages.length})
              </span>
            </div>

            {/* Main preview with prev/next */}
            {coverImages.length > 0 ? (
              <div className={styles.carouselPreview}>
                <img
                  src={coverImages[carouselIdx]}
                  alt={`Image ${carouselIdx + 1}`}
                  className={styles.coverPreview}
                />
                {/* Cover badge */}
                {coverImages[carouselIdx] === activeCoverUrl && (
                  <div className={styles.carouselCoverBadge}>Cover</div>
                )}
                {/* Nav arrows */}
                {coverImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
                      onClick={() => setCoverCarouselIndex((i) => (i - 1 + coverImages.length) % coverImages.length)}
                      aria-label="Previous image"
                    >‹</button>
                    <button
                      type="button"
                      className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                      onClick={() => setCoverCarouselIndex((i) => (i + 1) % coverImages.length)}
                      aria-label="Next image"
                    >›</button>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.coverPlaceholder} aria-hidden="true" />
            )}

            {/* Dot indicators */}
            {coverImages.length > 1 && (
              <div className={styles.carouselDots}>
                {coverImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.carouselDot} ${i === carouselIdx ? styles.carouselDotActive : ''}`}
                    onClick={() => setCoverCarouselIndex(i)}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail strip */}
            {coverImages.length > 0 && (
              <div className={styles.coverThumbStrip}>
                {coverImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.coverThumb} ${i === carouselIdx ? styles.coverThumbSelected : ''} ${url === activeCoverUrl ? styles.coverThumbActive : ''}`}
                    onClick={() => setCoverCarouselIndex(i)}
                    title={url === activeCoverUrl ? 'Active cover' : 'Click to preview'}
                  >
                    <img src={url} alt={`Thumb ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons for current image */}
            {coverImages.length > 0 && (
              <div className={styles.carouselActions}>
                {coverImages[carouselIdx] !== activeCoverUrl && (
                  <button
                    type="button"
                    className={styles.coverSetBtn}
                    onClick={() => setCoverImage(coverImages[carouselIdx])}
                  >
                    ★ Set as Cover
                  </button>
                )}
                <button
                  type="button"
                  className={styles.coverRemoveBtn}
                  onClick={() => removeCoverImage(coverImages[carouselIdx])}
                >
                  Remove
                </button>
              </div>
            )}

            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setShowCoverPicker(true)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              + Add Image
            </button>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.4rem', lineHeight: 1.5 }}>
              Recommended: 1600×900px (16:9), JPG or WebP
            </p>
          </div>

          <MediaPicker
            open={showCoverPicker}
            onClose={() => setShowCoverPicker(false)}
            onSelect={(url) => { addCoverImage(url); setShowCoverPicker(false) }}
          />

          {/* Tournament */}
          {tournaments.length > 0 && (
            <div className={styles.sideCard}>
              <div className={styles.sideCardTitle}>Tournament</div>
              <select
                className={styles.select}
                value={values.tournament_id}
                onChange={(e) => set('tournament_id', e.target.value)}
              >
                <option value="">None</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

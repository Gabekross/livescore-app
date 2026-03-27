'use client'

// components/admin/PostForm.tsx
// Shared form for creating and editing posts (news/blog).
// Used by /admin/news/new and /admin/news/[id]/edit.

import { useState, useEffect }  from 'react'
import Link                     from 'next/link'
import { useRouter }            from 'next/navigation'
import toast                    from 'react-hot-toast'
import { supabase }             from '@/lib/supabase'
import { getOrganizationId }    from '@/lib/org'
import { toSlug, isValidSlug }  from '@/lib/utils/slug'
import styles                   from '@/styles/components/AdminNews.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tournament { id: string; name: string }

export interface PostFormValues {
  title:           string
  slug:            string
  excerpt:         string
  body:            string
  cover_image_url: string
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
  og_image_url:    '',
  seo_title:       '',
  seo_description: '',
  status:          'draft',
  tournament_id:   '',
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PostForm({ postId, initialValues, heading }: Props) {
  const router   = useRouter()
  const [values, setValues]       = useState<PostFormValues>({ ...EMPTY, ...initialValues })
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [saving,  setSaving]      = useState(false)
  const [slugEdited, setSlugEdited] = useState(!!postId) // don't auto-derive slug when editing

  useEffect(() => {
    getOrganizationId().then(async (orgId) => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name')
      setTournaments((data || []) as Tournament[])
    })
  }, [])

  const set = (field: keyof PostFormValues, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value }
      // Auto-derive slug from title only if user hasn't manually set it
      if (field === 'title' && !slugEdited) {
        next.slug = toSlug(value)
      }
      return next
    })
  }

  const handleSlugChange = (raw: string) => {
    setSlugEdited(true)
    set('slug', raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
  }

  const handleSave = async (publishNow = false) => {
    if (!values.title.trim()) { toast.error('Title is required'); return }
    if (!isValidSlug(values.slug)) { toast.error('Slug must contain only lowercase letters, numbers, and hyphens'); return }

    setSaving(true)
    const orgId      = await getOrganizationId()
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

  const coverUrl = values.cover_image_url.trim()

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

          {/* Body */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Content{' '}
              <span className={styles.labelHint}>(plain text or HTML)</span>
            </label>
            <textarea
              className={styles.textarea}
              value={values.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder="Write the full article here. Separate paragraphs with a blank line.&#10;&#10;You can also use HTML tags like &lt;h2&gt;, &lt;strong&gt;, &lt;blockquote&gt;, etc."
            />
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
              <input type="url" className={styles.input} value={values.og_image_url} onChange={(e) => set('og_image_url', e.target.value)} placeholder="https://…" />
            </div>
          </div>

          {/* Buttons */}
          <div className={styles.buttonRow}>
            <button className={styles.saveBtn} onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving…' : postId ? 'Save Changes' : 'Save Draft'}
            </button>
            {values.status !== 'published' && (
              <button className={styles.publishSaveBtn} onClick={() => handleSave(true)} disabled={saving}>
                {saving ? 'Publishing…' : '🟢 Publish'}
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

          {/* Cover image */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardTitle}>Cover Image</div>
            <div className={styles.fieldGroup}>
              <input
                type="url"
                className={styles.input}
                value={values.cover_image_url}
                onChange={(e) => set('cover_image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {coverUrl ? (
              <img src={coverUrl} alt="Cover preview" className={styles.coverPreview} />
            ) : (
              <div className={styles.coverPlaceholder}>🖼️</div>
            )}
            <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
              Paste a public image URL. Upload via{' '}
              <Link href="/admin/media" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Media Library
              </Link>
              .
            </p>
          </div>

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

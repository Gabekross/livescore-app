// app/news/[slug]/page.tsx
// Article detail page — Server Component.
// Renders article body as HTML (admin-controlled content).
// Includes JSON-LD structured data, OG metadata, related articles.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { notFound }                   from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import SectionHeader                  from '@/components/ui/SectionHeader'
import ShareButton                    from '@/components/ui/ShareButton'
import styles                         from '@/styles/components/ArticlePage.module.scss'

interface Props { params: { slug: string } }

interface Post {
  id:              string
  title:           string
  slug:            string
  body:            string | null
  excerpt:         string | null
  cover_image_url: string | null
  og_image_url:    string | null
  seo_title:       string | null
  seo_description: string | null
  published_at:    string | null
  updated_at:      string | null
  tournament_id:   string | null
  tournament?:     { id: string; name: string; slug: string } | null
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const { data: post } = await supabase
      .from('posts')
      .select('title, seo_title, seo_description, excerpt, cover_image_url, og_image_url, published_at')
      .eq('slug', params.slug)
      .eq('organization_id', orgId)
      .eq('status', 'published')
      .single()

    if (!post) return { title: 'Article not found' }

    const title       = post.seo_title || post.title
    const description = post.seo_description || post.excerpt || ''
    const image       = post.og_image_url || post.cover_image_url

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type:            'article',
        publishedTime:   post.published_at ?? undefined,
        images:          image ? [{ url: image }] : [],
      },
      twitter: {
        card:        'summary_large_image',
        title,
        description,
        images:      image ? [image] : [],
      },
    }
  } catch {
    return { title: 'Article' }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ArticlePage({ params }: Props) {
  const supabase = createServerSupabaseClient()
  let orgId = ''
  try { orgId = await getOrganizationIdServer() } catch { notFound() }

  const { data: post } = await supabase
    .from('posts')
    .select(`
      id, title, slug, body, excerpt, cover_image_url, og_image_url,
      seo_title, seo_description, published_at, updated_at, tournament_id,
      tournament:tournament_id(id, name, slug)
    `)
    .eq('slug', params.slug)
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const article = {
    ...post,
    tournament: Array.isArray(post.tournament) ? post.tournament[0] : post.tournament,
  } as Post

  // Fetch related posts (same org, same tournament if any, latest 3)
  const relatedQuery = supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(3)

  if (article.tournament_id) {
    relatedQuery.eq('tournament_id', article.tournament_id)
  }

  const { data: related } = await relatedQuery

  // ── JSON-LD structured data ──────────────────────────────────────────────
  const jsonLd = {
    '@context':    'https://schema.org',
    '@type':       'NewsArticle',
    headline:      article.title,
    description:   article.excerpt || article.seo_description || '',
    image:         article.cover_image_url ? [article.cover_image_url] : [],
    datePublished: article.published_at ?? undefined,
    dateModified:  article.updated_at ?? article.published_at ?? undefined,
  }

  // ── Render body: paragraphs split by double newline if no HTML tags ──────
  const hasHtml = article.body && /<[a-z][\s\S]*>/i.test(article.body)

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className={styles.page}>
        {/* Hero image */}
        {article.cover_image_url ? (
          <div className={styles.hero}>
            <img
              src={article.cover_image_url}
              alt={article.title}
              className={styles.heroImage}
            />
            <div className={styles.heroOverlay} />
          </div>
        ) : (
          <div className={styles.hero}>
            <div className={styles.heroPlaceholder}>📰</div>
          </div>
        )}

        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/news">News</Link>
            <span>›</span>
            <span>{article.title}</span>
          </nav>

          <header className={styles.header}>
            {/* Badges */}
            <div className={styles.badges}>
              {article.tournament && (
                <Link
                  href={`/tournaments/${article.tournament.slug}`}
                  className={styles.tournamentBadge}
                >
                  🏆 {article.tournament.name}
                </Link>
              )}
            </div>

            <h1 className={styles.title}>{article.title}</h1>

            {article.excerpt && (
              <p className={styles.excerpt}>{article.excerpt}</p>
            )}

            <div className={styles.meta}>
              {article.published_at && (
                <span className={styles.metaItem}>
                  📅 {formatDate(article.published_at)}
                </span>
              )}
              {article.updated_at && article.updated_at !== article.published_at && (
                <span className={styles.metaItem}>
                  Updated {formatDate(article.updated_at)}
                </span>
              )}
            </div>
          </header>

          <hr className={styles.divider} />

          {/* Article body */}
          {article.body ? (
            hasHtml ? (
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: article.body }}
              />
            ) : (
              <div className="article-body">
                {article.body.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              No content available.
            </p>
          )}

          {/* Share strip */}
          <div className={styles.shareStrip}>
            <span className={styles.shareLabel}>Share</span>
            <ShareButton title={article.title} />
          </div>
        </div>

        {/* Related articles */}
        {related && related.length > 0 && (
          <section className={styles.related}>
            <SectionHeader
              title="More News"
              ctaLabel="All news"
              ctaHref="/news"
            />
            <div className={styles.relatedGrid}>
              {related.map((r) => (
                <Link key={r.id} href={`/news/${r.slug}`} className={styles.relatedCard}>
                  {r.cover_image_url ? (
                    <img src={r.cover_image_url} alt={r.title} className={styles.relatedThumb} loading="lazy" />
                  ) : (
                    <div className={styles.relatedThumbPlaceholder}>📰</div>
                  )}
                  <div className={styles.relatedInfo}>
                    <div className={styles.relatedTitle}>{r.title}</div>
                    <div className={styles.relatedDate}>{formatDate(r.published_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}

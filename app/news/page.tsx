// app/news/page.tsx
// Public news / blog listing — Server Component.
// First post rendered as a featured hero card; rest in a responsive grid.

import type { Metadata }              from 'next'
import Link                           from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import styles                         from '@/styles/components/NewsPage.module.scss'

export const metadata: Metadata = {
  title:       'News',
  description: 'Latest news, match reports and updates.',
}

interface Post {
  id:              string
  title:           string
  slug:            string
  excerpt:         string | null
  cover_image_url: string | null
  published_at:    string | null
  tournament_id:   string | null
  tournament?:     { name: string; slug: string } | null
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function NewsPage() {
  let posts: Post[] = []

  try {
    const orgId   = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const { data } = await supabase
      .from('posts')
      .select(`
        id, title, slug, excerpt, cover_image_url, published_at, tournament_id,
        tournament:tournament_id(name, slug)
      `)
      .eq('organization_id', orgId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    posts = ((data || []) as unknown as Post[]).map((p) => ({
      ...p,
      tournament: Array.isArray(p.tournament) ? (p.tournament as unknown as { name: string; slug: string }[])[0] : p.tournament,
    }))
  } catch {
    // DB not available
  }

  const [featured, ...rest] = posts

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <SectionHeader
          title="News"
          subtitle={posts.length > 0 ? `${posts.length} article${posts.length !== 1 ? 's' : ''}` : undefined}
        />

        {posts.length === 0 ? (
          <EmptyState
            icon="📰"
            title="No news yet"
            description="Check back soon for the latest updates."
          />
        ) : (
          <>
            {/* Featured post */}
            <Link href={`/news/${featured.slug}`} className={styles.featuredCard}>
              <div>
                {featured.cover_image_url ? (
                  <img
                    src={featured.cover_image_url}
                    alt={featured.title}
                    className={styles.featuredImage}
                  />
                ) : (
                  <div className={styles.featuredImagePlaceholder}>📰</div>
                )}
              </div>
              <div className={styles.featuredBody}>
                {featured.tournament && (
                  <span className={styles.featuredBadge}>
                    🏆 {featured.tournament.name}
                  </span>
                )}
                <h2 className={styles.featuredTitle}>{featured.title}</h2>
                {featured.excerpt && (
                  <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
                )}
                <span className={styles.featuredMeta}>
                  {formatDate(featured.published_at)}
                </span>
                <span className={styles.readMore}>Read article →</span>
              </div>
            </Link>

            {/* Rest of articles */}
            {rest.length > 0 && (
              <div className={styles.grid}>
                {rest.map((post) => (
                  <Link key={post.id} href={`/news/${post.slug}`} className={styles.card}>
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className={styles.cardCover}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.cardCoverPlaceholder}>📰</div>
                    )}
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{post.title}</h3>
                      {post.excerpt && (
                        <p className={styles.cardExcerpt}>{post.excerpt}</p>
                      )}
                      <div className={styles.cardMeta}>
                        <span>{formatDate(post.published_at)}</span>
                        {post.tournament && (
                          <span className={styles.tournamentTag}>
                            {post.tournament.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

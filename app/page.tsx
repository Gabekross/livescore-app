// app/page.tsx
// Public homepage — Server Component.
//
// Bifurcates at the top:
//   orgId resolved → org homepage (fixtures, results, tournaments, news)
//   orgId missing  → platform SaaS landing page (marketing, no org data needed)
//
// The org homepage fetches live data; the platform landing is fully static.

import type { Metadata }        from 'next'
import Link                     from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getOrganizationIdServer }    from '@/lib/org-server'
import PlatformLanding                from '@/components/platform/PlatformLanding'
import LiveMatchesIsland              from '@/components/home/LiveMatchesIsland'
import MatchCard                      from '@/components/ui/MatchCard'
import SectionHeader                  from '@/components/ui/SectionHeader'
import EmptyState                     from '@/components/ui/EmptyState'
import styles                         from '@/styles/components/Homepage.module.scss'
import type { MatchStatus }           from '@/lib/utils/match'

// ── Types ─────────────────────────────────────────────────────────────────────
interface MatchRow {
  id:         string
  status:     MatchStatus
  match_date: string
  match_type: string
  home_score: number | null
  away_score: number | null
  home_team:  { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[]
  away_team:  { id: string; name: string; logo_url: string | null } | { id: string; name: string; logo_url: string | null }[]
}

interface Tournament {
  id:             string
  name:           string
  slug:           string
  cover_image_url?: string | null
  start_date?:    string | null
  end_date?:      string | null
}

interface NewsPost {
  id:              string
  title:           string
  slug:            string
  excerpt:         string | null
  cover_image_url: string | null
  published_at:    string | null
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
  try {
    const orgId    = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('site_settings')
      .select('site_name, site_tagline, og_image_url')
      .eq('organization_id', orgId)
      .single()

    return {
      title:       data?.site_name ?? 'Football Live',
      description: data?.site_tagline ?? 'Live football scores, fixtures and standings.',
      openGraph: {
        images: data?.og_image_url ? [data.og_image_url] : [],
      },
    }
  } catch {
    return {
      title:       'Football Live — Launch your football website',
      description: 'The all-in-one platform for tournament organizers. Live scores, fixtures, standings and more.',
    }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  // Try to resolve an organization. If this throws, render the platform landing page.
  let orgId       = ''
  let siteName    = 'Football Live'
  let siteTagline: string | null = null
  let fixtures:    MatchRow[] = []
  let results:     MatchRow[] = []
  let tournaments: Tournament[] = []
  let newsPosts:   NewsPost[] = []

  try {
    orgId = await getOrganizationIdServer()
    const supabase = createServerSupabaseClient()

    const MATCH_SELECT = `
      id, status, match_date, match_type, home_score, away_score,
      home_team:home_team_id(id, name, logo_url),
      away_team:away_team_id(id, name, logo_url)
    `

    const [settingsRes, fixturesRes, resultsRes, tournamentsRes, newsRes] = await Promise.all([
      supabase
        .from('site_settings')
        .select('site_name, site_tagline')
        .eq('organization_id', orgId)
        .single(),

      supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('organization_id', orgId)
        .eq('status', 'scheduled')
        .order('match_date')
        .limit(6),

      supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .order('match_date', { ascending: false })
        .limit(6),

      supabase
        .from('tournaments')
        .select('id, name, slug, cover_image_url, start_date, end_date')
        .eq('organization_id', orgId)
        .eq('is_archived', false)
        .order('start_date', { ascending: false })
        .limit(4),

      supabase
        .from('posts')
        .select('id, title, slug, excerpt, cover_image_url, published_at')
        .eq('organization_id', orgId)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(4),
    ])

    if (settingsRes.data) {
      siteName    = settingsRes.data.site_name    || siteName
      siteTagline = settingsRes.data.site_tagline || null
    }

    const normalise = (m: MatchRow): MatchRow => ({
      ...m,
      home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
      away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
    })

    fixtures    = (fixturesRes.data    || []).map(normalise) as MatchRow[]
    results     = (resultsRes.data     || []).map(normalise) as MatchRow[]
    tournaments = (tournamentsRes.data || []) as Tournament[]
    newsPosts   = (newsRes.data        || []) as NewsPost[]
  } catch {
    // No org resolved — render the platform marketing landing page instead
    return <PlatformLanding />
  }

  // ── Org homepage ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hero */}
      <section className={styles.hero} aria-label="Welcome">
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Welcome to{' '}
            <span className={styles.heroTitleAccent}>{siteName}</span>
          </h1>
          {siteTagline && (
            <p className={styles.heroTagline}>{siteTagline}</p>
          )}
          <div className={styles.heroActions}>
            <Link href="/matches" className={styles.btnPrimary}>
              Fixtures &amp; Results
            </Link>
            <Link href="/table" className={styles.btnSecondary}>
              Standings
            </Link>
          </div>
        </div>
      </section>

      {/* Live matches client island */}
      <LiveMatchesIsland orgId={orgId} />

      {/* Main content */}
      <main className={styles.main}>

        {/* Upcoming Fixtures + Latest Results */}
        <div className={styles.twoCol}>
          <div>
            <SectionHeader
              title="Upcoming Fixtures"
              ctaLabel="All fixtures"
              ctaHref="/matches?tab=fixtures"
            />
            <div className={styles.matchStack}>
              {fixtures.length === 0 ? (
                <EmptyState icon="" title="No upcoming fixtures" compact />
              ) : (
                fixtures.map((m) => (
                  <MatchCard key={m.id} {...m as any} href={`/matches/${m.id}`} />
                ))
              )}
            </div>
          </div>

          <div>
            <SectionHeader
              title="Latest Results"
              ctaLabel="All results"
              ctaHref="/matches?tab=results"
            />
            <div className={styles.matchStack}>
              {results.length === 0 ? (
                <EmptyState icon="" title="No results yet" compact />
              ) : (
                results.map((m) => (
                  <MatchCard key={m.id} {...m as any} href={`/matches/${m.id}`} />
                ))
              )}
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Active Tournaments */}
        {tournaments.length > 0 && (
          <section className={styles.tournamentsSection} aria-label="Active tournaments">
            <SectionHeader title="Tournaments" ctaLabel="View all" ctaHref="/tournaments" />
            <div className={styles.tournamentGrid}>
              {tournaments.map((t) => (
                <Link key={t.id} href={`/tournaments/${t.slug}`} className={styles.tournamentCard}>
                  {t.cover_image_url ? (
                    <img src={t.cover_image_url} alt={t.name} className={styles.tournamentCover} />
                  ) : (
                    <div className={styles.tournamentCoverPlaceholder} aria-hidden="true" />
                  )}
                  <div>
                    <div className={styles.tournamentName}>{t.name}</div>
                    {(t.start_date || t.end_date) && (
                      <div className={styles.tournamentMeta}>
                        {t.start_date
                          ? new Date(t.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : ''}
                        {t.start_date && t.end_date ? ' – ' : ''}
                        {t.end_date
                          ? new Date(t.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : ''}
                      </div>
                    )}
                  </div>
                  <span className={styles.tournamentLink}>View tournament →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* News preview */}
        {newsPosts.length > 0 && (
          <>
            <hr className={styles.divider} />
            <section aria-label="Latest news">
              <SectionHeader title="Latest News" ctaLabel="All news" ctaHref="/news" />
              <div className={styles.tournamentGrid}>
                {newsPosts.map((post) => (
                  <Link key={post.id} href={`/news/${post.slug}`} className={styles.tournamentCard}>
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className={styles.tournamentCover}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.tournamentCoverPlaceholder} aria-hidden="true" />
                    )}
                    <div>
                      <div className={styles.tournamentName}>{post.title}</div>
                      {post.excerpt && (
                        <div
                          className={styles.tournamentMeta}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          } as React.CSSProperties}
                        >
                          {post.excerpt}
                        </div>
                      )}
                      {post.published_at && (
                        <div className={styles.tournamentMeta} style={{ marginTop: 4 }}>
                          {new Date(post.published_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                    <span className={styles.tournamentLink}>Read article →</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  )
}

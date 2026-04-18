'use client'

// app/matches/page.tsx
// Public fixtures & results page.
// Filters: All | Fixtures | Results | Live  ×  tournament selector.
// Matches are grouped by tournament → stage → (group). Realtime updates.

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link                  from 'next/link'
import { supabase }          from '@/lib/supabase'
import { getOrganizationId } from '@/lib/org'
import MatchCard             from '@/components/ui/MatchCard'
import EmptyState            from '@/components/ui/EmptyState'
import type { MatchStatus }  from '@/lib/utils/match'
import { sortByRelevance }   from '@/lib/utils/matchSort'
import { groupByStageAndGroup } from '@/lib/utils/matchGrouping'
import styles                from '@/styles/components/MatchesPage.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Team { id: string; name: string; logo_url?: string | null }

interface StageInfo {
  id:           string
  stage_name:   string
  order_number: number | null
  stage_type:   string | null
  tournament_id: string
}

interface Match {
  id:            string
  status:        MatchStatus
  match_date:    string
  match_type:    string
  home_score:    number | null
  away_score:    number | null
  tournament_id: string | null
  home_team:     Team
  away_team:     Team
  group?:        { id: string; name: string; stage_id?: string | null } | null
  stage?:        { id: string; stage_name: string; order_number: number | null; stage_type: string | null } | null
}

interface Tournament { id: string; name: string; slug?: string }

type Tab = 'all' | 'fixtures' | 'results' | 'live'

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByTournament(
  matches: Match[],
  tournamentList: Tournament[],
): { key: string; name: string; slug: string | null; matches: Match[] }[] {
  const tMap = new Map(tournamentList.map((t) => [t.id, t]))
  const buckets = new Map<string, { key: string; name: string; slug: string | null; matches: Match[] }>()

  for (const m of matches) {
    const bucketKey = m.tournament_id ?? '__friendly__'
    const t = m.tournament_id ? tMap.get(m.tournament_id) : null
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        key:     bucketKey,
        name:    t?.name ?? 'Friendlies',
        slug:    t?.slug ?? null,
        matches: [],
      })
    }
    buckets.get(bucketKey)!.matches.push(m)
  }

  return Array.from(buckets.values())
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [matches,     setMatches]     = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [stages,      setStages]      = useState<StageInfo[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showTop,     setShowTop]     = useState(false)

  const tab     = (searchParams.get('tab') as Tab) || 'all'
  const tourney = searchParams.get('tournament')   || ''
  const orgIdRef = useRef<string>('')

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const orgId = orgIdRef.current || await getOrganizationId()
    orgIdRef.current = orgId
    setLoading(true)

    const [{ data: tData }, { data: mData }, { data: sData }] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id, name, slug')
        .eq('organization_id', orgId)
        .order('name'),

      supabase
        .from('matches')
        .select(`
          id, status, match_date, match_type,
          home_score, away_score, tournament_id,
          home_team:home_team_id(id, name, logo_url),
          away_team:away_team_id(id, name, logo_url),
          group:group_id(id, name, stage_id)
        `)
        .eq('organization_id', orgId)
        .order('match_date'),

      supabase
        .from('tournament_stages')
        .select('id, stage_name, order_number, stage_type, tournament_id')
        .eq('organization_id', orgId)
        .order('order_number'),
    ])

    setTournaments(tData || [])
    setStages(sData || [])

    if (mData) {
      const stageMap = new Map((sData || []).map((s) => [s.id, s]))
      setMatches(mData.map((m) => {
        const rawGroup = Array.isArray(m.group) ? m.group[0] : m.group
        const stage    = rawGroup?.stage_id ? stageMap.get(rawGroup.stage_id) ?? null : null
        return {
          ...m,
          home_team: (Array.isArray(m.home_team) ? m.home_team[0] : m.home_team) as Team,
          away_team: (Array.isArray(m.away_team) ? m.away_team[0] : m.away_team) as Team,
          group:     rawGroup ? { id: rawGroup.id, name: rawGroup.name, stage_id: rawGroup.stage_id } : null,
          stage:     stage    ? { id: stage.id, stage_name: stage.stage_name, order_number: stage.order_number ?? null, stage_type: stage.stage_type ?? null } : null,
        }
      }) as Match[])
    }
    setLoading(false)
  }, [])

  // ── Initial load + scroll ──────────────────────────────────────────────
  useEffect(() => {
    fetchAll()
    const handleScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [fetchAll])

  // ── Realtime ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orgIdRef.current) return
    const channel = supabase
      .channel('matches-page')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
        const updated = payload.new
        if (updated.organization_id !== orgIdRef.current) return
        setMatches((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loading])

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => matches.filter((m) => {
    if (tourney && m.tournament_id !== tourney) return false
    if (tab === 'fixtures') return m.status === 'scheduled'
    if (tab === 'results')  return m.status === 'completed'
    if (tab === 'live')     return m.status === 'live' || m.status === 'halftime'
    return true
  }), [matches, tourney, tab])

  // Tournament buckets → within each, stage grouping
  const tournamentGroups = useMemo(
    () => groupByTournament(filtered, tournaments),
    [filtered, tournaments],
  )

  // ── URL helpers ────────────────────────────────────────────────────────
  const setTab = (t: Tab) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('tab', t)
    router.push(`/matches?${p}`, { scroll: false })
  }

  const setTourney = (id: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (id) { p.set('tournament', id) } else { p.delete('tournament') }
    router.push(`/matches?${p}`, { scroll: false })
  }

  // Counts respect tournament filter
  const countBase    = tourney ? matches.filter((m) => m.tournament_id === tourney) : matches
  const fixtureCount = countBase.filter((m) => m.status === 'scheduled').length
  const resultCount  = countBase.filter((m) => m.status === 'completed').length
  const liveCount    = countBase.filter((m) => m.status === 'live' || m.status === 'halftime').length

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',      label: `All (${countBase.length})` },
    { key: 'fixtures', label: `Fixtures (${fixtureCount})` },
    { key: 'results',  label: `Results (${resultCount})` },
    { key: 'live',     label: `● Live${liveCount > 0 ? ` (${liveCount})` : ''}` },
  ]

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Matches</h1>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.tabs} role="tablist">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {tournaments.length > 0 && (
            <select
              className={styles.filterSelect}
              value={tourney}
              onChange={(e) => setTourney(e.target.value)}
              aria-label="Filter by tournament"
            >
              <option value="">All Tournaments</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Match list */}
        {loading ? (
          <EmptyState icon="" title="Loading matches…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon=""
            title={tab === 'live' ? 'No live matches right now' : 'No matches found'}
            description="Check back later or try a different filter."
          />
        ) : (
          tournamentGroups.map((tGroup) => {
            const stageGrouped = groupByStageAndGroup(tGroup.matches)
            return (
              <div key={tGroup.key} className={styles.tournamentGroup}>
                {/* Tournament header — hidden when only one tournament is showing */}
                {!tourney && (
                  <div className={styles.tournamentGroupHeader}>
                    <span className={styles.tournamentGroupName}>{tGroup.name}</span>
                    {tGroup.slug && (
                      <Link href={`/tournaments/${tGroup.slug}/fixtures`} className={styles.tournamentGroupLink}>
                        See all →
                      </Link>
                    )}
                  </div>
                )}

                {/* Stage → Group → Matches */}
                {stageGrouped.stages.map((stage) => (
                  <div key={stage.stageKey} className={styles.stageSection}>
                    <div className={styles.stageHeader}>
                      <span className={styles.stageHeaderAccent} aria-hidden="true" />
                      {stage.stageName}
                    </div>

                    {stage.directMatches.length > 0 && (
                      <div className={styles.matchList}>
                        {stage.directMatches.map((m) => (
                          <MatchCard key={m.id} {...m} href={`/matches/${m.id}`} />
                        ))}
                      </div>
                    )}

                    {stage.groups.map((g) => (
                      <div key={g.key} className={styles.groupSection}>
                        <div className={styles.groupHeader}>{g.name}</div>
                        <div className={styles.matchList}>
                          {g.matches.map((m) => (
                            <MatchCard key={m.id} {...m} context={g.name} href={`/matches/${m.id}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Orphan matches (no stage/group — friendlies or ungrouped) */}
                {stageGrouped.orphanMatches.length > 0 && (
                  <div className={styles.matchList} style={{ marginTop: stageGrouped.stages.length > 0 ? '0.75rem' : 0 }}>
                    {sortByRelevance(stageGrouped.orphanMatches).map((m) => (
                      <MatchCard key={m.id} {...m} href={`/matches/${m.id}`} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showTop && (
        <button
          className={styles.backToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          ↑ Top
        </button>
      )}
    </div>
  )
}

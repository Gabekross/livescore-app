'use client'

// app/matches/page.tsx
// Public fixtures & results page.
// Filters: All | Fixtures | Results | Live  ×  tournament selector.
// Matches are grouped by date. Realtime updates via Supabase subscription.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase }          from '@/lib/supabase'
import { getOrganizationId } from '@/lib/org'
import MatchCard             from '@/components/ui/MatchCard'
import EmptyState            from '@/components/ui/EmptyState'
import type { MatchStatus }  from '@/lib/utils/match'
import styles                from '@/styles/components/MatchesPage.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Match {
  id:            string
  status:        MatchStatus
  match_date:    string
  match_type:    string
  home_score:    number | null
  away_score:    number | null
  tournament_id: string | null
  home_team: { id: string; name: string; logo_url?: string | null }
  away_team: { id: string; name: string; logo_url?: string | null }
}

interface Tournament { id: string; name: string }

type Tab = 'all' | 'fixtures' | 'results' | 'live'

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByDate(matches: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>()
  for (const m of matches) {
    const key = m.match_date.slice(0, 10)
    const arr = map.get(key) ?? []
    arr.push(m)
    map.set(key, arr)
  }
  return Array.from(map.entries())
}

function formatDateHeading(isoDate: string): string {
  const d    = new Date(isoDate + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const tomorrow  = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(d, today))    return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  if (sameDay(d, tomorrow)) return 'Tomorrow'

  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [matches,     setMatches]     = useState<Match[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showTop,     setShowTop]     = useState(false)

  const tab      = (searchParams.get('tab') as Tab)        || 'all'
  const tourney  = searchParams.get('tournament')          || ''
  const orgIdRef = useRef<string>('')

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const orgId = orgIdRef.current || await getOrganizationId()
    orgIdRef.current = orgId
    setLoading(true)

    const [{ data: tData }, { data: mData }] = await Promise.all([
      supabase
        .from('tournaments')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name'),

      supabase
        .from('matches')
        .select(`
          id, status, match_date, match_type,
          home_score, away_score, tournament_id,
          home_team:home_team_id(id, name, logo_url),
          away_team:away_team_id(id, name, logo_url)
        `)
        .eq('organization_id', orgId)
        .order('match_date'),
    ])

    setTournaments(tData || [])

    if (mData) {
      setMatches(mData.map((m) => ({
        ...m,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
      })) as Match[])
    }
    setLoading(false)
  }, [])

  // ── Initial load + realtime ────────────────────────────────────────────
  useEffect(() => {
    fetchAll()

    const handleScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [fetchAll])

  useEffect(() => {
    if (!orgIdRef.current) return

    const channel = supabase
      .channel('matches-page')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const updated = payload.new
          if (updated.organization_id !== orgIdRef.current) return
          setMatches((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loading]) // re-register after initial load

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = matches.filter((m) => {
    if (tourney && m.tournament_id !== tourney) return false
    if (tab === 'fixtures') return m.status === 'scheduled'
    if (tab === 'results')  return m.status === 'completed'
    if (tab === 'live')     return m.status === 'live' || m.status === 'halftime'
    return true
  })

  const groups = groupByDate(filtered)

  // ── URL helpers ────────────────────────────────────────────────────────
  const setTab = (t: Tab) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set('tab', t)
    router.push(`/matches?${p}`, { scroll: false })
  }

  const setTourney = (id: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (id) p.set('tournament', id)
    else    p.delete('tournament')
    router.push(`/matches?${p}`, { scroll: false })
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'fixtures', label: 'Fixtures' },
    { key: 'results',  label: 'Results' },
    { key: 'live',     label: '● Live' },
  ]

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Heading */}
        <div className={styles.header}>
          <h1 className={styles.heading}>Matches</h1>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          {/* Tab pills */}
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

          {/* Tournament filter */}
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
          groups.map(([date, dayMatches]) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateLabel}>{formatDateHeading(date)}</div>
              <div className={styles.matchList}>
                {dayMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    {...m}
                    href={`/matches/${m.id}`}
                  />
                ))}
              </div>
            </div>
          ))
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

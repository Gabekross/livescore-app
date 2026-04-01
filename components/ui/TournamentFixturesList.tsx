'use client'

// components/ui/TournamentFixturesList.tsx
// Client component for tournament fixtures page with filter tabs.

import { useState }         from 'react'
import MatchCard             from '@/components/ui/MatchCard'
import EmptyState            from '@/components/ui/EmptyState'
import type { MatchStatus }  from '@/lib/utils/match'
import styles                from '@/styles/components/TournamentsPage.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Team {
  id:        string
  name:      string
  logo_url:  string | null
}

export interface NormalizedMatch {
  id:         string
  status:     MatchStatus
  match_date: string
  match_type: string
  home_score: number | null
  away_score: number | null
  home_team:  Team
  away_team:  Team
}

interface Props {
  matches:        NormalizedMatch[]
  tournamentName: string
  tournamentSlug: string
}

type Tab = 'all' | 'fixtures' | 'results' | 'live'

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByDate(matches: NormalizedMatch[]): [string, NormalizedMatch[]][] {
  const map = new Map<string, NormalizedMatch[]>()
  for (const m of matches) {
    const key = m.match_date.slice(0, 10)
    const arr = map.get(key) ?? []
    arr.push(m)
    map.set(key, arr)
  }
  return Array.from(map.entries())
}

function formatDateHeading(isoDate: string): string {
  const d         = new Date(isoDate + 'T00:00:00')
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const tomorrow  = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()

  if (sameDay(d, today))     return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  if (sameDay(d, tomorrow))  return 'Tomorrow'

  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
  if (d.getFullYear() !== today.getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-GB', opts)
}

function filterByTab(matches: NormalizedMatch[], tab: Tab): NormalizedMatch[] {
  switch (tab) {
    case 'fixtures': return matches.filter((m) => m.status === 'scheduled')
    case 'results':  return matches.filter((m) => m.status === 'completed')
    case 'live':     return matches.filter((m) => m.status === 'live' || m.status === 'halftime')
    default:         return matches
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TournamentFixturesList({ matches, tournamentName, tournamentSlug }: Props) {
  const [tab, setTab] = useState<Tab>('all')

  // Counts
  const fixtureCount = matches.filter((m) => m.status === 'scheduled').length
  const resultCount  = matches.filter((m) => m.status === 'completed').length
  const liveCount    = matches.filter((m) => m.status === 'live' || m.status === 'halftime').length

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',      label: `All (${matches.length})` },
    { key: 'fixtures', label: `Fixtures (${fixtureCount})` },
    { key: 'results',  label: `Results (${resultCount})` },
    { key: 'live',     label: `Live (${liveCount})` },
  ]

  const filtered = filterByTab(matches, tab)
  const groups   = groupByDate(filtered)

  return (
    <>
      {/* Filter tabs */}
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
      </div>

      {/* Match list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon=""
          title={
            tab === 'live'
              ? 'No live matches right now'
              : tab === 'fixtures'
              ? 'No upcoming fixtures'
              : tab === 'results'
              ? 'No results yet'
              : 'No matches scheduled yet'
          }
          description="Check back later or try a different filter."
        />
      ) : (
        groups.map(([date, dayMatches]) => (
          <div key={date} className={styles.dateGroup}>
            <div className={styles.dateLabel}>{formatDateHeading(date)}</div>
            <div className={styles.matchStack}>
              {dayMatches.map((m) => (
                <MatchCard key={m.id} {...m} href={`/matches/${m.id}`} />
              ))}
            </div>
          </div>
        ))
      )}
    </>
  )
}

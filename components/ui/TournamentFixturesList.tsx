'use client'

// components/ui/TournamentFixturesList.tsx
// Client component for tournament fixtures page with filter tabs.
// Matches are grouped by stage → group and sorted by relevance
// (LIVE → HT → nearest upcoming → recent completed → older completed).

import { useMemo, useState } from 'react'
import MatchCard             from '@/components/ui/MatchCard'
import EmptyState            from '@/components/ui/EmptyState'
import type { MatchStatus }  from '@/lib/utils/match'
import { groupByStageAndGroup, groupByLocalDate } from '@/lib/utils/matchGrouping'
import { formatDateHeading }    from '@/lib/utils/dateTime'
import { sortByRelevance }      from '@/lib/utils/matchSort'
import styles                from '@/styles/components/TournamentsPage.module.scss'

interface Team {
  id:       string
  name:     string
  logo_url: string | null
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
  stage?:     { id: string; stage_name: string; order_number: number | null } | null
  group?:     { id: string; name: string } | null
}

interface Props {
  matches:        NormalizedMatch[]
  tournamentName: string
  tournamentSlug: string
}

type Tab = 'all' | 'fixtures' | 'results' | 'live'

function filterByTab(matches: NormalizedMatch[], tab: Tab): NormalizedMatch[] {
  switch (tab) {
    case 'fixtures': return matches.filter((m) => m.status === 'scheduled')
    case 'results':  return matches.filter((m) => m.status === 'completed')
    case 'live':     return matches.filter((m) => m.status === 'live' || m.status === 'halftime')
    default:         return matches
  }
}

export default function TournamentFixturesList({ matches }: Props) {
  const [tab, setTab] = useState<Tab>('all')

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
  const grouped  = useMemo(() => groupByStageAndGroup(filtered), [filtered])
  const orphanSorted = useMemo(() => sortByRelevance(grouped.orphanMatches), [grouped.orphanMatches])

  // Results tab: day buckets (newest first) instead of stage/group sections
  const dateGrouped = useMemo(
    () => (tab === 'results' ? groupByLocalDate(filtered) : []),
    [filtered, tab],
  )

  const resultContext = (m: NormalizedMatch) => {
    const parts = [m.stage?.stage_name, m.group?.name].filter(Boolean)
    return parts.length ? parts.join(' · ') : undefined
  }

  return (
    <>
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
      ) : tab === 'results' ? (
        <>
          {dateGrouped.map((day) => (
            <section key={day.dateKey} className={styles.stageSection}>
              <div className={styles.stageHeader}>
                <span className={styles.stageHeaderAccent} aria-hidden="true" />
                {formatDateHeading(day.dateKey)}
              </div>
              <div className={styles.matchStack}>
                {day.matches.map((m) => (
                  <MatchCard key={m.id} {...m} href={`/matches/${m.id}`} context={resultContext(m)} />
                ))}
              </div>
            </section>
          ))}
        </>
      ) : (
        <>
          {grouped.stages.map((stage) => (
            <section key={stage.stageKey} className={styles.stageSection}>
              <div className={styles.stageHeader}>
                <span className={styles.stageHeaderAccent} aria-hidden="true" />
                {stage.stageName}
              </div>

              {stage.directMatches.length > 0 && (
                <div className={styles.matchStack}>
                  {stage.directMatches.map((m) => (
                    <MatchCard key={m.id} {...m} href={`/matches/${m.id}`} />
                  ))}
                </div>
              )}

              {stage.groups.map((g) => (
                <div key={g.key} className={styles.groupSection}>
                  <div className={styles.groupHeader}>{g.name}</div>
                  <div className={styles.matchStack}>
                    {g.matches.map((m) => (
                      <MatchCard key={m.id} {...m} href={`/matches/${m.id}`} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}

          {orphanSorted.length > 0 && (
            <section className={styles.stageSection}>
              <div className={styles.stageHeader}>
                <span className={styles.stageHeaderAccent} aria-hidden="true" />
                Other Matches
              </div>
              <div className={styles.matchStack}>
                {orphanSorted.map((m) => (
                  <MatchCard key={m.id} {...m} href={`/matches/${m.id}`} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}

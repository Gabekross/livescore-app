// lib/utils/matchSort.ts
// Shared relevance sort for match lists across public pages.
// Order: LIVE → HT → nearest upcoming → recent completed → older completed.

import type { MatchStatus } from './match'

interface SortableMatch {
  status:     MatchStatus
  match_date: string
}

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/** Lower score = higher in the list. */
export function matchPriority(status: MatchStatus, matchDate: string, now: number = Date.now()): number {
  if (status === 'live')     return 0
  if (status === 'halftime') return 1
  if (status === 'scheduled') return 2
  // completed
  const ageMs = now - new Date(matchDate).getTime()
  return ageMs <= RECENT_WINDOW_MS ? 3 : 4
}

/**
 * Sort by relevance priority, then by time-distance from now:
 *   - upcoming: soonest first
 *   - completed: most recent first
 *   - live/HT: earliest kickoff first (so long-running matches stay stable)
 */
export function sortByRelevance<T extends SortableMatch>(matches: T[], now: number = Date.now()): T[] {
  return [...matches].sort((a, b) => {
    const pa = matchPriority(a.status, a.match_date, now)
    const pb = matchPriority(b.status, b.match_date, now)
    if (pa !== pb) return pa - pb

    const ta = new Date(a.match_date).getTime()
    const tb = new Date(b.match_date).getTime()

    // Upcoming: nearer future first (ascending)
    if (pa === 2) return ta - tb
    // Completed buckets: most recent first (descending)
    if (pa === 3 || pa === 4) return tb - ta
    // Live / HT: stable chronological
    return ta - tb
  })
}

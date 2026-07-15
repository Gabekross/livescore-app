// lib/utils/matchGrouping.ts
// Groups tournament matches by stage → group for stage-aware rendering.

import type { MatchStatus } from './match'
import { sortByRelevance } from './matchSort'
import { localDateKey } from './dateTime'

export interface StageRef {
  id?:           string
  stage_name:    string
  order_number?: number | null
}

export interface GroupRef {
  id?:   string
  name:  string
}

export interface GroupableMatch {
  id:         string
  status:     MatchStatus
  match_date: string
  stage?:     StageRef | null
  group?:     GroupRef | null
}

export interface StageBucket<T extends GroupableMatch> {
  stageKey:    string            // stable id/name for React keys
  stageName:   string
  orderNumber: number
  /** Matches directly under the stage when it has no groups (knockouts). */
  directMatches: T[]
  groups:        { key: string; name: string; matches: T[] }[]
}

export interface GroupedMatches<T extends GroupableMatch> {
  stages:         StageBucket<T>[]
  orphanMatches:  T[]  // no stage → rendered under "Other Matches"
}

/**
 * Groups matches by stage and group, sorting each bucket by relevance.
 * Stages sorted by order_number (nullish last), groups alphabetically.
 */
export function groupByStageAndGroup<T extends GroupableMatch>(
  matches: T[],
  now: number = Date.now(),
): GroupedMatches<T> {
  const stageMap = new Map<string, StageBucket<T>>()
  const orphans:  T[] = []

  for (const m of matches) {
    const stage = m.stage
    if (!stage || !stage.stage_name) {
      orphans.push(m)
      continue
    }

    const stageKey = stage.id ?? stage.stage_name
    let bucket = stageMap.get(stageKey)
    if (!bucket) {
      bucket = {
        stageKey,
        stageName:     stage.stage_name,
        orderNumber:   stage.order_number ?? Number.MAX_SAFE_INTEGER,
        directMatches: [],
        groups:        [],
      }
      stageMap.set(stageKey, bucket)
    }

    if (m.group && m.group.name) {
      const groupKey = m.group.id ?? m.group.name
      let g = bucket.groups.find((x) => x.key === groupKey)
      if (!g) {
        g = { key: groupKey, name: m.group.name, matches: [] }
        bucket.groups.push(g)
      }
      g.matches.push(m)
    } else {
      bucket.directMatches.push(m)
    }
  }

  const stages = Array.from(stageMap.values())
    .map((s) => ({
      ...s,
      directMatches: sortByRelevance(s.directMatches, now),
      groups: s.groups
        .map((g) => ({ ...g, matches: sortByRelevance(g.matches, now) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.orderNumber - b.orderNumber || a.stageName.localeCompare(b.stageName))

  return { stages, orphanMatches: sortByRelevance(orphans, now) }
}

export interface DateBucket<T extends { match_date: string }> {
  /** Local date key "YYYY-MM-DD" — pass to formatDateHeading for display. */
  dateKey: string
  matches: T[]
}

/**
 * Groups matches by local calendar day, newest day first.
 * Within a day, matches are ordered by kickoff time.
 * Used for results views where "when was this played" matters.
 */
export function groupByLocalDate<T extends { match_date: string }>(
  matches: T[],
): DateBucket<T>[] {
  const buckets = new Map<string, T[]>()

  for (const m of matches) {
    const key = localDateKey(m.match_date)
    const bucket = buckets.get(key)
    if (bucket) { bucket.push(m) } else { buckets.set(key, [m]) }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, ms]) => ({
      dateKey,
      matches: [...ms].sort(
        (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
      ),
    }))
}

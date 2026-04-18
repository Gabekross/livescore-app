// lib/utils/matchGrouping.ts
// Groups tournament matches by stage → group for stage-aware rendering.

import type { MatchStatus } from './match'
import { sortByRelevance } from './matchSort'

export interface StageRef {
  id?:           string
  stage_name:    string
  order_number?: number | null
  stage_type?:   string | null
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

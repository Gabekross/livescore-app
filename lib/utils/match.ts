// lib/utils/match.ts
// Shared match status utilities used across public pages and admin pages.
// Centralises all status-string logic so there is one place to update
// if status values ever change.

export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'completed'
export type MatchType   = 'tournament' | 'friendly'

// ─── Label helpers ────────────────────────────────────────────────────────────

/**
 * Returns a short display label for the match status badge.
 * Falls back to a formatted date string for 'scheduled' matches.
 */
export function matchStatusLabel(
  status: MatchStatus,
  matchDate?: string
): string {
  switch (status) {
    case 'completed': return 'FT'
    case 'live':      return 'LIVE'
    case 'halftime':  return 'HT'
    default:
      if (matchDate) {
        return new Date(matchDate).toLocaleString('en-GB', {
          day:    '2-digit',
          month:  'short',
          hour:   '2-digit',
          minute: '2-digit',
          hour12: false,
        }).replace(',', '')
      }
      return 'Scheduled'
  }
}

/**
 * Returns a CSS class suffix for the status badge.
 * e.g. 'live' → apply styles.live in the component.
 */
export function matchStatusClass(status: MatchStatus): string {
  return status   // class names mirror status values
}

/**
 * Returns true if the match is currently in progress (live or halftime).
 */
export function isActiveMatch(status: MatchStatus): boolean {
  return status === 'live' || status === 'halftime'
}

/**
 * Returns true if the match has ended.
 */
export function isCompletedMatch(status: MatchStatus): boolean {
  return status === 'completed'
}

/**
 * Returns true if the match has not yet started.
 */
export function isScheduledMatch(status: MatchStatus): boolean {
  return status === 'scheduled'
}

// ─── Score display ────────────────────────────────────────────────────────────

/**
 * Formats a score for display. Returns '-' if null (not yet played).
 */
export function displayScore(score: number | null | undefined): string {
  return score != null ? String(score) : '-'
}

/**
 * Returns a formatted scoreline, e.g. "2 – 1" or "- – -"
 */
export function scorelineFull(
  homeScore: number | null | undefined,
  awayScore: number | null | undefined
): string {
  return `${displayScore(homeScore)} – ${displayScore(awayScore)}`
}

// ─── Status select options (used in admin forms) ─────────────────────────────

export const MATCH_STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live',      label: 'Live'      },
  { value: 'halftime',  label: 'Half Time' },
  { value: 'completed', label: 'Completed' },
]

export const MATCH_TYPE_OPTIONS: { value: MatchType; label: string }[] = [
  { value: 'tournament', label: 'Tournament' },
  { value: 'friendly',   label: 'Friendly'   },
]

export const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '3-4-3', '4-1-4-1']

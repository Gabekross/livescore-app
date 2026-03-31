/**
 * lib/formatters.ts
 *
 * Display-layer formatting utilities for team names, player names, and
 * other user-visible strings.
 *
 * STRATEGY
 * ──────────────────────────────────────────────────────────────────────────
 * Names are normalised only when they appear to be incorrectly cased:
 *   • ALL CAPS     → "REAL MADRID"       → "Real Madrid"
 *   • all lowercase → "real madrid"       → "Real Madrid"
 *   • Mixed-case names that look correct (e.g. "Real Madrid", "Inter Milan",
 *     "Al-Ahly FC") are returned unchanged — we trust deliberately-cased data.
 *
 * Common football abbreviations (FC, AFC, CF, SC, etc.) are always kept in
 * UPPER CASE regardless of input.
 *
 * This is a pure display helper — it never mutates database values.
 */

// ── Football organisation abbreviations to always keep UPPERCASE ─────────
const FOOTBALL_ABBREVS = new Set([
  'FC', 'AFC', 'CF', 'SC', 'FSC', 'FK', 'SK', 'NK', 'NK',
  'CD', 'RC', 'UD', 'SD', 'UD', 'AC', 'AS', 'SS', 'SV',
  'VFL', 'VFB', 'TSV', 'RB', 'BSC',
])

// ── Words to keep lowercase when they appear mid-name (conjunctions etc.) ─
// For team names we usually capitalise everything, but for personal names
// these small words stay lowercase when not at the start of the name.
const PERSONAL_LOWERCASE = new Set([
  'de', 'da', 'di', 'del', 'della', 'delle', 'van', 'von', 'der',
  'den', 'dos', 'das', 'do', 'la', 'le', 'les', 'el', 'al', 'bin',
])

/**
 * Returns true if the string is effectively ALL UPPERCASE
 * (ignoring digits, spaces, and punctuation).
 */
function isAllCaps(str: string): boolean {
  const letters = str.replace(/[^a-zA-Z]/g, '')
  return letters.length > 0 && letters === letters.toUpperCase()
}

/**
 * Returns true if the string is effectively all lowercase
 * (ignoring digits, spaces, and punctuation).
 */
function isAllLower(str: string): boolean {
  const letters = str.replace(/[^a-zA-Z]/g, '')
  return letters.length > 0 && letters === letters.toLowerCase()
}

/**
 * Capitalise the first letter of a word, leave the rest as-is.
 */
function capitaliseFirst(word: string): string {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/**
 * Convert a single word to proper title-case, respecting known abbreviations.
 */
function titleCaseWord(word: string): string {
  const upper = word.toUpperCase()
  if (FOOTBALL_ABBREVS.has(upper)) return upper
  return capitaliseFirst(word)
}

/**
 * Apply title-case to a full name string, respecting hyphenated compound
 * words and known abbreviations.
 */
function toTitleCase(name: string): string {
  return name
    .split(' ')
    .map((segment, i) => {
      if (!segment) return segment
      // Handle hyphenated segments (e.g. "Al-Ahly", "Borussia-Dortmund")
      if (segment.includes('-')) {
        return segment
          .split('-')
          .map((part) => titleCaseWord(part))
          .join('-')
      }
      return titleCaseWord(segment)
    })
    .join(' ')
}

/**
 * Apply title-case for personal (player) names, keeping small prepositions
 * lowercase when they appear in the middle of the name.
 */
function toPersonTitleCase(name: string): string {
  const words = name.split(' ')
  return words
    .map((word, index) => {
      if (!word) return word
      if (word.includes('-')) {
        return word.split('-').map((part) => capitaliseFirst(part)).join('-')
      }
      const lower = word.toLowerCase()
      // Keep particles lowercase unless they are the first word
      if (index > 0 && PERSONAL_LOWERCASE.has(lower)) return lower
      return capitaliseFirst(word)
    })
    .join(' ')
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Format a football team name for display.
 *
 * Examples:
 *   "REAL MADRID"         → "Real Madrid"
 *   "real madrid"         → "Real Madrid"
 *   "Real Madrid"         → "Real Madrid"   (unchanged — already correct)
 *   "MANCHESTER CITY FC"  → "Manchester City FC"
 *   "al-ahly sc"          → "Al-Ahly SC"
 *   "FC BARCELONA"        → "FC Barcelona"
 */
export function formatTeamName(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''

  // Only normalise if the string looks like it needs it
  if (isAllCaps(trimmed) || isAllLower(trimmed)) {
    return toTitleCase(trimmed)
  }

  // Already properly cased — return as-is
  return trimmed
}

/**
 * Format a player name for display.
 *
 * Examples:
 *   "VINICIUS JUNIOR"  → "Vinicius Junior"
 *   "vinicius junior"  → "Vinicius Junior"
 *   "Vinicius Junior"  → "Vinicius Junior"  (unchanged)
 *   "rúben dias"       → "Rúben Dias"
 *   "van Dijk"         → "van Dijk"         (already mixed, kept)
 *   "VAN DIJK"         → "Van Dijk"
 */
export function formatPlayerName(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''

  if (isAllCaps(trimmed) || isAllLower(trimmed)) {
    return toPersonTitleCase(trimmed)
  }

  return trimmed
}

/**
 * Format a generic name — tries player-style casing first.
 * Use when you can't tell if the value is a team or a person.
 */
export function formatName(name: string | null | undefined): string {
  return formatPlayerName(name)
}

/**
 * Get the correct initial(s) from a name for avatar fallbacks.
 * Uses the formatted name so the initial is always uppercase.
 *
 * Examples:
 *   "real madrid" → "R"
 *   "REAL MADRID" → "R"
 *   "FC Barcelona" → "F"
 */
export function nameInitial(name: string | null | undefined): string {
  const formatted = formatTeamName(name)
  return formatted.charAt(0).toUpperCase() || '?'
}

// lib/constants/positions.ts
// Predefined football positions used across the platform.
// These map cleanly to formation slots and are used in:
//   - Team edit / player position dropdowns
//   - Formation-aware pre-mapping
//   - Public match detail display

export interface PositionDef {
  value: string
  label: string
  short: string   // 2-3 char abbreviation shown on pitch
  group: 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
}

export const POSITIONS: PositionDef[] = [
  { value: 'GK',  label: 'Goalkeeper',            short: 'GK',  group: 'goalkeeper' },
  { value: 'CB',  label: 'Centre Back',            short: 'CB',  group: 'defender'   },
  { value: 'LB',  label: 'Left Back',              short: 'LB',  group: 'defender'   },
  { value: 'RB',  label: 'Right Back',             short: 'RB',  group: 'defender'   },
  { value: 'LWB', label: 'Left Wing Back',         short: 'LWB', group: 'defender'   },
  { value: 'RWB', label: 'Right Wing Back',        short: 'RWB', group: 'defender'   },
  { value: 'CDM', label: 'Defensive Midfielder',   short: 'CDM', group: 'midfielder' },
  { value: 'CM',  label: 'Central Midfielder',     short: 'CM',  group: 'midfielder' },
  { value: 'CAM', label: 'Attacking Midfielder',   short: 'CAM', group: 'midfielder' },
  { value: 'LW',  label: 'Left Winger',            short: 'LW',  group: 'forward'    },
  { value: 'RW',  label: 'Right Winger',           short: 'RW',  group: 'forward'    },
  { value: 'ST',  label: 'Striker',                 short: 'ST',  group: 'forward'    },
]

export const POSITION_VALUES = POSITIONS.map(p => p.value)

export const POSITION_MAP: Record<string, PositionDef> =
  Object.fromEntries(POSITIONS.map(p => [p.value, p]))

/** Get the short label for a position value. Normalizes legacy values. Falls back to the raw value. */
export function positionShort(value?: string | null): string {
  if (!value) return ''
  const norm = normalizePosition(value)
  if (!norm) return ''
  return POSITION_MAP[norm]?.short ?? norm
}

/** Get the full label for a position value. Normalizes legacy values. Falls back to the raw value. */
export function positionLabel(value?: string | null): string {
  if (!value) return ''
  const norm = normalizePosition(value)
  if (!norm) return ''
  return POSITION_MAP[norm]?.label ?? norm
}

// ── Legacy position normalization ─────────────────────────────────────────────
// Maps common free-text position values to the controlled position codes.
// Applied at read-time so old data displays correctly without migration.

const NORMALIZE_MAP: Record<string, string> = {
  // Full names
  'goalkeeper':             'GK',
  'goal keeper':            'GK',
  'goalie':                 'GK',
  'keeper':                 'GK',
  'centre back':            'CB',
  'center back':            'CB',
  'centre-back':            'CB',
  'center-back':            'CB',
  'central defender':       'CB',
  'defender':               'CB',
  'left back':              'LB',
  'left-back':              'LB',
  'right back':             'RB',
  'right-back':             'RB',
  'left wing back':         'LWB',
  'left wing-back':         'LWB',
  'left wingback':          'LWB',
  'right wing back':        'RWB',
  'right wing-back':        'RWB',
  'right wingback':         'RWB',
  'wing back':              'RWB',
  'wingback':               'RWB',
  'defensive midfielder':   'CDM',
  'defensive mid':          'CDM',
  'holding midfielder':     'CDM',
  'central midfielder':     'CM',
  'center midfielder':      'CM',
  'centre midfielder':      'CM',
  'midfielder':             'CM',
  'midfield':               'CM',
  'mid':                    'CM',
  'attacking midfielder':   'CAM',
  'attacking mid':          'CAM',
  'playmaker':              'CAM',
  'left winger':            'LW',
  'left wing':              'LW',
  'right winger':           'RW',
  'right wing':             'RW',
  'winger':                 'RW',
  'striker':                'ST',
  'forward':                'ST',
  'centre forward':         'ST',
  'center forward':         'ST',
  'cf':                     'ST',
  'attacker':               'ST',
  // Common abbreviations that might exist
  'gk':  'GK',
  'cb':  'CB',
  'lb':  'LB',
  'rb':  'RB',
  'lwb': 'LWB',
  'rwb': 'RWB',
  'cdm': 'CDM',
  'dm':  'CDM',
  'cm':  'CM',
  'cam': 'CAM',
  'am':  'CAM',
  'lw':  'LW',
  'rw':  'RW',
  'st':  'ST',
  'fw':  'ST',
  'ss':  'ST',
  'lm':  'LW',
  'rm':  'RW',
}

/**
 * Normalize a raw position string to a controlled position code.
 * Handles legacy free-text values, case-insensitive.
 * Returns the controlled code if matched, otherwise the original value.
 */
export function normalizePosition(raw?: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Already a valid code?
  if (POSITION_MAP[trimmed]) return trimmed
  // Try lookup by lowercase
  const mapped = NORMALIZE_MAP[trimmed.toLowerCase()]
  if (mapped) return mapped
  // Return original as fallback
  return trimmed
}

/** Get the group color for badge rendering. Normalizes legacy values. */
export function positionGroupColor(value?: string | null): string {
  if (!value) return '#6b7280'
  const norm = normalizePosition(value)
  const group = POSITION_MAP[norm ?? '']?.group
  switch (group) {
    case 'goalkeeper':  return '#f59e0b'
    case 'defender':    return '#3b82f6'
    case 'midfielder':  return '#22c55e'
    case 'forward':     return '#ef4444'
    default:            return '#6b7280'
  }
}

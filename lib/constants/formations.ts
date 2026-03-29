// lib/constants/formations.ts
// Formation slot definitions with position labels and pitch coordinates.
// Each formation maps 11 slots to expected positions and x/y percentages
// for rendering on the pitch. Coordinates are from the team's own perspective
// (GK at 0%, forwards at ~70%), and the renderer flips for the opposing half.

export interface FormationSlot {
  position: string   // Expected position code (from positions.ts)
  x: number          // Horizontal position 0-100 (left to right)
  y: number          // Vertical position 0-100 (own goal to opponent goal)
}

export interface FormationDef {
  name:  string
  label: string
  slots: FormationSlot[]
}

export const FORMATION_DEFS: Record<string, FormationDef> = {
  '4-4-2': {
    name: '4-4-2', label: '4-4-2',
    slots: [
      { position: 'GK',  x: 50, y: 4 },
      { position: 'LB',  x: 12, y: 22 },
      { position: 'CB',  x: 35, y: 20 },
      { position: 'CB',  x: 65, y: 20 },
      { position: 'RB',  x: 88, y: 22 },
      { position: 'LW',  x: 12, y: 42 },
      { position: 'CM',  x: 38, y: 40 },
      { position: 'CM',  x: 62, y: 40 },
      { position: 'RW',  x: 88, y: 42 },
      { position: 'ST',  x: 38, y: 62 },
      { position: 'ST',  x: 62, y: 62 },
    ],
  },

  '4-3-3': {
    name: '4-3-3', label: '4-3-3',
    slots: [
      { position: 'GK',  x: 50, y: 4 },
      { position: 'LB',  x: 12, y: 22 },
      { position: 'CB',  x: 35, y: 20 },
      { position: 'CB',  x: 65, y: 20 },
      { position: 'RB',  x: 88, y: 22 },
      { position: 'CM',  x: 25, y: 42 },
      { position: 'CM',  x: 50, y: 40 },
      { position: 'CM',  x: 75, y: 42 },
      { position: 'LW',  x: 18, y: 62 },
      { position: 'ST',  x: 50, y: 66 },
      { position: 'RW',  x: 82, y: 62 },
    ],
  },

  '4-2-3-1': {
    name: '4-2-3-1', label: '4-2-3-1',
    slots: [
      { position: 'GK',  x: 50, y: 4 },
      { position: 'LB',  x: 12, y: 22 },
      { position: 'CB',  x: 35, y: 20 },
      { position: 'CB',  x: 65, y: 20 },
      { position: 'RB',  x: 88, y: 22 },
      { position: 'CDM', x: 38, y: 37 },
      { position: 'CDM', x: 62, y: 37 },
      { position: 'LW',  x: 18, y: 52 },
      { position: 'CAM', x: 50, y: 50 },
      { position: 'RW',  x: 82, y: 52 },
      { position: 'ST',  x: 50, y: 67 },
    ],
  },

  '3-5-2': {
    name: '3-5-2', label: '3-5-2',
    slots: [
      { position: 'GK',  x: 50, y: 4 },
      { position: 'CB',  x: 25, y: 20 },
      { position: 'CB',  x: 50, y: 18 },
      { position: 'CB',  x: 75, y: 20 },
      { position: 'LWB', x: 10, y: 38 },
      { position: 'CM',  x: 32, y: 40 },
      { position: 'CDM', x: 50, y: 36 },
      { position: 'CM',  x: 68, y: 40 },
      { position: 'RWB', x: 90, y: 38 },
      { position: 'ST',  x: 38, y: 62 },
      { position: 'ST',  x: 62, y: 62 },
    ],
  },

  '5-3-2': {
    name: '5-3-2', label: '5-3-2',
    slots: [
      { position: 'GK',  x: 50, y: 4 },
      { position: 'LWB', x: 8,  y: 24 },
      { position: 'CB',  x: 28, y: 20 },
      { position: 'CB',  x: 50, y: 18 },
      { position: 'CB',  x: 72, y: 20 },
      { position: 'RWB', x: 92, y: 24 },
      { position: 'CM',  x: 28, y: 42 },
      { position: 'CM',  x: 50, y: 40 },
      { position: 'CM',  x: 72, y: 42 },
      { position: 'ST',  x: 38, y: 62 },
      { position: 'ST',  x: 62, y: 62 },
    ],
  },

  '3-4-3': {
    name: '3-4-3', label: '3-4-3',
    slots: [
      { position: 'GK',  x: 50, y: 4 },
      { position: 'CB',  x: 25, y: 20 },
      { position: 'CB',  x: 50, y: 18 },
      { position: 'CB',  x: 75, y: 20 },
      { position: 'LWB', x: 12, y: 40 },
      { position: 'CM',  x: 38, y: 38 },
      { position: 'CM',  x: 62, y: 38 },
      { position: 'RWB', x: 88, y: 40 },
      { position: 'LW',  x: 18, y: 62 },
      { position: 'ST',  x: 50, y: 66 },
      { position: 'RW',  x: 82, y: 62 },
    ],
  },

  '4-1-4-1': {
    name: '4-1-4-1', label: '4-1-4-1',
    slots: [
      { position: 'GK',  x: 50, y: 4 },
      { position: 'LB',  x: 12, y: 22 },
      { position: 'CB',  x: 35, y: 20 },
      { position: 'CB',  x: 65, y: 20 },
      { position: 'RB',  x: 88, y: 22 },
      { position: 'CDM', x: 50, y: 35 },
      { position: 'LW',  x: 12, y: 52 },
      { position: 'CM',  x: 38, y: 50 },
      { position: 'CM',  x: 62, y: 50 },
      { position: 'RW',  x: 88, y: 52 },
      { position: 'ST',  x: 50, y: 67 },
    ],
  },
}

/** Get slot definitions for a formation. Falls back to 4-3-3. */
export function getFormationSlots(formation: string): FormationSlot[] {
  return (FORMATION_DEFS[formation] ?? FORMATION_DEFS['4-3-3']).slots
}

/** Get the expected position codes for a formation (in slot order). */
export function getFormationPositions(formation: string): string[] {
  return getFormationSlots(formation).map(s => s.position)
}

/** All available formation names. */
export const FORMATION_NAMES = Object.keys(FORMATION_DEFS)

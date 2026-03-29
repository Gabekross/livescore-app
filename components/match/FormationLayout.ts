// components/match/FormationLayout.ts
// Legacy compatibility layer — re-exports formation coordinates
// from the new centralised formation definitions.
// Components that import formationLayouts from here will continue to work.

import { FORMATION_DEFS } from '@/lib/constants/formations'

export const formationLayouts: Record<string, { x: string; y: string }[]> =
  Object.fromEntries(
    Object.entries(FORMATION_DEFS).map(([name, def]) => [
      name,
      def.slots.map(s => ({ x: `${s.x}%`, y: `${s.y}%` })),
    ])
  )

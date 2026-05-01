'use client'

import Link from 'next/link'
import shared from '@/styles/components/AdminShared.module.scss'

type Step = 'tournament' | 'stages' | 'groups' | 'matches'

interface TournamentProgressProps {
  tournamentId:  string
  stageId?:      string
  groupId?:      string
  currentStep:   Step
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'tournament', label: 'Tournament' },
  { key: 'stages',     label: 'Stages'     },
  { key: 'groups',     label: 'Groups'     },
  { key: 'matches',    label: 'Matches'    },
]

const ORDER: Record<Step, number> = {
  tournament: 0,
  stages:     1,
  groups:     2,
  matches:    3,
}

function stepHref(step: Step, tournamentId: string, stageId?: string, groupId?: string): string | null {
  switch (step) {
    case 'tournament': return `/admin/tournaments`
    case 'stages':     return `/admin/tournaments/${tournamentId}/stages`
    case 'groups':     return stageId ? `/admin/tournaments/${tournamentId}/stages/${stageId}/groups` : null
    case 'matches':    return (stageId && groupId) ? `/admin/tournaments/${tournamentId}/stages/${stageId}/groups/${groupId}/matches` : null
    default:           return null
  }
}

export default function TournamentProgress({ tournamentId, stageId, groupId, currentStep }: TournamentProgressProps) {
  const currentOrder = ORDER[currentStep]

  return (
    <div className={shared.tourProgress}>
      {STEPS.map((step, idx) => {
        const order    = ORDER[step.key]
        const isDone   = order < currentOrder
        const isActive = order === currentOrder
        const href     = isDone ? stepHref(step.key, tournamentId, stageId, groupId) : null

        const className = [
          shared.tourStep,
          isDone   ? shared.tourStepDone   : '',
          isActive ? shared.tourStepActive : '',
        ].filter(Boolean).join(' ')

        const inner = (
          <>
            <span className={shared.tourStepNum}>
              {isDone ? <span className={shared.tourStepCheck}>✓</span> : idx + 1}
            </span>
            {step.label}
          </>
        )

        return (
          <span key={step.key} style={{ display: 'contents' }}>
            {href ? (
              <Link href={href} className={className}>{inner}</Link>
            ) : (
              <span className={className}>{inner}</span>
            )}
            {idx < STEPS.length - 1 && (
              <span className={shared.tourStepArrow}>›</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

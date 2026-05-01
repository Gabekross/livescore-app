'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { getTipForContext } from '@/data/help'
import styles from '@/styles/components/HelpSystem.module.scss'

interface Props {
  onLearnMore?: () => void
}

export default function ContextualHelpBanner({ onLearnMore }: Props) {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const tip = getTipForContext(pathname || '')
  if (!tip || dismissed.has(tip.id)) return null

  return (
    <div className={styles.contextBanner}>
      <span className={styles.contextBannerText}>{tip.tip}</span>
      {onLearnMore && (
        <button className={styles.contextBannerLearn} onClick={onLearnMore}>
          Learn more
        </button>
      )}
      <button
        className={styles.contextBannerDismiss}
        onClick={() => setDismissed(prev => new Set(prev).add(tip.id))}
      >
        Dismiss
      </button>
    </div>
  )
}

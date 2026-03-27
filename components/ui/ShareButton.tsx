'use client'

// components/ui/ShareButton.tsx
// Uses the Web Share API if available; falls back to clipboard copy.

import { useState } from 'react'
import toast        from 'react-hot-toast'
import styles       from '@/styles/components/ArticlePage.module.scss'

interface Props { title: string }

export default function ShareButton({ title }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch { /* user cancelled */ }
      return
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className={styles.shareBtn}
      onClick={handleShare}
      aria-label="Share article"
    >
      {copied ? '✓ Copied' : '🔗 Copy link'}
    </button>
  )
}

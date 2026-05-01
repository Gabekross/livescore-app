'use client'

import { useEffect, useState } from 'react'
import styles from '@/styles/components/BackToTop.module.scss'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={styles.backToTop}
      aria-label="Back to top"
    >
      Back to top
    </button>
  )
}

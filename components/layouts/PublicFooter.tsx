'use client'

// components/layouts/PublicFooter.tsx
// Hides on /admin/* routes. Receives site name as prop.

import Link             from 'next/link'
import { usePathname }  from 'next/navigation'
import styles           from '@/styles/components/PublicFooter.module.scss'

interface Props {
  siteName:  string
  footerText?: string | null
}

const FOOTER_LINKS = [
  { href: '/matches',     label: 'Matches' },
  { href: '/table',       label: 'Table' },
  { href: '/teams',       label: 'Teams' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/archive',     label: 'Archive' },
]

export default function PublicFooter({ siteName, footerText }: Props) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandEmoji}>⚽</span>
          {siteName}
        </div>

        <ul className={styles.links} role="list">
          {FOOTER_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link href={href}>{label}</Link>
            </li>
          ))}
        </ul>

        <p className={styles.copy}>
          {footerText || `© ${year} ${siteName}. All rights reserved.`}
        </p>
      </div>
    </footer>
  )
}

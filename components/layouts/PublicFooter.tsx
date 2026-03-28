'use client'

// components/layouts/PublicFooter.tsx
// Public site footer. Hides on admin, platform, and auth routes.
//
// isOrgSite=true  → shows Contact Us link (org contact email)
// isOrgSite=false → shows platform marketing links (Sign Up, etc.)

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import styles          from '@/styles/components/PublicFooter.module.scss'

interface Props {
  siteName:      string
  footerText?:   string | null
  contactEmail?: string | null
  isOrgSite:     boolean
}

const FOOTER_LINKS = [
  { href: '/matches',     label: 'Matches' },
  { href: '/table',       label: 'Table' },
  { href: '/teams',       label: 'Teams' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/news',        label: 'News' },
  { href: '/archive',     label: 'Archive' },
]

export default function PublicFooter({ siteName, footerText, contactEmail, isOrgSite }: Props) {
  const pathname = usePathname()

  // Hide on admin, platform, and auth pages
  const hideOn = ['/admin', '/platform', '/login', '/signup', '/forgot-password', '/reset-password']
  if (hideOn.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandEmoji}>&#9917;</span>
          {siteName}
        </div>

        <ul className={styles.links} role="list">
          {FOOTER_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link href={href}>{label}</Link>
            </li>
          ))}
        </ul>

        {/* Contact Us — shown on org sites */}
        {isOrgSite && contactEmail && (
          <div className={styles.contact}>
            <a href={`mailto:${contactEmail}`} className={styles.contactLink}>
              Contact Us
            </a>
          </div>
        )}

        {/* Platform CTA — shown only on generic platform pages */}
        {!isOrgSite && (
          <div className={styles.contact}>
            <Link href="/signup" className={styles.contactLink}>
              Create Your Site
            </Link>
          </div>
        )}

        <p className={styles.copy}>
          {footerText || `\u00A9 ${year} ${siteName}. All rights reserved.`}
        </p>
      </div>
    </footer>
  )
}

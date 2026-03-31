'use client'

// components/layouts/PublicFooter.tsx
// Public site footer. Hides on admin, platform, and auth routes.
//
// isOrgSite=true  → dark footer, tournament links, Contact Us
// isOrgSite=false → light footer, platform marketing links (Pricing, Sign In, Get Started)

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import styles          from '@/styles/components/PublicFooter.module.scss'

interface Props {
  siteName:      string
  footerText?:   string | null
  contactEmail?: string | null
  isOrgSite:     boolean
}

const ORG_FOOTER_LINKS = [
  { href: '/matches',     label: 'Matches' },
  { href: '/table',       label: 'Table' },
  { href: '/teams',       label: 'Teams' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/news',        label: 'News' },
  { href: '/archive',     label: 'Archive' },
]

const PLATFORM_FOOTER_LINKS = [
  { href: '/#features',     label: 'Features' },
  { href: '/#how-it-works', label: 'How it Works' },
  { href: '/#pricing',      label: 'Pricing' },
  { href: '/login',         label: 'Sign In' },
  { href: '/signup',        label: 'Get Started' },
]

export default function PublicFooter({ siteName, footerText, contactEmail, isOrgSite }: Props) {
  const pathname = usePathname()

  // Hide on admin, platform, and auth pages
  const hideOn = ['/admin', '/platform', '/login', '/signup', '/forgot-password', '/reset-password']
  if (hideOn.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  const year = new Date().getFullYear()
  const footerLinks = isOrgSite ? ORG_FOOTER_LINKS : PLATFORM_FOOTER_LINKS
  const footerClass = `${styles.footer} ${!isOrgSite ? styles.footerPlatform : ''}`

  return (
    <footer className={footerClass}>
      <div className={styles.inner}>
        <div className={`${styles.brand} ${!isOrgSite ? styles.brandPlatform : ''}`}>
          <span className={styles.brandEmoji}>&#9917;</span>
          {isOrgSite ? siteName : 'Football Live'}
        </div>

        <ul className={styles.links} role="list">
          {footerLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={!isOrgSite ? styles.platformLink : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Contact Us — shown on org sites with an email */}
        {isOrgSite && contactEmail && (
          <div className={styles.contact}>
            <a href={`mailto:${contactEmail}`} className={styles.contactLink}>
              Contact Us
            </a>
          </div>
        )}

        <p className={`${styles.copy} ${!isOrgSite ? styles.copyPlatform : ''}`}>
          {footerText || `\u00A9 ${year} ${isOrgSite ? siteName : 'Football Live'}. All rights reserved.`}
        </p>
      </div>
    </footer>
  )
}

'use client'

// components/layouts/PublicNav.tsx
// Fixed top navigation for public pages.
// Hides on admin, platform, and auth routes.
//
// isOrgSite=true  → org-branded dark nav with tournament links (Matches, Table, Teams…)
// isOrgSite=false → platform marketing light nav with product links (Features, Pricing…)

import { useState } from 'react'
import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '@/styles/components/PublicNav.module.scss'

interface Props {
  siteName:  string
  siteLogo?: string | null
  isOrgSite: boolean
}

const ORG_NAV_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/matches',     label: 'Matches' },
  { href: '/table',       label: 'Table' },
  { href: '/teams',       label: 'Teams' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/news',        label: 'News' },
  { href: '/archive',     label: 'Archive' },
]

const PLATFORM_NAV_LINKS = [
  { href: '/#features',     label: 'Features' },
  { href: '/#how-it-works', label: 'How it Works' },
  { href: '/#pricing',      label: 'Pricing' },
]

// Routes where the public nav should not appear at all
const HIDE_ON = ['/admin', '/platform', '/login', '/signup', '/forgot-password', '/reset-password']

export default function PublicNav({ siteName, siteLogo, isOrgSite }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Don't render on admin, platform, or auth pages
  if (HIDE_ON.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) return null

  const navLinks = isOrgSite ? ORG_NAV_LINKS : PLATFORM_NAV_LINKS

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false // anchor links never "active"
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  // Platform nav uses light variant; org nav uses dark
  const navClass  = `${styles.nav}  ${!isOrgSite ? styles.navPlatform : ''}`
  const linkClass = (href: string) =>
    `${styles.link} ${!isOrgSite ? styles.linkPlatform : ''} ${isActive(href) ? styles.linkActive : ''}`
  const mobileLinkClass = (href: string) =>
    `${styles.mobileLink} ${!isOrgSite ? styles.mobileLinkPlatform : ''} ${isActive(href) ? styles.mobileLinkActive : ''}`

  return (
    <>
      <nav className={navClass} role="navigation" aria-label="Main navigation">
        <div className={styles.inner}>
          {/* Brand */}
          <Link href="/" className={`${styles.brand} ${!isOrgSite ? styles.brandPlatform : ''}`} onClick={() => setOpen(false)}>
            {siteLogo
              ? <img src={siteLogo} alt={siteName} className={styles.brandLogo} />
              : <span className={styles.brandEmoji}>&#9917;</span>
            }
            {isOrgSite ? siteName : 'Football Live'}
          </Link>

          {/* Desktop links */}
          <ul className={styles.links} role="list">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={linkClass(href)}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTAs — only on platform marketing pages, not on org sites */}
          {!isOrgSite && (
            <div className={styles.authLinks}>
              <Link href="/login" className={styles.loginLink}>Sign In</Link>
              <Link href="/signup" className={`${styles.signupBtn} ${styles.signupBtnPlatform}`}>
                Get Started
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className={`${styles.hamburger} ${!isOrgSite ? styles.hamburgerPlatform : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? '\u2715' : '\u2630'}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className={`${styles.mobileMenu} ${!isOrgSite ? styles.mobileMenuPlatform : ''}`} role="menu">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={mobileLinkClass(href)}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {label}
            </Link>
          ))}

          {/* Auth CTAs in mobile menu — platform only */}
          {!isOrgSite && (
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.5rem 0', paddingTop: '0.5rem' }}>
              <Link
                href="/login"
                className={`${styles.mobileLink} ${styles.mobileLinkPlatform}`}
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className={`${styles.mobileLink} ${styles.mobileLinkPlatform}`}
                onClick={() => setOpen(false)}
                role="menuitem"
                style={{ color: '#1d4ed8', fontWeight: 700 }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}

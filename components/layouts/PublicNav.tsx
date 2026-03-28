'use client'

// components/layouts/PublicNav.tsx
// Fixed top navigation for public pages.
// Hides itself on /admin/*, /platform/*, /login, /signup, /forgot-password, /reset-password routes.
// Receives site name/logo as props from the root layout (server fetched).

import { useState } from 'react'
import Link          from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '@/styles/components/PublicNav.module.scss'

interface Props {
  siteName: string
  siteLogo?: string | null
}

const NAV_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/matches',     label: 'Matches' },
  { href: '/table',       label: 'Table' },
  { href: '/teams',       label: 'Teams' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/news',        label: 'News' },
  { href: '/archive',     label: 'Archive' },
]

// Routes where the public nav should not appear
const HIDE_ON = ['/admin', '/platform', '/login', '/signup', '/forgot-password', '/reset-password']

export default function PublicNav({ siteName, siteLogo }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Don't render on admin, platform, or auth pages
  if (HIDE_ON.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))) return null

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <nav className={styles.nav} role="navigation" aria-label="Main navigation">
        <div className={styles.inner}>
          {/* Brand */}
          <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
            {siteLogo
              ? <img src={siteLogo} alt={siteName} className={styles.brandLogo} />
              : <span className={styles.brandEmoji}>&#9917;</span>
            }
            {siteName}
          </Link>

          {/* Desktop links */}
          <ul className={styles.links} role="list">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.link} ${isActive(href) ? styles.linkActive : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth CTA */}
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.loginLink}>Sign In</Link>
            <Link href="/signup" className={styles.signupBtn}>Get Started</Link>
          </div>

          {/* Hamburger */}
          <button
            className={styles.hamburger}
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
        <div className={styles.mobileMenu} role="menu">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.mobileLink} ${isActive(href) ? styles.mobileLinkActive : ''}`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0', padding: '0.5rem 0' }}>
            <Link href="/login" className={styles.mobileLink} onClick={() => setOpen(false)} role="menuitem">
              Sign In
            </Link>
            <Link href="/signup" className={styles.mobileLink} onClick={() => setOpen(false)} role="menuitem"
              style={{ color: 'var(--color-accent-light)', fontWeight: 700 }}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

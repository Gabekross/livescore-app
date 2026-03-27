'use client'

// components/layouts/PublicNav.tsx
// Fixed top navigation for public pages.
// Hides itself completely on /admin/* routes.
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
  { href: '/archive',     label: 'Archive' },
]

export default function PublicNav({ siteName, siteLogo }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Don't render the public nav on admin pages at all
  if (pathname.startsWith('/admin')) return null

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
              : <span className={styles.brandEmoji}>⚽</span>
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

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? '✕' : '☰'}
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
        </div>
      )}
    </>
  )
}

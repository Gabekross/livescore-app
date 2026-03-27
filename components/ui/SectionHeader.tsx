// components/ui/SectionHeader.tsx
// Consistent section heading with an accent bar and optional CTA link.
// Works in server and client components.

import Link    from 'next/link'
import styles  from '@/styles/components/SectionHeader.module.scss'

interface Props {
  title:       string
  subtitle?:   string
  ctaLabel?:   string
  ctaHref?:    string
  className?:  string
}

export default function SectionHeader({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  className,
}: Props) {
  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <div className={styles.left}>
        <span className={styles.accent} aria-hidden="true" />
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel} →
        </Link>
      )}
    </div>
  )
}

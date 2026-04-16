// components/ui/SponsorStrip.tsx
// Public sponsor display — homepage (global sponsors) and tournament pages.
// Renders nothing when the sponsors array is empty.
// Title-tier sponsor gets a featured row above the rest.
// Gold / Silver / Bronze appear in the same row but at decreasing sizes.

import styles from '@/styles/components/SponsorStrip.module.scss'

export interface SponsorItem {
  id:          string
  name:        string
  logo_url:    string | null
  website_url: string | null
  tagline:     string | null
  tier:        string
}

interface Props {
  sponsors: SponsorItem[]
  label?:   string          // defaults to "Our Sponsors"
}

// Tier sort weight: title → gold → silver → bronze
const TIER_ORDER: Record<string, number> = {
  title: 0, gold: 1, silver: 2, bronze: 3,
}

// If a URL was saved without a protocol (e.g. "sponsor.com") the browser
// would treat it as a same-origin relative path.  Always ensure https://.
function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

export default function SponsorStrip({ sponsors, label = 'Our Sponsors' }: Props) {
  if (sponsors.length === 0) return null

  const sorted = [...sponsors].sort((a, b) => {
    const ta = TIER_ORDER[a.tier] ?? 4
    const tb = TIER_ORDER[b.tier] ?? 4
    return ta - tb
  })

  const titleSponsor  = sorted.find((s) => s.tier === 'title')
  const otherSponsors = sorted.filter((s) => s.tier !== 'title')

  const Logo = ({ s, className }: { s: SponsorItem; className: string }) =>
    s.logo_url
      ? <img src={s.logo_url} alt={s.name} className={className} />
      : <span className={styles.textLogo}>{s.name}</span>

  const Wrap = ({
    s, className, children,
  }: { s: SponsorItem; className: string; children: React.ReactNode }) =>
    s.website_url
      ? (
        <a
          href={toAbsoluteUrl(s.website_url)}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          title={s.name}
        >
          {children}
        </a>
      )
      : <div className={className}>{children}</div>

  // Tier → CSS module class for size/prominence
  const tierClass: Record<string, string> = {
    gold:   styles.tierGold,
    silver: styles.tierSilver,
    bronze: styles.tierBronze,
  }

  return (
    <section className={styles.strip} aria-label={label}>
      <p className={styles.label}>{label}</p>

      {/* Title sponsor — featured */}
      {titleSponsor && (
        <div className={styles.titleRow}>
          <Wrap s={titleSponsor} className={styles.titleLink}>
            <Logo s={titleSponsor} className={styles.titleLogo} />
            {!titleSponsor.logo_url && (
              <span className={styles.titleName}>{titleSponsor.name}</span>
            )}
            {titleSponsor.tagline && (
              <span className={styles.titleTagline}>{titleSponsor.tagline}</span>
            )}
          </Wrap>
        </div>
      )}

      {/* Gold / Silver / Bronze — horizontal row, size decreases by tier */}
      {otherSponsors.length > 0 && (
        <div className={styles.logosRow}>
          {otherSponsors.map((s) => (
            <Wrap
              key={s.id}
              s={s}
              className={`${styles.logoLink} ${tierClass[s.tier] ?? ''}`}
            >
              <Logo s={s} className={styles.logo} />
            </Wrap>
          ))}
        </div>
      )}
    </section>
  )
}

// components/platform/PlatformLanding.tsx
// SaaS marketing landing page — rendered when no org is resolved (main platform domain).
// Conversion-focused. Sports-agnostic. Light theme with dark-blue accents.
// Pricing is sourced from config/pricing.ts — never hardcoded here.

import Link   from 'next/link'
import styles from '@/styles/components/PlatformLanding.module.scss'
import {
  PRO_TIERS, FREE_PLAN, PRO_PLAN, PLAN_FEATURES,
  PRO_VALUE_FEATURES, formatPrice,
} from '@/config/pricing'

// ── Small static sub-components ───────────────────────────────────────────────

function BrowserDots() {
  return (
    <div className={styles.browserDots}>
      <span />
    </div>
  )
}

// ── Section: Hero ─────────────────────────────────────────────────────────────
function HeroSection({ demoMode }: { demoMode: boolean }) {
  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <div className={styles.heroBadge}>
            &#127942; Built for Sports Organizers
          </div>
          <h1 className={styles.heroTitle}>
            Your league deserves a<br />
            <span>professional website</span>
          </h1>
          <p className={styles.heroSub}>
            {demoMode
              ? 'Launch a live-updated sports site for your league, tournament, or club — with fixtures, standings, team pages, and real-time match management.'
              : 'Launch a live-updated sports site for your league, tournament, or club — with fixtures, standings, team pages, and real-time match management. Start free. Scale when you’re ready.'}
          </p>
          <div className={styles.heroCtas}>
            <Link href="/signup" className={styles.ctaPrimary}>
              {demoMode ? 'Get Started' : 'Start Your Free Trial'}
            </Link>
            {!demoMode && (
              <a href="#pricing" className={styles.ctaSecondary}>
                See Pricing
              </a>
            )}
          </div>
          {!demoMode && (
            <p className={styles.heroNote}>
              {FREE_PLAN.trialDays}-day free trial &middot; No credit card required &middot; Set up in minutes
            </p>
          )}
        </div>

        {/* Browser mockup — mini preview of the product */}
        <div className={styles.heroVisual}>
          <div className={styles.browserMockup} role="presentation" aria-hidden="true">
            <div className={styles.browserBar}>
              <BrowserDots />
              <div className={styles.browserUrl}>yourleague.kolusports.com</div>
            </div>
            <div className={styles.browserContent}>
              {/* Mini nav */}
              <div className={styles.previewNav}>
                <span className={styles.previewNavBrand}>&#127942; Spring League</span>
                <div className={styles.previewNavLinks}>
                  <span>Fixtures</span>
                  <span>Table</span>
                  <span>Teams</span>
                </div>
                <div className={styles.previewLiveChip}>&#9679; Live</div>
              </div>

              {/* Live match card */}
              <div className={styles.previewMatchCard}>
                <div className={styles.previewMatchMeta}>
                  <span>Quarter Final</span>
                  <span style={{ color: '#ef4444' }}>&#9679; 73&apos;</span>
                </div>
                <div className={styles.previewMatchRow}>
                  <span className={styles.previewTeam}>FC United</span>
                  <div className={styles.previewScores}>
                    <span>2</span>
                    <span>&ndash;</span>
                    <span>1</span>
                  </div>
                  <span className={`${styles.previewTeam} ${styles.previewTeamRight}`}>
                    City FC
                  </span>
                </div>
              </div>

              {/* Mini standings */}
              <div className={styles.previewStandings}>
                <div className={styles.previewStandingsTitle}>Group A</div>
                {[
                  { pos: 1, name: 'FC United',  w: 3, d: 1, l: 0, pts: 10 },
                  { pos: 2, name: 'City FC',    w: 2, d: 0, l: 2, pts:  6 },
                  { pos: 3, name: 'Athletic',   w: 0, d: 1, l: 3, pts:  1 },
                ].map((row) => (
                  <div key={row.pos} className={styles.previewStandingsRow}>
                    <span className={styles.previewStandingsPos}>{row.pos}</span>
                    <span className={styles.previewStandingsTeam}>{row.name}</span>
                    <div className={styles.previewStandingsStats}>
                      <span>{row.w}</span>
                      <span>{row.d}</span>
                      <span>{row.l}</span>
                      <span className={styles.previewPts}>{row.pts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section: Who It's For ─────────────────────────────────────────────────────
const USE_CASES = [
  { title: 'Community Tournaments', image: '/images/use-cases/community-tournaments.webp', alt: 'Community football tournament match in action' },
  { title: 'Amateur Clubs',        image: '/images/use-cases/amateur-clubs.webp',          alt: 'Amateur football club team photo' },
  { title: 'Academies & Schools',  image: '/images/use-cases/academies-schools.webp',      alt: 'Youth football academy coaching session' },
  { title: 'Church Leagues',       image: '/images/use-cases/church-leagues.webp',         alt: 'Church league football match with players' },
  { title: 'Regional Federations', image: '/images/use-cases/regional-federations.webp',   alt: 'Regional football federation team lineup in stadium' },
]

function WhoSection() {
  return (
    <section className={styles.whoSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>Who It&apos;s For</div>
          <h2 className={styles.sectionTitle}>Built for sports organizers</h2>
          <p className={styles.sectionSub}>
            Whether you run a local community tournament, a club league, or a regional
            competition, this platform gives you the tools to run a professional sports website.
          </p>
        </div>
        <div className={styles.whoGrid}>
          {USE_CASES.map((item) => (
            <div key={item.title} className={styles.whoCard}>
              <div className={styles.whoImageWrap}>
                <img src={item.image} alt={item.alt} className={styles.whoImage} loading="lazy" />
              </div>
              <span className={styles.whoName}>{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: How It Works ─────────────────────────────────────────────────────
function HowSection() {
  const steps = [
    {
      num: '1',
      title: 'Create your site',
      text: 'Sign up, name your organization, and get your own public URL in under a minute.',
    },
    {
      num: '2',
      title: 'Manage everything',
      text: 'Add teams, schedule matches, run tournaments, and publish news from your admin dashboard.',
    },
    {
      num: '3',
      title: 'Share with your audience',
      text: 'Your fans get a live-updated, mobile-friendly site with scores, standings, and more.',
    },
  ]

  return (
    <section id="how-it-works" className={styles.howSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>How It Works</div>
          <h2 className={styles.sectionTitle}>From sign-up to live site in minutes</h2>
        </div>
        <div className={styles.howSteps}>
          {steps.map((step) => (
            <div key={step.num} className={styles.howStep}>
              <div className={styles.howStepNumber}>{step.num}</div>
              <h3 className={styles.howStepTitle}>{step.title}</h3>
              <p className={styles.howStepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Pricing ──────────────────────────────────────────────────────────
function PricingSection() {
  const monthlyTier = PRO_TIERS.find(t => t.interval === 'month')!

  return (
    <section id="pricing" className={styles.pricingSection} aria-label="Pricing">
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>Pricing</div>
          <h2 className={styles.sectionTitle}>Simple pricing. Powerful results.</h2>
          <p className={styles.sectionSub}>
            Start with a {FREE_PLAN.trialDays}-day Basic trial. Upgrade when your league is ready to grow.
          </p>
        </div>

        <div className={styles.pricingGrid}>
          {/* ── Free Trial ────────────────────────── */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingPlanName}>{FREE_PLAN.name}</div>
            <div className={styles.pricingPrice}>Free</div>
            <div className={styles.pricingPriceSub}>{FREE_PLAN.tagline}</div>
            <ul className={styles.pricingFeatures}>
              <li>{FREE_PLAN.trialDays} days to explore everything</li>
              <li>Up to {FREE_PLAN.teamLimit} teams</li>
              <li>Live scores &amp; standings</li>
              <li>Team &amp; player pages</li>
              <li>Fixtures, results &amp; match centre</li>
              <li>Your own site on kolusports.com</li>
            </ul>
            <Link href="/signup" className={styles.pricingBtnOutline}>
              {FREE_PLAN.cta}
            </Link>
          </div>

          {/* ── Pro Plan ──────────────────────────── */}
          <div className={styles.pricingCardFeatured}>
            <div className={styles.pricingBadge}>{PRO_PLAN.name}</div>
            <div className={styles.pricingPlanName}>{PRO_PLAN.name}</div>
            <div className={styles.pricingPrice}>
              {formatPrice(monthlyTier.price)} <span>/ month</span>
            </div>
            <div className={styles.pricingPriceSub}>{PRO_PLAN.tagline}</div>

            {/* Billing selector */}
            <div className={styles.billingSelector}>
              {PRO_TIERS.map((tier) => (
                <div key={tier.interval} className={styles.billingSelectorOption}>
                  <span className={styles.billingSelectorLabel}>{tier.label}</span>
                  <span className={styles.billingSelectorPrice}>
                    {formatPrice(tier.price)}{tier.interval === 'year' ? '/yr' : `/${tier.interval === 'week' ? 'wk' : 'mo'}`}
                  </span>
                  {tier.badge && (
                    <span className={
                      tier.badge === 'Most Popular'
                        ? styles.billingSelectorBadgePopular
                        : styles.billingSelectorBadgeSave
                    }>
                      {tier.savings || tier.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <ul className={styles.pricingFeatures}>
              <li>Everything in Free Trial, plus:</li>
              {PRO_VALUE_FEATURES.map((f) => (
                <li key={f.title}>{f.title}</li>
              ))}
            </ul>
            <Link href="/signup" className={styles.pricingBtnPrimary}>
              {PRO_PLAN.cta}
            </Link>
          </div>
        </div>

        {/* ── Feature comparison ────────────────── */}
        <div className={styles.pricingComparison}>
          <h3 className={styles.pricingComparisonTitle}>Compare plans</h3>
          <table className={styles.pricingTable}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Basic</th>
                <th className={styles.pricingTableProHead}>Pro</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((f) => (
                <tr key={f.name}>
                  <td>{f.name}</td>
                  <td>{f.free}</td>
                  <td className={styles.pricingTableProCell}>{f.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ── Section: FAQ ──────────────────────────────────────────────────────────────
function FaqSection() {
  const faqs = [
    {
      q: 'How quickly can I launch my site?',
      a: 'Sign up, name your organization, and your public site is live instantly. Adding teams and matches takes just minutes from the admin dashboard.',
    },
    {
      q: 'Do I need technical skills?',
      a: 'No. The platform is designed for sports organizers, not developers. Everything is point-and-click — no code, no hosting setup.',
    },
    {
      q: 'What happens when my free trial ends?',
      a: 'Your data is safe — nothing gets deleted. You can still view everything, but creating and editing content requires upgrading to Pro.',
    },
    {
      q: 'Can I change my billing plan later?',
      a: 'Yes. You can switch between weekly, monthly, and yearly billing at any time from your settings. Upgrades take effect immediately.',
    },
    {
      q: 'How do live scores work?',
      a: 'You (or a match operator you assign) update the score from any phone during the match. Your public site reflects every change in real time.',
    },
  ]

  return (
    <section className={styles.faqSection} aria-label="FAQ">
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>FAQ</div>
          <h2 className={styles.sectionTitle}>Common questions</h2>
        </div>
        <div className={styles.faqGrid}>
          {faqs.map((faq) => (
            <div key={faq.q} className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>{faq.q}</h3>
              <p className={styles.faqAnswer}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Final CTA ────────────────────────────────────────────────────────
function FinalCtaSection({ demoMode }: { demoMode: boolean }) {
  return (
    <section className={styles.finalCta} aria-label="Get started">
      <div className={styles.finalCtaInner}>
        <h2 className={styles.finalCtaTitle}>
          Ready to run your league<br />like a pro?
        </h2>
        <p className={styles.finalCtaSub}>
          Join sports organizers who trust our platform to power their live scores,
          standings, and match-day operations — all from one dashboard.
        </p>
        <div className={styles.finalCtaBtns}>
          <Link href="/signup" className={styles.finalCtaBtnPrimary}>
            {demoMode ? 'Get Started' : 'Start Your Free Trial'}
          </Link>
          {!demoMode && (
            <a href="#pricing" className={styles.finalCtaBtnSecondary}>
              See Plans
            </a>
          )}
        </div>
        {!demoMode && (
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem' }}>
            {FREE_PLAN.trialDays}-day Basic trial &middot; No credit card required
          </p>
        )}
      </div>
    </section>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
interface PlatformLandingProps {
  /** When true, hides the pricing section and replaces trial-themed CTAs. */
  demoMode?: boolean
}

export default function PlatformLanding({ demoMode = false }: PlatformLandingProps) {
  return (
    <div className={styles.page}>
      <HeroSection demoMode={demoMode} />
      <WhoSection />
      <HowSection />
      {!demoMode && <PricingSection />}
      <FaqSection />
      <FinalCtaSection demoMode={demoMode} />
    </div>
  )
}

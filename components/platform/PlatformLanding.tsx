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
function HeroSection() {
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
            Launch a live-updated sports site for your league, tournament, or
            club — with fixtures, standings, team pages, and real-time match
            management. Start free. Scale when you&apos;re ready.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Start Your Free Trial
            </Link>
            <a href="#pricing" className={styles.ctaSecondary}>
              See Pricing
            </a>
          </div>
          <p className={styles.heroNote}>
            {FREE_PLAN.trialDays}-day free trial &middot; No credit card required &middot; Set up in minutes
          </p>
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

// ── Section: Trust bar ────────────────────────────────────────────────────────
function TrustBar() {
  return (
    <div className={styles.trustBar}>
      <div className={styles.trustBarInner}>
        <span className={styles.trustLabel}>Built for organizations like</span>
        <div className={styles.trustNames}>
          {['Community Tournaments', 'Local Academies', 'Church Leagues', 'Amateur Clubs', 'Regional Federations'].map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section: Product Showcase ─────────────────────────────────────────────────
function ShowcaseSection() {
  return (
    <section id="features" className={styles.showcaseSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>Product Preview</div>
          <h2 className={styles.sectionTitle}>See what your site looks like</h2>
          <p className={styles.sectionSub}>
            A professional, live-updated sports website — built and published
            from your admin dashboard.
          </p>
        </div>

        <div className={styles.showcaseGrid}>
          {/* Demo: Live Match */}
          <div className={styles.showcaseCard}>
            <div className={styles.showcaseCardHeader}>
              <span className={styles.showcaseCardLabel}>Match Centre</span>
              <div className={styles.demoLive}>Live</div>
            </div>
            <div className={styles.demoMatchBody}>
              <div className={styles.demoMatchMeta}>
                <span>Spring Cup 2026 &middot; Semi Final</span>
                <span>73&apos;</span>
              </div>
              <div className={styles.demoMatchScoreRow}>
                <span className={styles.demoTeamName}>FC United</span>
                <div className={styles.demoScoreBox}>
                  <span>2</span><span>&ndash;</span><span>1</span>
                </div>
                <span className={`${styles.demoTeamName} ${styles.demoTeamNameR}`}>City FC</span>
              </div>
              <div className={styles.demoMatchEvents}>
                <div>
                  <div>&#9917; 24&apos; Harris</div>
                  <div>&#9917; 55&apos; Torres</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>&#9917; 67&apos; Mills</div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo: Group Standings */}
          <div className={styles.showcaseCard}>
            <div className={styles.showcaseCardHeader}>
              <span className={styles.showcaseCardLabel}>Group Standings</span>
            </div>
            <div className={styles.demoStandingsBody}>
              <table className={styles.demoTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { pos: 1, name: 'FC United',  p: 4, w: 3, d: 1, l: 0, pts: 10 },
                    { pos: 2, name: 'City FC',    p: 4, w: 2, d: 1, l: 1, pts:  7 },
                    { pos: 3, name: 'Athletic',   p: 4, w: 1, d: 0, l: 3, pts:  3 },
                    { pos: 4, name: 'Town SC',    p: 4, w: 0, d: 0, l: 4, pts:  0 },
                  ].map((row) => (
                    <tr key={row.pos}>
                      <td className={styles.demoPos}>{row.pos}</td>
                      <td>{row.name}</td>
                      <td>{row.p}</td>
                      <td>{row.w}</td>
                      <td>{row.d}</td>
                      <td>{row.l}</td>
                      <td className={styles.demoPts}>{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Demo: Team Card */}
          <div className={styles.showcaseCard}>
            <div className={styles.showcaseCardHeader}>
              <span className={styles.showcaseCardLabel}>Team Page</span>
            </div>
            <div className={styles.demoTeamBody}>
              <div className={styles.demoTeamHeader}>
                <div className={styles.demoTeamAvatar}>FC</div>
                <div className={styles.demoTeamInfo}>
                  <h4>FC United</h4>
                  <span>Spring Cup 2026 &middot; Group A</span>
                </div>
              </div>
              <div className={styles.demoTeamStats}>
                <div className={styles.demoStatBox}>
                  <span className={styles.demoStatNum}>14</span>
                  <span className={styles.demoStatLabel}>Players</span>
                </div>
                <div className={styles.demoStatBox}>
                  <span className={styles.demoStatNum}>3W 1D</span>
                  <span className={styles.demoStatLabel}>Form</span>
                </div>
                <div className={styles.demoStatBox}>
                  <span className={styles.demoStatNum}>10</span>
                  <span className={styles.demoStatLabel}>Points</span>
                </div>
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

// ── Section: What Your Site Includes ─────────────────────────────────────────
const INCLUDES_ITEMS = [
  { title: 'Homepage',           text: 'Branded landing page with live matches, upcoming fixtures, and latest results.',        image: '/images/includes/homepage.svg',           alt: 'Organization homepage with live matches and fixtures' },
  { title: 'Fixtures & Results', text: 'Full match calendar with real-time status updates and final scores.',                   image: '/images/includes/fixtures-results.svg',   alt: 'Match calendar with real-time updates' },
  { title: 'Standings Tables',   text: 'Automatic group standings updated instantly when matches are completed.',               image: '/images/includes/standings-tables.svg',   alt: 'Auto-computed league standings table' },
  { title: 'Team Pages',         text: 'Club profiles with squad rosters, player stats, and logos.',                            image: '/images/includes/team-pages.svg',         alt: 'Team profile with squad roster' },
  { title: 'Match Centre',       text: 'Live match detail with lineups, scorers, cards, and substitutions.',                    image: '/images/includes/match-centre.svg',       alt: 'Live match centre with score and events' },
  { title: 'News & Media',       text: 'Publish articles, post updates, and manage your media library.',                        image: '/images/includes/news-media-includes.svg', alt: 'News article cards and media grid' },
]

function IncludesSection() {
  return (
    <section className={styles.includesSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>What You Get</div>
          <h2 className={styles.sectionTitle}>Everything your site needs</h2>
          <p className={styles.sectionSub}>
            Your organization site comes with a complete suite of competition
            features — ready to go live from day one.
          </p>
        </div>
        <div className={styles.includesGrid}>
          {INCLUDES_ITEMS.map((item) => (
            <div key={item.title} className={styles.includesCard}>
              <div className={styles.includesImageWrap}>
                <img src={item.image} alt={item.alt} className={styles.includesImage} loading="lazy" />
              </div>
              <h3 className={styles.includesTitle}>{item.title}</h3>
              <p className={styles.includesText}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Built for Match Day ──────────────────────────────────────────────
const MATCH_DAY_CARDS = [
  { title: 'Live score updates',  text: 'Update scorelines in real time from any device. Your audience sees changes the moment you save.',           image: '/images/match-day/live-updates.svg',       alt: 'Real-time score update interface' },
  { title: 'Match operator role', text: 'Give game-day staff a restricted login — they can only update scores and match status, nothing else.',       image: '/images/match-day/match-operator.svg',     alt: 'Match operator updating scores on device' },
  { title: 'Mobile-first design', text: 'The admin panel and public site are both built for phones. No laptop required on match day.',                image: '/images/match-day/mobile-first.svg',       alt: 'Mobile-optimized sports interface' },
  { title: 'Instant publishing',  text: 'Every score update, result, and standings change is reflected immediately on your public site.',             image: '/images/match-day/instant-publishing.svg', alt: 'Instant content publishing interface' },
]

function MatchDaySection() {
  return (
    <section className={styles.matchDaySection} aria-label="Match day features">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Match Day</div>
          <h2 className={styles.sectionTitle}>Powerful on the pitch. Effortless in the admin.</h2>
          <p className={styles.sectionSub}>
            Designed for real match-day operations — fast, mobile-ready, and built
            for the pressure of live competition management.
          </p>
        </div>
        <div className={styles.matchDayGrid}>
          {MATCH_DAY_CARDS.map((card) => (
            <div key={card.title} className={styles.matchDayCard}>
              <div className={styles.matchDayImageWrap}>
                <img src={card.image} alt={card.alt} className={styles.matchDayImage} loading="lazy" />
              </div>
              <h3 className={styles.matchDayCardTitle}>{card.title}</h3>
              <p className={styles.matchDayCardText}>{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section: Demo Device Mockups ──────────────────────────────────────────────
function DemoSection() {
  return (
    <section className={styles.demoSection} aria-label="Product demo">
      <div className={styles.container}>

        {/* Demo 1: Mobile — Live match view */}
        <div className={styles.demoDevices} style={{ marginBottom: '5rem' }}>
          <div className={styles.phoneMockup}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                {/* Image placeholder — swap with: /placeholders/mobile-live-score-preview.webp */}
                <div className={styles.imagePlaceholder}>
                  <div className={styles.imagePlaceholderIcon}>&#128241;</div>
                  <span className={styles.imagePlaceholderLabel}>Mobile live score view</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.demoTextBlock}>
            <div className={styles.demoTextTag}>Mobile Experience</div>
            <h3 className={styles.demoTextTitle}>Live scores, anywhere</h3>
            <p className={styles.demoTextBody}>
              Fans follow matches in real time on any device. The public site
              is optimized for mobile — fast, clean, and always up to date.
              No app download required.
            </p>
          </div>
        </div>

        {/* Demo 2: Desktop — Admin dashboard */}
        <div className={styles.demoDevicesReversed}>
          <div className={styles.demoTextBlock}>
            <div className={styles.demoTextTag}>Admin Dashboard</div>
            <h3 className={styles.demoTextTitle}>Manage your whole league from one place</h3>
            <p className={styles.demoTextBody}>
              Tournaments, teams, matches, news, and site settings — all
              accessible from a clean, fast admin panel. No technical
              knowledge required.
            </p>
          </div>
          <div className={styles.demoBrowserMockup} role="presentation" aria-hidden="true">
            <div className={styles.browserBar}>
              <BrowserDots />
              <div className={styles.browserUrl}>app.kolusports.com</div>
            </div>
            <div className={styles.demoBrowserContent}>
              {/* Image placeholder — swap with: /placeholders/admin-dashboard-preview.webp */}
              <div className={styles.imagePlaceholder}>
                <div className={styles.imagePlaceholderIcon}>&#9881;</div>
                <span className={styles.imagePlaceholderLabel}>Admin dashboard</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ── Section: Feature Highlights ───────────────────────────────────────────────
const FEATURES = [
  { title: 'Live Scores',          text: 'Real-time score updates during matches with automatic standings recalculation.',     image: '/images/features/live-scores.webp',         alt: 'Live football scoreboard and match update interface' },
  { title: 'Fixtures & Standings', text: 'Full match calendar and auto-computed group tables after each completed match.',      image: '/images/features/fixtures-standings.webp',  alt: 'Fixtures calendar and league standings table' },
  { title: 'Teams & Players',     text: 'Manage club rosters, player profiles, and squad assignments per tournament.',         image: '/images/features/teams-players.webp',       alt: 'Team lineup and player roster management' },
  { title: 'News & Media',        text: 'Publish articles and updates to your audience with a built-in rich text editor.',     image: '/images/features/news-media.webp',          alt: 'Sports photographer and media content creation' },
  { title: 'Admin Dashboard',     text: 'A clean, role-based admin panel for you and your staff — no coding needed.',          image: '/images/features/admin-dashboard.webp',     alt: 'Admin dashboard with analytics and controls' },
  { title: 'PWA / Mobile Ready',  text: 'Installable as a progressive web app. Fast, offline-aware, and mobile-optimized.',   image: '/images/features/pwa-mobile.webp',          alt: 'Mobile phone showing live sports app' },
]

function FeaturesSection() {
  return (
    <section className={styles.featuresSection} aria-label="Feature highlights">
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>Features</div>
          <h2 className={styles.sectionTitle}>Everything in one platform</h2>
          <p className={styles.sectionSub}>
            No third-party tools needed. No spreadsheets. No manual score
            announcements. Everything you need runs on your own branded site.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureCardImageWrap}>
                <img src={f.image} alt={f.alt} className={styles.featureCardImage} loading="lazy" />
              </div>
              <h3 className={styles.featureCardTitle}>{f.title}</h3>
              <p className={styles.featureCardText}>{f.text}</p>
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
            Start with a {FREE_PLAN.trialDays}-day free trial. Upgrade when your league is ready to grow.
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
                <th>Free</th>
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
    {
      q: 'What happens to my data if I cancel?',
      a: 'Your data is stored securely and belongs to you. All match history, team data, and content remains accessible. You just lose access to Pro features.',
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
function FinalCtaSection() {
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
            Start Your Free Trial
          </Link>
          <a href="#pricing" className={styles.finalCtaBtnSecondary}>
            See Plans
          </a>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem' }}>
          {FREE_PLAN.trialDays}-day free trial &middot; No credit card required
        </p>
      </div>
    </section>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PlatformLanding() {
  return (
    <div className={styles.page}>
      <HeroSection />
      <TrustBar />
      <ShowcaseSection />
      <WhoSection />
      <HowSection />
      <IncludesSection />
      <MatchDaySection />
      <DemoSection />
      <FeaturesSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </div>
  )
}

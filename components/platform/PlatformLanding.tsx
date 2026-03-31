// components/platform/PlatformLanding.tsx
// SaaS marketing landing page — rendered when no org is resolved (main platform domain).
// Entirely static — no data fetching. Light theme with dark-blue accents.

import Link   from 'next/link'
import styles from '@/styles/components/PlatformLanding.module.scss'

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
            &#9917; Football Platform
          </div>
          <h1 className={styles.heroTitle}>
            Launch your football<br />
            <span>website in minutes</span>
          </h1>
          <p className={styles.heroSub}>
            The all-in-one platform for tournament organizers. Live scores,
            fixtures, standings, team pages, and match-day operations —
            professional and ready to share.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Get Started Free
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              Sign In
            </Link>
          </div>
          <p className={styles.heroNote}>No credit card required &middot; Set up in minutes</p>
        </div>

        {/* Browser mockup — mini preview of the product */}
        <div className={styles.heroVisual}>
          <div className={styles.browserMockup} role="presentation" aria-hidden="true">
            <div className={styles.browserBar}>
              <BrowserDots />
              <div className={styles.browserUrl}>yourleague.footballlive.com</div>
            </div>
            <div className={styles.browserContent}>
              {/* Mini nav */}
              <div className={styles.previewNav}>
                <span className={styles.previewNavBrand}>&#9917; Spring League</span>
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
            A professional, live-updated football site — built and published
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
function WhoSection() {
  const orgs = [
    { icon: '&#127942;', name: 'Community Tournaments' },
    { icon: '&#9917;',   name: 'Amateur Clubs' },
    { icon: '&#127979;', name: 'Academy Competitions' },
    { icon: '&#9813;',   name: 'Church Leagues' },
    { icon: '&#127757;', name: 'Regional Federations' },
  ]

  return (
    <section className={styles.whoSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>Who It&apos;s For</div>
          <h2 className={styles.sectionTitle}>Built for football organizers</h2>
          <p className={styles.sectionSub}>
            Whether you run a local community tournament or a regional competition,
            this platform gives you the tools to run a professional football site.
          </p>
        </div>
        <div className={styles.whoGrid}>
          {orgs.map((org) => (
            <div key={org.name} className={styles.whoCard}>
              <span
                className={styles.whoIcon}
                dangerouslySetInnerHTML={{ __html: org.icon }}
              />
              <span className={styles.whoName}>{org.name}</span>
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
function IncludesSection() {
  const items = [
    { icon: '&#127968;', title: 'Homepage',          text: 'Branded landing page with live matches, upcoming fixtures, and latest results.' },
    { icon: '&#128197;', title: 'Fixtures & Results', text: 'Full match calendar with real-time status updates and final scores.' },
    { icon: '&#127942;', title: 'Standings Tables',   text: 'Automatic group standings updated instantly when matches are completed.' },
    { icon: '&#128101;', title: 'Team Pages',         text: 'Club profiles with squad rosters, player stats, and logos.' },
    { icon: '&#9917;',   title: 'Match Centre',       text: 'Live match detail with lineups, goal scorers, cards, and substitutions.' },
    { icon: '&#128240;', title: 'News & Media',       text: 'Publish articles, post updates, and manage your media library.' },
  ]

  return (
    <section className={styles.includesSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>What You Get</div>
          <h2 className={styles.sectionTitle}>Everything your site needs</h2>
          <p className={styles.sectionSub}>
            Your organization site comes with a complete suite of football
            features — ready to go live from day one.
          </p>
        </div>
        <div className={styles.includesGrid}>
          {items.map((item) => (
            <div key={item.title} className={styles.includesCard}>
              <span
                className={styles.includesIcon}
                dangerouslySetInnerHTML={{ __html: item.icon }}
              />
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
function MatchDaySection() {
  const cards = [
    {
      icon: '&#128308;',
      title: 'Live score updates',
      text: 'Update scorelines in real time from any device. Your audience sees changes the moment you save.',
    },
    {
      icon: '&#128100;',
      title: 'Match operator role',
      text: 'Give game-day staff a restricted login — they can only update scores and match status, nothing else.',
    },
    {
      icon: '&#128241;',
      title: 'Mobile-first design',
      text: 'The admin panel and public site are both built for phones. No laptop required on match day.',
    },
    {
      icon: '&#9889;',
      title: 'Instant publishing',
      text: 'Every score update, result, and standings change is reflected immediately on your public site.',
    },
  ]

  return (
    <section className={styles.matchDaySection} aria-label="Match day features">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>Match Day</div>
          <h2 className={styles.sectionTitle}>Powerful on the pitch. Effortless in the admin.</h2>
          <p className={styles.sectionSub}>
            Designed for real football operations — fast, mobile-ready, and built
            for the pressure of live match management.
          </p>
        </div>
        <div className={styles.matchDayGrid}>
          {cards.map((card) => (
            <div key={card.title} className={styles.matchDayCard}>
              <span
                className={styles.matchDayCardIcon}
                dangerouslySetInnerHTML={{ __html: card.icon }}
              />
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
                <div className={styles.videoPlaceholder}>
                  <div className={styles.playBtn}>&#9654;</div>
                  <span className={styles.videoLabel}>Live match view<br />on mobile</span>
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
              <div className={styles.browserUrl}>yourleague.com/admin</div>
            </div>
            <div className={styles.demoBrowserContent}>
              <div className={styles.videoPlaceholder}>
                <div className={styles.playBtn}>&#9654;</div>
                <span className={styles.videoLabel}>Admin dashboard<br />walkthrough</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ── Section: Feature Highlights ───────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: '&#128308;', title: 'Live Scores',        text: 'Real-time score updates during matches with automatic standings recalculation.' },
    { icon: '&#128197;', title: 'Fixtures & Standings', text: 'Full match calendar and auto-computed group tables after each completed match.' },
    { icon: '&#128101;', title: 'Teams & Players',    text: 'Manage club rosters, player profiles, and squad assignments per tournament.' },
    { icon: '&#128240;', title: 'News & Media',       text: 'Publish articles and updates to your audience with a built-in rich text editor.' },
    { icon: '&#9881;',   title: 'Admin Dashboard',    text: 'A clean, role-based admin panel for you and your staff — no coding needed.' },
    { icon: '&#128241;', title: 'PWA / Mobile Ready', text: 'Installable as a progressive web app. Fast, offline-aware, and mobile-optimized.' },
  ]

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
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureCardIcon}>
                <span dangerouslySetInnerHTML={{ __html: f.icon }} />
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
  return (
    <section id="pricing" className={styles.pricingSection} aria-label="Pricing">
      <div className={styles.container}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionTag}>Pricing</div>
          <h2 className={styles.sectionTitle}>Plans for every stage</h2>
          <p className={styles.sectionSub}>
            Simple, transparent plans. Start free — upgrade as you grow.
          </p>
          <div className={styles.pricingComingSoonWrap} style={{ marginTop: '0.75rem' }}>
            <span className={styles.pricingComingSoon}>
              &#x1F6A7; Pricing plans launching soon &mdash; contact us for early access
            </span>
          </div>
        </div>

        <div className={styles.pricingGrid}>
          {/* Starter */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingPlanName}>Starter</div>
            <div className={styles.pricingPrice}>Free</div>
            <div className={styles.pricingPriceSub}>Perfect for getting started</div>
            <ul className={styles.pricingFeatures}>
              <li>1 organization</li>
              <li>Up to 2 active tournaments</li>
              <li>Up to 10 teams</li>
              <li>Live scores &amp; standings</li>
              <li>Team &amp; player pages</li>
              <li>Public site on platform subdomain</li>
            </ul>
            <Link href="/signup" className={styles.pricingBtnOutline}>
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className={styles.pricingCardFeatured}>
            <div className={styles.pricingBadge}>Most Popular</div>
            <div className={styles.pricingPlanName}>Pro</div>
            <div className={styles.pricingPrice}>
              TBD <span>/ month</span>
            </div>
            <div className={styles.pricingPriceSub}>For growing leagues &amp; academies</div>
            <ul className={styles.pricingFeatures}>
              <li>Everything in Starter</li>
              <li>Unlimited tournaments</li>
              <li>Custom domain support</li>
              <li>News &amp; media publishing</li>
              <li>Match operator accounts</li>
              <li>Advanced site settings &amp; branding</li>
              <li>Priority support</li>
            </ul>
            <Link href="/signup" className={styles.pricingBtnPrimary}>
              Get started
            </Link>
          </div>

          {/* Enterprise */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingPlanName}>Enterprise</div>
            <div className={styles.pricingPrice}>Custom</div>
            <div className={styles.pricingPriceSub}>For large organizations &amp; federations</div>
            <ul className={styles.pricingFeatures}>
              <li>Everything in Pro</li>
              <li>Multi-organization management</li>
              <li>Dedicated support</li>
              <li>Custom onboarding</li>
              <li>SLA &amp; uptime guarantees</li>
              <li>White-label options</li>
            </ul>
            <a href="mailto:hello@footballlive.com" className={styles.pricingBtnOutline}>
              Contact sales
            </a>
          </div>
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
      a: "Sign up, name your organization, and your public site is live instantly. Adding teams and matches takes just minutes from the admin dashboard.",
    },
    {
      q: 'Do I need technical skills?',
      a: 'No. The platform is designed for football organizers, not developers. Everything is point-and-click — no code, no hosting setup.',
    },
    {
      q: 'How do live scores work?',
      a: "You (or a match operator you assign) update the score from any phone during the match. Your public site reflects every change in real time.",
    },
    {
      q: 'Can I give someone else access?',
      a: 'Yes. You can create match operator accounts for game-day staff with restricted access — they can only update scores, nothing else.',
    },
    {
      q: 'Can I use a custom domain name?',
      a: 'Custom domains are available on the Pro plan. All sites get a free subdomain at yourleague.footballlive.com on the Starter plan.',
    },
    {
      q: 'What happens to my data?',
      a: 'Your data is stored securely and belongs to you. All match history, team data, and content remains accessible as long as your account is active.',
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
          Ready to launch your<br />football website?
        </h2>
        <p className={styles.finalCtaSub}>
          Join football organizers who are running professional sites with live
          scores, standings, and match management — all in one place.
        </p>
        <div className={styles.finalCtaBtns}>
          <Link href="/signup" className={styles.finalCtaBtnPrimary}>
            Get Started Free
          </Link>
          <a href="mailto:hello@footballlive.com" className={styles.finalCtaBtnSecondary}>
            Contact Us
          </a>
        </div>
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

// data/help/index.ts
// Central help content registry — structured by module and context.

export interface HelpArticle {
  id:           string
  title:        string
  summary:      string
  body:         string[]
  category:     HelpCategory
  roles:        UserRole[]
  relatedIds?:  string[]
  requiresPro?: boolean   // if true, only visible to Pro plan users
}

export type HelpCategory =
  | 'getting-started'
  | 'tournaments'
  | 'teams'
  | 'matches'
  | 'news'
  | 'media'
  | 'settings'
  | 'billing'
  | 'operators'
  | 'public-site'

export type UserRole = 'visitor' | 'operator' | 'org_admin' | 'power_admin'

export const HELP_CATEGORIES: { key: HelpCategory; label: string }[] = [
  { key: 'getting-started', label: 'Getting Started' },
  { key: 'tournaments',     label: 'Tournaments' },
  { key: 'teams',           label: 'Teams' },
  { key: 'matches',         label: 'Matches' },
  { key: 'news',            label: 'News & Articles' },
  { key: 'media',           label: 'Media Library' },
  { key: 'settings',        label: 'Site Settings' },
  { key: 'billing',         label: 'Billing & Plans' },
  { key: 'operators',       label: 'Match Operators' },
  { key: 'public-site',     label: 'Public Site' },
]

export const HELP_ARTICLES: HelpArticle[] = [
  // ── Getting Started ──────────────────────────────────────
  {
    id:       'gs-overview',
    title:    'Welcome to KoluSports',
    summary:  'Learn what KoluSports is and how to get started with your football platform.',
    body: [
      'KoluSports is a multi-organization football platform that lets you run your own sports website with live scores, tournaments, teams, and news.',
      'After signing up, you get a free trial with access to core features. Your admin dashboard is the central hub for managing everything.',
      'Start by creating a tournament, adding teams, and scheduling matches. Your public site updates automatically as you make changes.',
    ],
    category: 'getting-started',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['gs-first-tournament', 'gs-dashboard'],
  },
  {
    id:       'gs-dashboard',
    title:    'Using the Admin Dashboard',
    summary:  'Navigate the admin dashboard to manage your sports site.',
    body: [
      'The admin dashboard is organized into three sections: Operations, Content & Site, and People & Access.',
      'Operations covers tournaments, teams, matches, and player management. Content & Site handles news publishing, media, and site settings. People & Access lets you manage match operators.',
      'The top navigation bar shows your organization name, current plan, and quick links to Sponsors and Settings.',
    ],
    category: 'getting-started',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['gs-overview', 'settings-branding'],
  },
  {
    id:       'gs-first-tournament',
    title:    'Creating Your First Tournament',
    summary:  'Step-by-step guide to setting up your first tournament.',
    body: [
      'Go to the admin dashboard and click "Tournaments" under Operations, then click "New Tournament".',
      'Give your tournament a name and configure its settings. After creation, add stages (e.g., Group Stage, Knockout). Each stage can have groups.',
      'Assign teams to groups, then schedule matches within each group. Once matches are scheduled, they appear automatically on your public site.',
    ],
    category: 'getting-started',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['tournaments-stages', 'tournaments-groups'],
  },

  // ── Tournaments ──────────────────────────────────────────
  {
    id:       'tournaments-stages',
    title:    'Managing Tournament Stages',
    summary:  'Add and configure stages within a tournament.',
    body: [
      'Tournaments are organized into stages such as Group Stage, Round of 16, Quarter Finals, etc.',
      'Each stage can contain one or more groups. Navigate to your tournament and click "Manage Stages" to add, edit, or reorder stages.',
      'Stages determine how matches are organized and how standings are calculated for each phase of the competition.',
    ],
    category: 'tournaments',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['tournaments-groups', 'gs-first-tournament'],
  },
  {
    id:       'tournaments-groups',
    title:    'Setting Up Groups',
    summary:  'Create groups within a stage and assign teams.',
    body: [
      'Inside a stage, create groups (e.g., Group A, Group B). Each group holds a set of teams that play against each other.',
      'To add teams to a group, use the "Assign Teams" page. You can select from teams already registered in your organization.',
      'Once teams are assigned, you can schedule matches between them. Standings are calculated automatically from match results.',
    ],
    category: 'tournaments',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['tournaments-stages', 'teams-add'],
  },

  // ── Teams ────────────────────────────────────────────────
  {
    id:       'teams-add',
    title:    'Adding Teams',
    summary:  'Register teams in your organization.',
    body: [
      'Navigate to Teams from the admin dashboard and click "New Team". Enter the team name and optionally upload a logo.',
      'Teams are shared across your organization — once created, a team can be assigned to any tournament group.',
      'On the Basic plan, you can add up to the team limit. Upgrade to Pro for unlimited teams.',
    ],
    category: 'teams',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['teams-players', 'billing-plans'],
  },
  {
    id:       'teams-players',
    title:    'Managing Players',
    summary:  'Add players to teams and track their stats.',
    body: [
      'From the dashboard, click "Add Player" to create a new player and assign them to a team.',
      'Player stats (goals, assists, cards) are tracked per match and aggregated in the Player Stats view.',
      'Players appear on the public team detail page, giving your visitors full squad information.',
    ],
    category: 'teams',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['teams-add', 'matches-live'],
  },

  // ── Matches ──────────────────────────────────────────────
  {
    id:       'matches-schedule',
    title:    'Scheduling Matches',
    summary:  'Create and schedule tournament or friendly matches.',
    body: [
      'Tournament matches are scheduled within a group: navigate to a tournament stage, select a group, and click "New Match".',
      'For friendly matches (which do not affect standings), use "Friendly Match" from the dashboard.',
      'Set the date, time, home team, and away team. The match will appear on your public site as "Scheduled" until you start it.',
    ],
    category: 'matches',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['matches-live', 'matches-friendly'],
  },
  {
    id:       'matches-live',
    title:    'Live Match Updates',
    summary:  'Update scores and events in real time during a match.',
    body: [
      'When a match is live, update the score from the match edit page or the Operator View panel.',
      'You can record goals, cards, substitutions, and other events. Changes appear on the public site instantly.',
      'Match operators (Pro feature) can be given limited access to update scores on match day without full admin privileges.',
    ],
    category: 'matches',
    roles:    ['org_admin', 'power_admin', 'operator'],
    relatedIds: ['matches-schedule', 'operators-setup'],
  },
  {
    id:       'matches-friendly',
    title:    'Friendly Matches',
    summary:  'How friendly matches work and differ from tournament matches.',
    body: [
      'Friendly matches are standalone games that do not belong to any tournament and never affect standings.',
      'They appear in the matches list on your public site, clearly labeled as "Friendly".',
      'Create a friendly match from the dashboard using the "Friendly Match" shortcut.',
    ],
    category: 'matches',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['matches-schedule', 'matches-live'],
  },

  // ── News ─────────────────────────────────────────────────
  {
    id:          'news-publish',
    title:       'Publishing News Articles',
    summary:     'Create and publish news posts with rich content.',
    body: [
      'Navigate to "News & Articles" from the dashboard to create a new post.',
      'The rich text editor supports headings, bold, italic, links, images, and more. Add a featured image for the article card.',
      'Published articles appear on your public news page. You can edit or unpublish articles at any time.',
    ],
    category:    'news',
    roles:       ['org_admin', 'power_admin'],
    relatedIds:  ['media-upload'],
    requiresPro: true,
  },

  // ── Media ────────────────────────────────────────────────
  {
    id:          'media-upload',
    title:       'Using the Media Library',
    summary:     'Upload and manage images and videos.',
    body: [
      'The Media Library is your central hub for all images and videos used across your site.',
      'Upload images by dragging and dropping or using the file picker. Supported formats include JPG, PNG, and WebP.',
      'Media can be inserted into news articles, used as team logos, or set as tournament cover images.',
    ],
    category:    'media',
    roles:       ['org_admin', 'power_admin'],
    relatedIds:  ['news-publish'],
    requiresPro: true,
  },

  // ── Settings ─────────────────────────────────────────────
  {
    id:       'settings-branding',
    title:    'Site Branding & Theme',
    summary:  'Customize your site name, logo, and visual theme.',
    body: [
      'Go to Settings from the admin dashboard to configure your site identity — name, logo, and description.',
      'Choose a theme to change the look of your public site. Themes control colors, typography, and overall visual style.',
      'Your site name and logo appear in the public navigation bar, browser tab, and social media previews.',
    ],
    category: 'settings',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['settings-seo'],
  },
  {
    id:       'settings-seo',
    title:    'SEO Settings',
    summary:  'Optimize your site for search engines.',
    body: [
      'SEO settings let you control how your site appears in search engine results.',
      'Set a custom site title and description. These are used for the homepage meta tags and social sharing previews.',
      'Each page also generates its own metadata automatically based on its content (tournament names, team names, etc.).',
    ],
    category: 'settings',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['settings-branding'],
  },

  // ── Billing ──────────────────────────────────────────────
  {
    id:       'billing-plans',
    title:    'Plans & Pricing',
    summary:  'Understand the Basic and Pro plans.',
    body: [
      'The Basic plan includes a free trial with core features: tournaments, live scores, standings, and a limited number of teams.',
      'The Pro plan unlocks unlimited teams, news publishing, media library, match operators, and advanced branding.',
      'You can upgrade anytime from Settings. Billing is handled securely through Stripe with weekly, monthly, or yearly options.',
    ],
    category: 'billing',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['billing-trial'],
  },
  {
    id:       'billing-trial',
    title:    'Free Trial',
    summary:  'How the free trial works and what happens when it ends.',
    body: [
      'Every new organization starts with a free trial that gives full access to all features.',
      'When your trial expires, your site remains accessible but admin features are limited until you choose a plan.',
      'You can upgrade to Pro at any time during or after the trial from the Settings page.',
    ],
    category: 'billing',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['billing-plans'],
  },

  // ── Operators ────────────────────────────────────────────
  {
    id:          'operators-setup',
    title:       'Setting Up Match Operators',
    summary:     'Give limited access to people who update live scores.',
    body: [
      'Operators can update match scores and events but cannot access other admin functions.',
      'Add operators from the "Match Operators" section in the dashboard. Each operator signs in with their own email.',
      'Operators use the dedicated Operator View — a streamlined panel designed for fast score updates on match day.',
    ],
    category:    'operators',
    roles:       ['org_admin', 'power_admin'],
    relatedIds:  ['matches-live'],
    requiresPro: true,
  },

  // ── Public Site ──────────────────────────────────────────
  {
    id:       'public-overview',
    title:    'Your Public Site',
    summary:  'How the public-facing site works for your visitors.',
    body: [
      'Your public site is accessible via your organization subdomain. It updates in real time as you manage content in the admin panel.',
      'Visitors can browse matches, standings, teams, tournaments, and news without needing to sign in.',
      'The site is mobile-responsive and optimized for search engines, helping you reach a wider audience.',
    ],
    category: 'public-site',
    roles:    ['org_admin', 'power_admin'],
    relatedIds: ['settings-branding', 'settings-seo'],
  },
]

// ── Contextual help tips (short, inline) ───────────────────
export interface ContextualTip {
  id:      string
  context: string
  tip:     string
}

export const CONTEXTUAL_TIPS: ContextualTip[] = [
  { id: 'tip-tournament-new',    context: 'admin/tournaments/new',                tip: 'Choose a clear, descriptive name. You can add stages and groups after creation.' },
  { id: 'tip-team-new',          context: 'admin/teams/new',                      tip: 'Team logos look best as square images (at least 200x200 pixels).' },
  { id: 'tip-match-edit',        context: 'admin/matches/edit',                   tip: 'Updating the score here will reflect on the public site instantly.' },
  { id: 'tip-friendly-new',      context: 'admin/matches/friendly/new',           tip: 'Friendly matches never affect tournament standings.' },
  { id: 'tip-news-new',          context: 'admin/news/new',                       tip: 'Add a featured image to make your article stand out in the news feed.' },
  { id: 'tip-settings',          context: 'admin/settings',                       tip: 'Changes to site name and theme are applied to your public site immediately.' },
  { id: 'tip-operators',         context: 'admin/operators',                      tip: 'Operators can only update live match scores — they cannot access other admin features.' },
  { id: 'tip-media',             context: 'admin/media',                          tip: 'Drag and drop images to upload. Supported formats: JPG, PNG, WebP.' },
  { id: 'tip-assign-teams',      context: 'admin/tournaments/assign-teams',       tip: 'Select teams to include in this group. They must be created first under Teams.' },
  { id: 'tip-formation',         context: 'admin/matches/formation-editor',       tip: 'Drag players to position them on the pitch. Choose a formation preset to start.' },
  { id: 'tip-sponsors',          context: 'admin/sponsors',                       tip: 'Sponsor logos appear in a rotating strip on your public site.' },
  { id: 'tip-player-stats',      context: 'admin/players/stats',                  tip: 'Stats are aggregated from match events. Update match details to correct stats.' },
  { id: 'tip-dashboard',         context: 'admin/dashboard',                      tip: 'This is your command center. Start here to manage all aspects of your sports site.' },
]

// ── Lookup helpers ─────────────────────────────────────────
export function getArticle(id: string): HelpArticle | undefined {
  return HELP_ARTICLES.find(a => a.id === id)
}

export function getArticlesByCategory(category: HelpCategory): HelpArticle[] {
  return HELP_ARTICLES.filter(a => a.category === category)
}

export function getRelatedArticles(articleId: string): HelpArticle[] {
  const article = getArticle(articleId)
  if (!article?.relatedIds) return []
  return article.relatedIds.map(getArticle).filter(Boolean) as HelpArticle[]
}

export function getTipForContext(pathname: string): ContextualTip | undefined {
  return CONTEXTUAL_TIPS.find(t => pathname.includes(t.context))
}

export function searchArticles(query: string): HelpArticle[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return HELP_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    a.body.some(p => p.toLowerCase().includes(q))
  )
}

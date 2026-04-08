# KoluSports — Brand Guidelines

> Internal reference document. Not served as a public page.
> Last updated: April 7, 2026

---

## 1. Brand Identity

**Name:** KoluSports (one word, capital K and S)
**Tagline:** The all-in-one sports platform
**Positioning:** A professional, accessible platform for sports organizers — from community tournaments to regional federations.

---

## 2. Logo

### Primary Mark
- The "K" lettermark inside a rounded square (`border-radius: 6px`)
- White "K" on brand blue (`#2563eb`) background
- Used in the nav bar and footer when no custom org logo is uploaded

### Usage Rules
- Minimum clear space: equal to the height of the "K" on all sides
- Do not stretch, rotate, or recolor the mark
- On dark backgrounds, use white text next to the mark
- On light backgrounds, use navy (`#0f172a`) text next to the mark

---

## 3. Color Palette

### Platform / Marketing (Light Theme)

| Role            | Name       | Hex       | Usage                                     |
|-----------------|------------|-----------|-------------------------------------------|
| Primary         | Blue       | `#2563eb` | CTAs, links, accent badges, brand mark    |
| Primary Dark    | Blue Dark  | `#1d4ed8` | Hover states on primary buttons           |
| Primary BG      | Blue BG    | `#eff6ff` | Tag/badge backgrounds, subtle highlights  |
| Primary Border  | Blue Border| `#bfdbfe` | Tag/badge borders                         |
| Text Primary    | Navy       | `#0f172a` | Headings, body text                       |
| Text Secondary  | Slate      | `#334155` | Body paragraphs, descriptions             |
| Text Muted      | Muted      | `#64748b` | Captions, metadata, secondary labels      |
| Text Dim        | Light Muted| `#94a3b8` | Placeholders, disabled states             |
| Background      | White      | `#ffffff` | Page background                           |
| Surface         | BG Light   | `#f8fafc` | Cards, elevated surfaces                  |
| Surface Alt     | BG Slate   | `#f1f5f9` | Footer, alternate section backgrounds     |
| Border          | Border     | `#e2e8f0` | Card borders, dividers                    |
| Border Medium   | Border Med | `#cbd5e1` | Stronger dividers, table borders          |
| Success         | Green      | `#059669` | Success states, checkmarks                |

### Status Colors (Shared Across Themes)

| Status      | Hex       | Usage                        |
|-------------|-----------|------------------------------|
| Live        | `#ef4444` | Live match indicators        |
| Halftime    | `#a855f7` | Halftime status badges       |
| Scheduled   | `#60a5fa` | Upcoming match labels        |
| Completed   | `#6b7280` | Finished match labels        |
| Warning     | `#f59e0b` | Warnings, friendly matches   |
| Success     | `#22c55e` | Positive states              |

### Org Themes (Dark Variants)

| Theme            | Accent    | Background | Card       |
|------------------|-----------|------------|------------|
| UEFA Dark        | `#2563eb` | `#070710`  | `#13132a`  |
| Forest Green/Gold| `#16a34a` | `#060c08`  | `#111a14`  |
| Midnight Slate   | `#7c3aed` | `#0c0c0f`  | `#1a1a1f`  |
| Blue Light       | `#2563eb` | `#eef4fb`  | `#ffffff`  |

---

## 4. Typography

### Font Family
- **Primary:** Inter (Google Fonts)
- **Fallbacks:** 'Segoe UI', system-ui, -apple-system, sans-serif
- **Weights used:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)

### Type Scale (Fluid / Responsive)

| Token            | Min        | Max        | Usage                     |
|------------------|------------|------------|---------------------------|
| `--text-display` | 1.8rem     | 2.8rem     | Hero titles               |
| `--text-heading` | 1.25rem    | 1.8rem     | Page / section headings   |
| `--text-subheading` | 1rem    | 1.25rem    | Card titles               |
| `--text-body`    | 0.875rem   | 1rem       | Body text                 |
| `--text-small`   | 0.72rem    | 0.82rem    | Labels, captions          |
| `--text-xs`      | 0.65rem    | 0.75rem    | Badges, meta              |

### Heading Style
- Font weight: 800
- Letter spacing: -0.03em (display), -0.01em (body headings)
- Line height: 1.15 (headings), 1.6 (body)

---

## 5. Spacing & Layout

- **Max content width:** 1200px (org pages), 1120px (platform/marketing)
- **Content padding:** 1.25rem (default), 1rem (< 480px), 0.75rem (< 380px)
- **Spacing scale:** 0.25rem increments (sp-1 through sp-16)
- **Border radius:** 4px (sm), 8px (md), 12px (lg), 16px (xl), 9999px (pill)

---

## 6. Shadows

| Level   | Value                                                          | Usage               |
|---------|----------------------------------------------------------------|----------------------|
| Small   | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`     | Cards, dropdowns     |
| Medium  | `0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)`    | Elevated cards       |
| Large   | `0 12px 32px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.04)`   | Modals, hero mockups |
| Accent  | `0 0 20px rgba(37,99,235,0.20)`                               | Featured elements    |

---

## 7. Tone of Voice

### Principles
1. **Professional** — We sound competent and trustworthy. No slang, no hype.
2. **Easy to understand** — Short sentences. Plain language. No jargon unless the audience expects it (e.g., "group stage" is fine for sports organizers).
3. **Confident, not boastful** — State what the product does clearly. Let features speak for themselves.
4. **Supportive** — Encourage the user. Assume they're capable but may be new to running a website.

### Do
- Use active voice: "Update scores in real time" (not "Scores can be updated in real time")
- Be direct: "Start your free trial" (not "Why not try starting a free trial today?")
- Use second person: "your league," "your audience," "your site"
- Keep paragraphs short (2–3 sentences max in marketing copy)

### Don't
- Use exclamation marks excessively
- Use filler words: "very," "really," "just," "actually"
- Use corporate buzzwords: "synergy," "leverage," "disrupt," "best-in-class"
- Make promises about uptime or performance that can't be guaranteed
- Use emojis in legal, documentation, or error messages

### Examples

**Good:** "Launch a live-updated sports site for your league, tournament, or club."
**Bad:** "We are excited to offer you the best-in-class solution that will revolutionize how you manage your sports organization!!!"

**Good:** "No technical skills required. Everything is point-and-click."
**Bad:** "Even non-technical users can easily leverage our intuitive platform."

---

## 8. Imagery & Media

- **Style:** Clean, minimal mockups. No stock photos of generic athletes.
- **Product screenshots:** Use device mockups (browser frame, phone frame) as already established in the landing page.
- **Placeholder convention:** Gray background with centered icon + label (see PlatformLanding.tsx demo section).
- **Image format:** WebP preferred for production. PNG acceptable for logos and icons.
- **Aspect ratios:** 16:9 for cover images, 1:1 for team/player avatars.

---

## 9. Button & CTA Styles

| Type       | Background   | Text Color | Border Radius | Usage                       |
|------------|-------------|------------|---------------|-----------------------------|
| Primary    | `#2563eb`   | `#ffffff`  | 9999px (pill) | Main CTAs (Sign up, Start)  |
| Secondary  | transparent | `#2563eb`  | 9999px (pill) | Secondary actions (See Plans)|
| Outline    | transparent | `#334155`  | 9999px (pill) | Tertiary actions (Free tier) |

- Hover: darken background by one step (e.g., `#1d4ed8` for primary)
- Min touch target: 44px height (mobile accessibility)
- Font weight: 600

---

## 10. File Naming Conventions

- Components: PascalCase (`MatchCard.tsx`, `PublicFooter.tsx`)
- Styles: PascalCase SCSS modules matching component (`MatchCard.module.scss`)
- Routes: kebab-case directories (`/acceptable-use/page.tsx`)
- Assets: kebab-case (`admin-dashboard-preview.webp`)

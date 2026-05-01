# UX Improvement Recommendations

> **STATUS: NOT IMPLEMENTED — Awaiting approval**
>
> These are documented observations and suggestions. None of these changes
> have been applied to the codebase. Each requires explicit approval before
> implementation.

---

## 1. Admin Dashboard — Missing Visual Hierarchy for Pro Features

**Problem:** Pro-only features (News, Media, Operators) show a small "PRO" text badge inline, but it's easy to miss. Users may click through, hit a paywall, and feel frustrated.

**Why it matters:** Reduces confusion during trial and increases upgrade conversions by making the value proposition visible upfront.

**Suggested fix:** Add a subtle background tint or dashed border to Pro-only cards so they're visually distinct at a glance. Include a one-line value hint (e.g., "Publish articles to engage your audience").

**Impact:** Medium

---

## 2. AdminShell Navigation — No Active State for Current Section

**Problem:** The admin top nav shows "Sponsors" and "Settings" links but no active indicator for the current major section (Tournaments, Teams, etc.). Users lose context about where they are.

**Why it matters:** Wayfinding is critical in admin panels with deep nesting (tournament → stage → group → match). Without breadcrumbs or nav highlights, users get lost.

**Suggested fix:** Add a secondary nav row or breadcrumb trail below the admin bar showing the current path (e.g., "Tournaments / Summer League / Group Stage / Group A").

**Impact:** High

---

## 3. Empty States — Inconsistent and Missing Across Admin Pages

**Problem:** Some admin pages show no feedback when data is empty. For example, an empty tournament list or empty group just shows a blank white area.

**Why it matters:** Empty states are prime onboarding real estate. They should guide users toward the next action rather than leaving them confused.

**Suggested fix:** Add consistent empty states across all admin list pages with a clear message and a call-to-action link (e.g., "No teams yet. Add your first team.").

**Impact:** High

---

## 4. Mobile Admin Experience — Inline Styles Limit Responsiveness

**Problem:** The AdminShell nav uses extensive inline styles, which makes responsive behavior hard to control. On small screens, the nav items wrap unpredictably.

**Why it matters:** Admins often update scores from mobile devices on match day. A poor mobile admin experience directly impacts the core use case.

**Suggested fix:** Migrate AdminShell to SCSS module styling with explicit responsive breakpoints. Consider a collapsible sidebar or bottom nav for mobile admin.

**Impact:** High

---

## 5. Form Validation — No Inline Error Messages

**Problem:** Admin forms (create team, create tournament, create match) rely on browser-native validation or silent failures. There's no inline error feedback.

**Why it matters:** Users don't know what went wrong when a form submission fails. This creates frustration and support requests.

**Suggested fix:** Add inline validation messages below form fields (e.g., "Team name is required", "Please select a home team"). Show validation on blur, not just on submit.

**Impact:** Medium

---

## 6. Match Status Flow — No Confirmation for Destructive Actions

**Problem:** Changing a match status (e.g., from "Live" to "Completed") has no confirmation step. Accidental status changes can't be easily undone.

**Why it matters:** Match completion triggers standings recalculation. An accidental completion during a live match could confuse public viewers.

**Suggested fix:** Add a text-based confirmation prompt before status transitions (e.g., "Complete this match? This will finalize the score and update standings.").

**Impact:** Medium

---

## 7. Settings Page — No Save Confirmation Feedback

**Problem:** After saving settings, there's no clear visual confirmation that changes were saved successfully.

**Why it matters:** Users may re-submit or leave the page thinking their changes were lost, especially on slow connections.

**Suggested fix:** Show a toast notification or inline success message after settings are saved (e.g., "Settings saved successfully").

**Impact:** Low

---

## 8. Public Site — No "Back to Top" on Long Pages

**Problem:** Tournament standings, fixture lists, and news feeds can be long. There's no way to quickly return to the top of the page.

**Why it matters:** Mobile users scrolling through match results or standings have to manually scroll back up to access navigation.

**Suggested fix:** Add a text-based "Back to top" link that appears after scrolling past a threshold.

**Impact:** Low

---

## 9. Tournament Setup Workflow — No Progress Indicator

**Problem:** Setting up a tournament involves multiple sequential steps (create tournament → add stages → create groups → assign teams → schedule matches). There's no visual guide for this flow.

**Why it matters:** New admins may not know what step comes next, leading to incomplete tournament setups.

**Suggested fix:** Add a simple text-based progress indicator on tournament pages showing completion status (e.g., "Step 2 of 5: Add stages").

**Impact:** Medium

---

## 10. Public Navigation — No Search Functionality

**Problem:** The public site has no search feature. Visitors can't search for a specific team, match, or player.

**Why it matters:** As the site grows with more tournaments, teams, and articles, discoverability becomes critical for visitor engagement.

**Suggested fix:** Add a text-based search trigger in the public nav that opens a search overlay or navigates to a search results page.

**Impact:** Medium

---

## Summary

| # | Issue | Impact | Complexity |
|---|-------|--------|------------|
| 1 | Pro feature visibility | Medium | Low |
| 2 | Admin nav active states / breadcrumbs | High | Medium |
| 3 | Consistent empty states | High | Low |
| 4 | Mobile admin responsiveness | High | High |
| 5 | Inline form validation | Medium | Medium |
| 6 | Match status confirmation | Medium | Low |
| 7 | Settings save feedback | Low | Low |
| 8 | Back to top link | Low | Low |
| 9 | Tournament setup progress | Medium | Medium |
| 10 | Public site search | Medium | High |

### Recommended Priority Order
1. #3 — Empty states (high impact, low effort)
2. #2 — Admin breadcrumbs (high impact, medium effort)
3. #6 — Match status confirmation (prevents data errors)
4. #1 — Pro feature visibility (improves conversions)
5. #5 — Form validation (reduces support burden)
6. #7 — Settings save feedback (quick win)
7. #9 — Tournament progress indicator
8. #8 — Back to top
9. #4 — Mobile admin (high effort, plan carefully)
10. #10 — Public search (high effort, plan carefully)

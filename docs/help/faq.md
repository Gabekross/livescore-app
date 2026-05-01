# Frequently Asked Questions

## General

### What is KoluSports?
KoluSports is a multi-organization football platform. Each organization gets its own customizable website with live scores, tournaments, standings, teams, and news — all managed through an admin dashboard.

### How do I access my admin dashboard?
Sign in at `/login` with your admin credentials. You'll be redirected to `/admin/dashboard`.

### Can I have multiple organizations?
The platform supports multiple organizations. Each operates independently with its own subdomain, teams, tournaments, and content.

---

## Tournaments & Matches

### How are standings calculated?
Standings are calculated automatically from completed tournament match results:
- Win = 3 points, Draw = 1, Loss = 0
- Sorted by points, then goal difference, then goals scored
- Only tournament matches count — friendly matches are excluded

### Do friendly matches affect standings?
No. Friendly matches never affect tournament standings. They appear in match lists but are clearly labeled as "Friendly."

### Can I reuse teams across tournaments?
Yes. Teams are organization-scoped. Once created, a team can be assigned to any tournament group.

### How do I update scores during a live match?
Open the match from the admin panel or use the Operator View. Change the status to "Live" and update the score. Changes appear on the public site instantly.

---

## Plans & Billing

### What's included in the free trial?
The free trial gives you access to core features: tournaments, live scores, standings, and a limited number of teams. The trial lasts for a set number of days.

### What happens when my trial expires?
Your public site remains visible to visitors, but admin features become restricted. Upgrade to Pro from Settings to restore full access.

### How do I upgrade to Pro?
Go to **Settings** in the admin dashboard and find the Billing section. Choose your preferred billing interval (weekly, monthly, or yearly) and complete the checkout.

### Can I cancel my subscription?
Yes. Manage your subscription from Settings. You can cancel, change plans, or update payment methods through the Stripe billing portal.

---

## Teams & Players

### How many teams can I have?
The Basic plan has a team limit. The Pro plan allows unlimited teams.

### How do player stats work?
Player stats (goals, assists, cards) are aggregated from match events. When you record a goal or card in a match, it's automatically attributed to the player and reflected in their stats.

---

## Site & Branding

### How do I change my site theme?
Go to **Settings** in the admin dashboard and select a theme. The change applies immediately to your public site.

### Where does my site live?
Your organization gets a subdomain (e.g., `yourleague.kolusports.com`). All public pages are accessible there.

### Is my site mobile-friendly?
Yes. The entire platform is responsive and works well on phones, tablets, and desktops.

---

## Technical

### What browsers are supported?
KoluSports works in all modern browsers: Chrome, Firefox, Safari, and Edge.

### Is my data secure?
Yes. All data is stored securely in Supabase with row-level security policies. Authentication is handled through Supabase Auth, and billing through Stripe.

### Can I export my data?
Player stats and match data can be exported from relevant admin pages.

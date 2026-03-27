# ⚽ JCL26 LiveScore Platform

A modern, multi-tenant football platform built with **Next.js, Supabase, and SCSS**, designed to support multiple organizations with real-time match data, media content, and admin-controlled management.

---

##  Project Overview

JCL26 is a **production-ready sports platform** that allows different football organizations to:

* Manage teams, players, and tournaments
* Publish match results and lineups
* Share media and news content
* Operate through role-based admin access

The platform is designed to be **scalable and reusable**, enabling multiple organizations to launch their own football websites from a shared system.

---

##  Tech Stack

* **Frontend:** Next.js (App Router), TypeScript, SCSS
* **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
* **Hosting:** Vercel
* **Database Management:** Supabase CLI (migrations + RLS)

---

##  Authentication & Roles

The system uses Supabase Auth with a custom role layer:

| Role          | Description                           |
| ------------- | ------------------------------------- |
| `power_admin` | Can manage all organizations          |
| `org_admin`   | Restricted to a specific organization |

Admin users are stored in:

```text
public.admin_profiles
```

---

##  Database Architecture

The database is fully managed through **Supabase migrations**.

Key entities include:

* `organizations`
* `site_settings`
* `admin_profiles`
* `teams`
* `players`
* `tournaments`
* `matches`
* `match_lineups`
* `posts`
* `media`

All access is secured using **Row-Level Security (RLS)** policies.

---

##  Local Development Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd livescore-app
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ORGANIZATION_SLUG=jcl26
```

---

### 4. Initialize Supabase

```bash
npx supabase init
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

---

### 5. Apply database migrations

```bash
npx supabase db push
```

---

### 6. Seed initial data

Run in Supabase SQL Editor:

```sql
-- contents of supabase/seed.sql
```

---

### 7. Create an admin user

1. Go to **Supabase → Authentication → Users**
2. Create a user (email + password)
3. Copy the user UUID

Then run:

```sql
insert into public.admin_profiles (id, organization_id, role)
values ('YOUR-USER-UUID', null, 'power_admin');
```

---

### 8. Run the app

```bash
npm run dev
```

---

##  Migrations Workflow

All schema changes must go through migrations:

```bash
npx supabase migration new your_migration_name
```

Then apply:

```bash
npx supabase db push
```

---

##  Important Notes

* Do **not** commit `.env.local`
* Always update schema via migrations (never directly in production)
* Ensure RLS policies are tested before deployment

---

##  Project Structure

```text
livescore-app/
├── app/
├── components/
├── lib/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── styles/
└── .env.local (ignored)
```

---

##  Deployment

The app is deployed using **Vercel**:

1. Connect repo to Vercel
2. Add environment variables
3. Deploy

Ensure Supabase project is properly configured before deploying.

---

##  Roadmap

* [ ] Multi-organization admin dashboard
* [ ] Media-rich news/blog system
* [ ] Real-time match updates
* [ ] Player statistics tracking
* [ ] Public-facing team pages

---

##  Contributing

This project is structured for scalability and reuse. Contributions should:

* Follow existing architecture
* Use migrations for DB changes
* Maintain RLS security patterns

---

## 📄 License

Private / Internal Use 

---

## 👨‍💻 Author

Built by Gabekross — designed for scalable, production-ready sports platforms.

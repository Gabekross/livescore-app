# Supabase Setup Guide

## Migrations

Run all migrations against your fresh Supabase project using the Supabase CLI:

```bash
supabase db push
```

Or run them manually in order in the Supabase SQL editor:

```
20260326000001_create_organizations.sql
20260326000002_create_site_settings.sql
20260326000003_create_admin_profiles.sql
20260326000004_create_teams.sql
20260326000005_create_players.sql
20260326000006_create_tournaments.sql
20260326000007_create_tournament_stages.sql
20260326000008_create_groups.sql
20260326000009_create_group_teams.sql
20260326000010_create_matches.sql
20260326000011_create_match_lineups.sql
20260326000012_create_posts.sql
20260326000013_create_media.sql
20260326000014_create_indexes.sql
20260326000015_create_rls_policies.sql
20260326000016_create_get_group_standings_fn.sql
```

## Seed data

After migrations, run the seed file in the Supabase SQL editor:

```
seed.sql
```

This creates:
- The JCL26 organization (UUID: `00000000-0000-0000-0000-000000000001`)
- JCL26 site settings with `theme-uefa-dark` as the default theme

## Environment variables

Add these to `livescore-app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_ORGANIZATION_SLUG=jcl26
```

The anon key is safe to expose publicly — RLS policies enforce access control.

## Creating the first power admin (MANUAL STEP REQUIRED)

Supabase Auth users cannot be seeded via SQL. Follow these steps:

### Step 1: Create the Auth user

In the Supabase Dashboard:
- Go to **Authentication → Users → Add user**
- Enter the admin's email and a strong password
- Copy the generated **UUID**

### Step 2: Insert the admin profile

In the Supabase SQL editor:

```sql
insert into public.admin_profiles (id, organization_id, role)
values ('<AUTH_USER_UUID>', null, 'power_admin');
```

Replace `<AUTH_USER_UUID>` with the UUID from Step 1.

### Creating a JCL26 org admin

Repeat Step 1 to create a second Auth user, then:

```sql
insert into public.admin_profiles (id, organization_id, role)
values (
  '<AUTH_USER_UUID>',
  '00000000-0000-0000-0000-000000000001',
  'org_admin'
);
```

## Storage buckets (MANUAL STEP REQUIRED)

Supabase Storage buckets must be created in the Dashboard → Storage → New bucket:

| Bucket       | Public | Max size | MIME types                                    |
|-------------|--------|----------|-----------------------------------------------|
| `team-logos` | Yes    | 2 MB     | image/png, image/jpeg, image/webp, image/svg+xml |
| `media`      | Yes    | 50 MB    | image/*, video/*                              |

After creating the buckets, run these storage RLS policies in the SQL editor:

```sql
create policy "Public read team-logos"
  on storage.objects for select
  using (bucket_id = 'team-logos');

create policy "Authenticated upload team-logos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'team-logos');

create policy "Public read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Authenticated upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');
```

## Match status values

The platform uses these status values (note: renamed from the old codebase):

| New value   | Old value  | Meaning             |
|-------------|-----------|---------------------|
| `scheduled` | `scheduled`| Not yet started     |
| `live`      | `ongoing`  | Match in progress   |
| `halftime`  | `halftime` | Half-time break     |
| `completed` | `finished` | Match finished      |

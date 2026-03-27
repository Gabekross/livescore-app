-- ─────────────────────────────────────────────────────────────────────────────
-- Seed file: supabase/seed.sql
-- Run against a fresh Supabase project after all migrations have been applied.
--
-- This file seeds the JCL26 organization and its site settings.
-- It does NOT seed admin users (those must be created via Supabase Auth — see below).
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Organization ─────────────────────────────────────────────────────────
--
-- We use a fixed UUID so that the NEXT_PUBLIC_ORGANIZATION_ID env var can be set
-- to a known value without a DB lookup at startup.

insert into public.organizations (id, name, slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'JCL26',
  'jcl26'
)
on conflict (slug) do nothing;


-- ─── 2. Site settings ────────────────────────────────────────────────────────

insert into public.site_settings (
  organization_id,
  site_name,
  site_tagline,
  active_theme,
  footer_text
)
values (
  '00000000-0000-0000-0000-000000000001',
  'JCL 2026',
  'Official League Platform',
  'theme-uefa-dark',
  '© JCL 2026. All rights reserved.'
)
on conflict (organization_id) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- ─── MANUAL STEP REQUIRED: Create the power admin user ───────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Supabase Auth users cannot be seeded purely via SQL because passwords are
-- hashed by the GoTrue service, not directly in the database.
--
-- STEP 1: Go to your Supabase project dashboard
--         → Authentication → Users → Add user
--         Enter the admin's email and a strong password.
--         Copy the generated user UUID.
--
-- STEP 2: Replace <AUTH_USER_UUID> below with the UUID from Step 1,
--         then run this INSERT in the Supabase SQL editor:
--
--   insert into public.admin_profiles (id, organization_id, role)
--   values ('<AUTH_USER_UUID>', null, 'power_admin');
--
--
-- ─── To create a JCL26 org admin ─────────────────────────────────────────────
--
-- STEP 1: Add user via Supabase Auth (same as above). Copy UUID.
--
-- STEP 2:
--   insert into public.admin_profiles (id, organization_id, role)
--   values (
--     '<AUTH_USER_UUID>',
--     '00000000-0000-0000-0000-000000000001',   -- JCL26 org id
--     'org_admin'
--   );
--
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- ─── Storage buckets (manual setup required) ─────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Supabase Storage buckets cannot be created via SQL migrations.
-- After running migrations and seeds, create the following buckets in the
-- Supabase Dashboard → Storage → New bucket:
--
--   Bucket name:  team-logos
--   Public:       YES
--   File size:    2MB max recommended
--   MIME types:   image/png, image/jpeg, image/webp, image/svg+xml
--
--   Bucket name:  media
--   Public:       YES
--   File size:    10MB max recommended for images; 50MB for video
--   MIME types:   image/*, video/*
--
-- Storage RLS policies (run in SQL editor after creating buckets):
--
--   create policy "Public read team-logos"
--     on storage.objects for select
--     using (bucket_id = 'team-logos');
--
--   create policy "Authenticated upload team-logos"
--     on storage.objects for insert to authenticated
--     with check (bucket_id = 'team-logos');
--
--   create policy "Public read media"
--     on storage.objects for select
--     using (bucket_id = 'media');
--
--   create policy "Authenticated upload media"
--     on storage.objects for insert to authenticated
--     with check (bucket_id = 'media');
--
-- ─────────────────────────────────────────────────────────────────────────────

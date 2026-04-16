-- Migration 023: Grant table-level permissions for the sponsors table.
--
-- Migration 022 created the sponsors table and its RLS policies, but
-- the base GRANT statements were never added (they live in migration 020
-- which ran before this table existed).
--
-- Without these GRANTs, Postgres denies access with "permission denied for
-- table sponsors" before RLS is even evaluated, even for authenticated admins.

grant select
  on public.sponsors
  to anon, authenticated;

grant insert, update, delete
  on public.sponsors
  to authenticated;

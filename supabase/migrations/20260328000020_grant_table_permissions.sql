-- Migration 020: Grant table-level permissions to anon and authenticated roles
--
-- The previous migrations enabled RLS and created policies but never granted
-- the base table privileges. Without these GRANTs, Supabase's anon and
-- authenticated roles get "permission denied" before RLS is even evaluated.

-- ─── Public-readable tables: anon + authenticated get SELECT ────────────────

grant select on public.organizations       to anon, authenticated;
grant select on public.site_settings       to anon, authenticated;
grant select on public.teams               to anon, authenticated;
grant select on public.players             to anon, authenticated;
grant select on public.tournaments         to anon, authenticated;
grant select on public.tournament_stages   to anon, authenticated;
grant select on public.groups              to anon, authenticated;
grant select on public.group_teams         to anon, authenticated;
grant select on public.matches             to anon, authenticated;
grant select on public.match_lineups       to anon, authenticated;
grant select on public.posts               to anon, authenticated;
grant select on public.media               to anon, authenticated;

-- ─── Admin-writable tables: authenticated gets INSERT/UPDATE/DELETE ─────────
-- (RLS policies control which rows each user can actually touch)

grant insert, update, delete on public.organizations       to authenticated;
grant insert, update, delete on public.site_settings       to authenticated;
grant insert, update, delete on public.admin_profiles      to authenticated;
grant insert, update, delete on public.teams               to authenticated;
grant insert, update, delete on public.players             to authenticated;
grant insert, update, delete on public.tournaments         to authenticated;
grant insert, update, delete on public.tournament_stages   to authenticated;
grant insert, update, delete on public.groups              to authenticated;
grant insert, update, delete on public.group_teams         to authenticated;
grant insert, update, delete on public.matches             to authenticated;
grant insert, update, delete on public.match_lineups       to authenticated;
grant insert, update, delete on public.posts               to authenticated;
grant insert, update, delete on public.media               to authenticated;

-- ─── admin_profiles: authenticated needs SELECT for own-row reads ──────────

grant select on public.admin_profiles to authenticated;

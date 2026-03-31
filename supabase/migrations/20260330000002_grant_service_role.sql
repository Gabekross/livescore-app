-- Grant service_role full access to all tables.
-- The service_role bypasses RLS but still needs table-level GRANTs.
-- Previous migrations only granted to anon/authenticated, missing service_role.

grant all on public.organizations       to service_role;
grant all on public.site_settings       to service_role;
grant all on public.admin_profiles      to service_role;
grant all on public.teams               to service_role;
grant all on public.players             to service_role;
grant all on public.tournaments         to service_role;
grant all on public.tournament_stages   to service_role;
grant all on public.groups              to service_role;
grant all on public.group_teams         to service_role;
grant all on public.matches             to service_role;
grant all on public.match_lineups       to service_role;
grant all on public.posts               to service_role;
grant all on public.media               to service_role;

-- Also ensure future tables in public schema get service_role access
alter default privileges in schema public grant all on tables to service_role;

-- Migration 021: match_operator role
--
-- Adds a restricted game-day operator role.
--
-- match_operator:
--   - Belongs to exactly one organization (organization_id IS NOT NULL)
--   - Can update match status/scores/events for their organization's matches only
--   - Cannot access broader admin functions (teams, tournaments, settings, media, news)
--   - Created/managed by org_admin or power_admin
--   - Has SELECT on matches, teams (already public via anon policy)
--   - Has UPDATE on matches where organization_id matches their assigned org
--
-- Role constraint: same as org_admin (must have organization_id)

-- ── 1. Extend role check to include match_operator ───────────────────────────

alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('power_admin', 'org_admin', 'match_operator'));

-- ── 2. Extend role/org consistency constraint ────────────────────────────────

-- match_operator must also have organization_id IS NOT NULL
alter table public.admin_profiles
  drop constraint if exists chk_role_org_consistency;

alter table public.admin_profiles
  add constraint chk_role_org_consistency check (
    (role = 'power_admin'    and organization_id is null) or
    (role = 'org_admin'      and organization_id is not null) or
    (role = 'match_operator' and organization_id is not null)
  );

-- ── 3. RLS: allow match_operator to UPDATE matches for their org ─────────────

-- Helper function: returns true if calling user can operate matches for org_id
-- (power_admin OR org_admin OR match_operator for that org)
create or replace function public.can_operate_matches(org_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.admin_profiles
    where id = auth.uid()
      and (
        role = 'power_admin'
        or (role in ('org_admin', 'match_operator') and organization_id = org_id)
      )
  )
$$;

comment on function public.can_operate_matches is
  'Returns true if the calling user can update match data for the given organization.';

-- ── 4. Match UPDATE policy for match_operator ───────────────────────────────
-- The existing policy "admin can manage own org matches" covers power_admin and org_admin
-- via can_admin_org(). We add a separate UPDATE-only policy for match_operator.

create policy "match operator can update own org matches"
  on public.matches
  for update
  to authenticated
  using (public.can_operate_matches(organization_id))
  with check (public.can_operate_matches(organization_id));

-- match_operator can also INSERT match_lineups (goals, cards, subs)
create policy "match operator can insert match_lineups for own org"
  on public.match_lineups
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_lineups.match_id
        and public.can_operate_matches(m.organization_id)
    )
  );

create policy "match operator can update match_lineups for own org"
  on public.match_lineups
  for update
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_lineups.match_id
        and public.can_operate_matches(m.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_lineups.match_id
        and public.can_operate_matches(m.organization_id)
    )
  );

create policy "match operator can delete match_lineups for own org"
  on public.match_lineups
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_lineups.match_id
        and public.can_operate_matches(m.organization_id)
    )
  );

-- Migration 015: Row Level Security policies
--
-- Access model:
--   Public (anon)   → SELECT on all public content tables
--   power_admin     → full access to everything
--   org_admin       → full write access within their organization_id
--
-- Helper functions use SECURITY DEFINER so they can read admin_profiles
-- without infinite RLS recursion.

-- ─── Helper functions ──────────────────────────────────────────────────────

create or replace function public.is_power_admin()
returns boolean
language sql stable security definer
as $$
  select exists(
    select 1 from public.admin_profiles
    where id = auth.uid() and role = 'power_admin'
  )
$$;

create or replace function public.admin_org_id()
returns uuid
language sql stable security definer
as $$
  select organization_id from public.admin_profiles where id = auth.uid()
$$;

-- Returns true if the calling user is a power_admin OR an org_admin for org_id
create or replace function public.can_admin_org(org_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists(
    select 1 from public.admin_profiles
    where id = auth.uid()
      and (role = 'power_admin' or organization_id = org_id)
  )
$$;

-- ─── Enable RLS on all tables ─────────────────────────────────────────────

alter table public.organizations       enable row level security;
alter table public.site_settings       enable row level security;
alter table public.admin_profiles      enable row level security;
alter table public.teams               enable row level security;
alter table public.players             enable row level security;
alter table public.tournaments         enable row level security;
alter table public.tournament_stages   enable row level security;
alter table public.groups              enable row level security;
alter table public.group_teams         enable row level security;
alter table public.matches             enable row level security;
alter table public.match_lineups       enable row level security;
alter table public.posts               enable row level security;
alter table public.media               enable row level security;

-- ─── organizations ────────────────────────────────────────────────────────

create policy "public can read organizations"
  on public.organizations for select to anon, authenticated using (true);

create policy "power admin can manage organizations"
  on public.organizations for all to authenticated
  using (public.is_power_admin())
  with check (public.is_power_admin());

-- ─── site_settings ────────────────────────────────────────────────────────

create policy "public can read site_settings"
  on public.site_settings for select to anon, authenticated using (true);

create policy "admin can manage own org site_settings"
  on public.site_settings for all to authenticated
  using (public.can_admin_org(organization_id))
  with check (public.can_admin_org(organization_id));

-- ─── admin_profiles ───────────────────────────────────────────────────────

create policy "user can read own profile"
  on public.admin_profiles for select to authenticated
  using (id = auth.uid() or public.is_power_admin());

create policy "power admin can manage all profiles"
  on public.admin_profiles for all to authenticated
  using (public.is_power_admin())
  with check (public.is_power_admin());

-- ─── teams ────────────────────────────────────────────────────────────────

create policy "public can read teams"
  on public.teams for select to anon, authenticated using (true);

create policy "admin can manage own org teams"
  on public.teams for all to authenticated
  using (public.can_admin_org(organization_id))
  with check (public.can_admin_org(organization_id));

-- ─── players ──────────────────────────────────────────────────────────────

create policy "public can read players"
  on public.players for select to anon, authenticated using (true);

create policy "admin can manage players in own org"
  on public.players for all to authenticated
  using (
    exists(
      select 1 from public.teams t
      where t.id = players.team_id
        and public.can_admin_org(t.organization_id)
    )
  )
  with check (
    exists(
      select 1 from public.teams t
      where t.id = players.team_id
        and public.can_admin_org(t.organization_id)
    )
  );

-- ─── tournaments ──────────────────────────────────────────────────────────

create policy "public can read tournaments"
  on public.tournaments for select to anon, authenticated using (true);

create policy "admin can manage own org tournaments"
  on public.tournaments for all to authenticated
  using (public.can_admin_org(organization_id))
  with check (public.can_admin_org(organization_id));

-- ─── tournament_stages ────────────────────────────────────────────────────

create policy "public can read tournament_stages"
  on public.tournament_stages for select to anon, authenticated using (true);

create policy "admin can manage tournament_stages in own org"
  on public.tournament_stages for all to authenticated
  using (
    exists(
      select 1 from public.tournaments t
      where t.id = tournament_stages.tournament_id
        and public.can_admin_org(t.organization_id)
    )
  )
  with check (
    exists(
      select 1 from public.tournaments t
      where t.id = tournament_stages.tournament_id
        and public.can_admin_org(t.organization_id)
    )
  );

-- ─── groups ───────────────────────────────────────────────────────────────

create policy "public can read groups"
  on public.groups for select to anon, authenticated using (true);

create policy "admin can manage groups in own org"
  on public.groups for all to authenticated
  using (
    exists(
      select 1 from public.tournament_stages ts
      join public.tournaments t on t.id = ts.tournament_id
      where ts.id = groups.stage_id
        and public.can_admin_org(t.organization_id)
    )
  )
  with check (
    exists(
      select 1 from public.tournament_stages ts
      join public.tournaments t on t.id = ts.tournament_id
      where ts.id = groups.stage_id
        and public.can_admin_org(t.organization_id)
    )
  );

-- ─── group_teams ──────────────────────────────────────────────────────────

create policy "public can read group_teams"
  on public.group_teams for select to anon, authenticated using (true);

create policy "admin can manage group_teams in own org"
  on public.group_teams for all to authenticated
  using (
    exists(
      select 1 from public.groups g
      join public.tournament_stages ts on ts.id = g.stage_id
      join public.tournaments t        on t.id  = ts.tournament_id
      where g.id = group_teams.group_id
        and public.can_admin_org(t.organization_id)
    )
  )
  with check (
    exists(
      select 1 from public.groups g
      join public.tournament_stages ts on ts.id = g.stage_id
      join public.tournaments t        on t.id  = ts.tournament_id
      where g.id = group_teams.group_id
        and public.can_admin_org(t.organization_id)
    )
  );

-- ─── matches ──────────────────────────────────────────────────────────────

create policy "public can read matches"
  on public.matches for select to anon, authenticated using (true);

create policy "admin can manage own org matches"
  on public.matches for all to authenticated
  using (public.can_admin_org(organization_id))
  with check (public.can_admin_org(organization_id));

-- ─── match_lineups ────────────────────────────────────────────────────────

create policy "public can read match_lineups"
  on public.match_lineups for select to anon, authenticated using (true);

create policy "admin can manage match_lineups in own org"
  on public.match_lineups for all to authenticated
  using (
    exists(
      select 1 from public.matches m
      where m.id = match_lineups.match_id
        and public.can_admin_org(m.organization_id)
    )
  )
  with check (
    exists(
      select 1 from public.matches m
      where m.id = match_lineups.match_id
        and public.can_admin_org(m.organization_id)
    )
  );

-- ─── posts ────────────────────────────────────────────────────────────────

-- Anon users can only read published posts
create policy "public can read published posts"
  on public.posts for select to anon
  using (status = 'published');

-- Authenticated users (admins) can read all posts in their org
create policy "admin can read all posts in own org"
  on public.posts for select to authenticated
  using (public.can_admin_org(organization_id));

create policy "admin can insert own org posts"
  on public.posts
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_profiles ap
      where ap.id = auth.uid()
        and (
          ap.role = 'power_admin'
          or ap.organization_id = posts.organization_id
        )
    )
  );

create policy "admin can update own org posts"
  on public.posts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles ap
      where ap.id = auth.uid()
        and (
          ap.role = 'power_admin'
          or ap.organization_id = posts.organization_id
        )
    )
  )
  with check (
    exists (
      select 1
      from public.admin_profiles ap
      where ap.id = auth.uid()
        and (
          ap.role = 'power_admin'
          or ap.organization_id = posts.organization_id
        )
    )
  );

create policy "admin can delete own org posts"
  on public.posts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_profiles ap
      where ap.id = auth.uid()
        and (
          ap.role = 'power_admin'
          or ap.organization_id = posts.organization_id
        )
    )
  );

-- ─── media ────────────────────────────────────────────────────────────────

create policy "public can read media"
  on public.media for select to anon, authenticated using (true);

create policy "admin can manage own org media"
  on public.media for all to authenticated
  using (public.can_admin_org(organization_id))
  with check (public.can_admin_org(organization_id));

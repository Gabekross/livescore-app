-- Migration 034: per-match operator assignments
--
-- Match operators are org-scoped users, but their write access should be limited
-- to the specific matches assigned by an organization admin.

-- Keep org admins powerful, but do not let match_operator inherit full org admin
-- write access through the older organization-scoped helper.
create or replace function public.can_admin_org(org_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.admin_profiles
    where id = auth.uid()
      and (
        role = 'power_admin'
        or (role in ('org_admin', 'billing_exempt_admin') and organization_id = org_id)
      )
  )
$$;

create table if not exists public.match_operator_assignments (
  operator_id     uuid not null references public.admin_profiles(id) on delete cascade,
  match_id        uuid not null references public.matches(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_by     uuid references public.admin_profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  primary key (operator_id, match_id)
);

comment on table public.match_operator_assignments is
  'Specific matches assigned to match_operator users for score and stat updates.';

create index if not exists idx_match_operator_assignments_operator
  on public.match_operator_assignments(operator_id);

create index if not exists idx_match_operator_assignments_match
  on public.match_operator_assignments(match_id);

create index if not exists idx_match_operator_assignments_org
  on public.match_operator_assignments(organization_id);

create or replace function public.validate_match_operator_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  operator_org uuid;
  operator_role text;
  match_org uuid;
begin
  select role, organization_id
    into operator_role, operator_org
  from public.admin_profiles
  where id = new.operator_id;

  if operator_role is distinct from 'match_operator' or operator_org is null then
    raise exception 'operator_id must reference a match_operator profile';
  end if;

  select organization_id
    into match_org
  from public.matches
  where id = new.match_id;

  if match_org is null then
    raise exception 'match_id must reference an existing match';
  end if;

  if operator_org <> match_org then
    raise exception 'operator and match must belong to the same organization';
  end if;

  new.organization_id := match_org;
  return new;
end;
$$;

drop trigger if exists trg_validate_match_operator_assignment
  on public.match_operator_assignments;

create trigger trg_validate_match_operator_assignment
before insert or update on public.match_operator_assignments
for each row execute function public.validate_match_operator_assignment();

alter table public.match_operator_assignments enable row level security;

grant select, insert, update, delete on public.match_operator_assignments to authenticated;

drop policy if exists "operator assignments are visible to admins and assignees"
  on public.match_operator_assignments;
create policy "operator assignments are visible to admins and assignees"
  on public.match_operator_assignments
  for select
  to authenticated
  using (
    operator_id = auth.uid()
    or public.can_admin_org(organization_id)
  );

drop policy if exists "admins can manage operator assignments"
  on public.match_operator_assignments;
create policy "admins can manage operator assignments"
  on public.match_operator_assignments
  for all
  to authenticated
  using (public.can_admin_org(organization_id))
  with check (public.can_admin_org(organization_id));

create or replace function public.can_operate_match(p_match_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.matches m
    left join public.match_operator_assignments moa
      on moa.match_id = m.id
     and moa.operator_id = auth.uid()
    left join public.admin_profiles ap
      on ap.id = auth.uid()
    where m.id = p_match_id
      and (
        ap.role = 'power_admin'
        or (ap.role in ('org_admin', 'billing_exempt_admin') and ap.organization_id = m.organization_id)
        or (ap.role = 'match_operator' and moa.operator_id is not null)
      )
  )
$$;

comment on function public.can_operate_match(uuid) is
  'Returns true when the caller can update this specific match. Operators require an assignment.';

-- Replace the older org-wide match_operator policies with per-match checks.
drop policy if exists "match operator can update own org matches" on public.matches;
drop policy if exists "match operator can insert match_lineups for own org" on public.match_lineups;
drop policy if exists "match operator can update match_lineups for own org" on public.match_lineups;
drop policy if exists "match operator can delete match_lineups for own org" on public.match_lineups;

create policy "assigned operators can update assigned matches"
  on public.matches
  for update
  to authenticated
  using (public.can_operate_match(id))
  with check (public.can_operate_match(id));

create policy "assigned operators can insert assigned match_lineups"
  on public.match_lineups
  for insert
  to authenticated
  with check (public.can_operate_match(match_id));

create policy "assigned operators can update assigned match_lineups"
  on public.match_lineups
  for update
  to authenticated
  using (public.can_operate_match(match_id))
  with check (public.can_operate_match(match_id));

create policy "assigned operators can delete assigned match_lineups"
  on public.match_lineups
  for delete
  to authenticated
  using (public.can_operate_match(match_id));

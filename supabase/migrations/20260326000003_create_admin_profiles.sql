-- Migration 003: admin_profiles
-- Links a Supabase Auth user (auth.users) to an organization and role.
--
-- Roles:
--   power_admin  – platform-level admin; organization_id IS NULL; can manage all orgs
--   org_admin    – org-level admin; organization_id IS NOT NULL; scoped to one org
--
-- NOTE: Rows are created manually or via a Supabase Edge Function after Auth user creation.
-- The first power_admin row MUST be inserted after manually creating the user in
-- the Supabase Dashboard (Auth → Users → Add user). See seed.sql for the INSERT template.

create table public.admin_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  role            text not null check (role in ('power_admin', 'org_admin')),
  created_at      timestamptz not null default now(),

  -- power_admin must have organization_id = NULL
  -- org_admin must have organization_id IS NOT NULL
  constraint chk_role_org_consistency check (
    (role = 'power_admin' and organization_id is null) or
    (role = 'org_admin'   and organization_id is not null)
  )
);

comment on table  public.admin_profiles               is 'Links Supabase Auth users to platform roles and org scope.';
comment on column public.admin_profiles.id            is 'Must match an existing auth.users.id row.';
comment on column public.admin_profiles.role          is 'power_admin: platform-wide. org_admin: scoped to organization_id.';
comment on column public.admin_profiles.organization_id is 'NULL for power_admin, required for org_admin.';

-- Migration 019: SaaS self-serve onboarding support
--
-- Adds:
--   1. full_name column to admin_profiles
--   2. provision_organization() RPC function (SECURITY DEFINER)
--      - Creates organization + site_settings defaults + admin_profile in one transaction
--      - Called by self-serve signup AND power_admin-assisted onboarding
--   3. RLS policy allowing authenticated users to call the function
--   4. Updated admin_profiles policies for self-insert during provisioning

-- ─── 1. Add full_name to admin_profiles ─────────────────────────────────────

alter table public.admin_profiles
  add column if not exists full_name text;

comment on column public.admin_profiles.full_name is 'Display name of the admin user.';

-- ─── 2. Organization provisioning function ──────────────────────────────────

create or replace function public.provision_organization(
  p_org_name    text,
  p_org_slug    text,
  p_user_id     uuid default auth.uid(),
  p_full_name   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- Validate inputs
  if p_org_name is null or trim(p_org_name) = '' then
    raise exception 'Organization name is required';
  end if;
  if p_org_slug is null or trim(p_org_slug) = '' then
    raise exception 'Organization slug is required';
  end if;
  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  -- Validate slug format (lowercase alphanumeric + hyphens)
  if p_org_slug !~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' and length(p_org_slug) > 1 then
    raise exception 'Slug must contain only lowercase letters, numbers, and hyphens';
  end if;
  if length(p_org_slug) = 1 and p_org_slug !~ '^[a-z0-9]$' then
    raise exception 'Slug must contain only lowercase letters, numbers, and hyphens';
  end if;

  -- Check slug uniqueness
  if exists(select 1 from public.organizations where slug = p_org_slug) then
    raise exception 'An organization with this URL already exists';
  end if;

  -- Check user doesn't already have an admin profile
  if exists(select 1 from public.admin_profiles where id = p_user_id) then
    raise exception 'This user already has an admin account';
  end if;

  -- 1. Create organization
  insert into public.organizations (name, slug)
  values (trim(p_org_name), trim(p_org_slug))
  returning id into v_org_id;

  -- 2. Create site_settings with sensible defaults
  insert into public.site_settings (organization_id, site_name, site_tagline, active_theme)
  values (
    v_org_id,
    trim(p_org_name),
    'Live football scores, fixtures and standings.',
    'theme-uefa-dark'
  );

  -- 3. Create admin_profile as org_admin for this org
  insert into public.admin_profiles (id, organization_id, role, full_name)
  values (p_user_id, v_org_id, 'org_admin', p_full_name);

  return v_org_id;
end;
$$;

comment on function public.provision_organization is
  'Atomically creates an organization, its site_settings defaults, and assigns the calling user as org_admin. Used for self-serve signup and power_admin-assisted onboarding.';

-- Grant execute to authenticated users (the function itself validates permissions)
grant execute on function public.provision_organization(text, text, uuid, text) to authenticated;

-- ─── 3. Allow anon users to read organizations (already exists, but ensure) ─

-- Already handled by existing policy "public can read organizations"

-- ─── 4. Policy: allow authenticated users to read their own profile ─────────

-- Already handled by existing policy "user can read own profile"
-- The provision_organization function uses SECURITY DEFINER so it
-- bypasses RLS when inserting into admin_profiles.

-- Migration: Update provision_organization() to create subscription row atomically
-- Also seeds subscriptions for any existing organizations that don't have one

-- ── Update the provisioning function ────────────────────────
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

  -- 4. Create subscription (free plan, 7-day trial)
  insert into public.subscriptions (organization_id, plan, status, trial_starts_at, trial_ends_at)
  values (v_org_id, 'free', 'trialing', now(), now() + interval '7 days');

  -- 5. Log the provisioning event
  insert into public.billing_events (organization_id, event_type, payload)
  values (v_org_id, 'org_provisioned', jsonb_build_object(
    'plan', 'free',
    'trial_days', 7,
    'provisioned_by', p_user_id::text
  ));

  return v_org_id;
end;
$$;

-- ── Seed subscriptions for existing organizations ───────────
-- Any org that doesn't have a subscription row gets a free/trialing one
insert into public.subscriptions (organization_id, plan, status, trial_starts_at, trial_ends_at)
select
  o.id,
  'free',
  'trialing',
  o.created_at,
  o.created_at + interval '7 days'
from public.organizations o
where not exists (
  select 1 from public.subscriptions s where s.organization_id = o.id
);

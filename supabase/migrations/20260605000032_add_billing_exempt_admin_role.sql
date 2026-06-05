-- Migration 032: billing_exempt_admin role
--
-- Adds an organization-scoped admin role that bypasses subscription feature
-- gates in the application UI while retaining normal organization-admin data
-- access through existing organization_id-scoped RLS policies.
--
-- billing_exempt_admin:
--   - Belongs to exactly one organization (organization_id IS NOT NULL)
--   - Has the same organization-management surface as org_admin
--   - Is treated as Pro/Unlimited by plan gates in application code
--   - Does NOT receive platform-wide /platform access

alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check
  check (role in ('power_admin', 'org_admin', 'billing_exempt_admin', 'match_operator'));

alter table public.admin_profiles
  drop constraint if exists chk_role_org_consistency;

alter table public.admin_profiles
  add constraint chk_role_org_consistency check (
    (role = 'power_admin'          and organization_id is null) or
    (role = 'org_admin'            and organization_id is not null) or
    (role = 'billing_exempt_admin' and organization_id is not null) or
    (role = 'match_operator'       and organization_id is not null)
  );

comment on column public.admin_profiles.role is
  'power_admin: platform-wide. org_admin: org-scoped. billing_exempt_admin: org-scoped with subscription gates bypassed in app. match_operator: restricted game-day role.';

-- Allow org_admins to read all profiles in their own organization.
-- This is needed so org_admins can list and manage match_operator accounts.
--
-- Existing policies:
--   "user can read own profile"         → SELECT where id = auth.uid() or is_power_admin()
--   "power admin can manage all profiles" → ALL where is_power_admin()
--
-- This adds:
--   "org admin can read org profiles"   → SELECT where organization_id matches caller's org
--   "org admin can manage org operators" → INSERT/UPDATE/DELETE for match_operator rows in their org

-- org_admin can see all profiles in their organization
create policy "org admin can read org profiles"
  on public.admin_profiles for select to authenticated
  using (
    organization_id is not null
    and organization_id = public.admin_org_id()
  );

-- org_admin can insert/update/delete match_operator profiles in their organization
create policy "org admin can manage org operators"
  on public.admin_profiles for all to authenticated
  using (
    role = 'match_operator'
    and organization_id is not null
    and organization_id = public.admin_org_id()
    and public.admin_org_id() is not null
  )
  with check (
    role = 'match_operator'
    and organization_id is not null
    and organization_id = public.admin_org_id()
    and public.admin_org_id() is not null
  );

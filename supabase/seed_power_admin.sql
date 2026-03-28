-- ============================================================
-- POWER ADMIN BOOTSTRAP
-- ============================================================
-- Run this AFTER creating the user in Supabase Dashboard:
--   Auth → Users → Add user → Enter email + password
--
-- Then copy the user's UUID from the dashboard and run:

-- Step 1: Replace <YOUR-USER-UUID> with the actual UUID from Auth → Users
-- Step 2: Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)

insert into public.admin_profiles (id, role, organization_id, full_name)
values (
  '<YOUR-USER-UUID>',   -- UUID from Supabase Auth → Users
  'power_admin',        -- platform-level role
  null,                 -- power_admin must have NULL organization_id
  'Platform Admin'      -- optional display name
);

-- ============================================================
-- VERIFICATION
-- ============================================================
-- After inserting, verify with:

select id, role, organization_id, full_name, created_at
from public.admin_profiles
where role = 'power_admin';

-- ============================================================
-- NOTES
-- ============================================================
-- • power_admin has NULL organization_id (enforced by DB constraint)
-- • power_admin can see and manage ALL organizations
-- • power_admin logs in at /login and is redirected to /platform
-- • To create more power admins, repeat Step 1-2 for each user
-- • To demote a power_admin to org_admin, update the row:
--   UPDATE public.admin_profiles
--   SET role = 'org_admin', organization_id = '<ORG-UUID>'
--   WHERE id = '<USER-UUID>';

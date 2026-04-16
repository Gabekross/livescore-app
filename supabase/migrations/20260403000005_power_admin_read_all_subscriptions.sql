-- Allow power_admin users to read ALL subscriptions (needed for /platform/organizations)
-- The existing policy only lets admins read their own org's subscription.

drop policy if exists "power_admins_read_all_subscriptions" on public.subscriptions;

create policy "power_admins_read_all_subscriptions"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.admin_profiles ap
       where ap.id = auth.uid()
         and ap.role = 'power_admin'
    )
  );

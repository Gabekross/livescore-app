-- Support requests submitted by admins when their organization is paused.
-- These are internal platform records, not public website content.

create table if not exists public.support_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requester_id    uuid references auth.users(id) on delete set null,
  requester_email text,
  subject         text not null,
  message         text not null,
  status          text not null default 'open'
                  check (status in ('open', 'in_review', 'resolved')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_support_requests_org_created
  on public.support_requests(organization_id, created_at desc);

alter table public.support_requests enable row level security;

create policy "power admin can manage support requests"
  on public.support_requests for all to authenticated
  using (public.is_power_admin())
  with check (public.is_power_admin());

create policy "org admins can create own support requests"
  on public.support_requests for insert to authenticated
  with check (public.can_admin_org(organization_id));

create policy "org admins can read own support requests"
  on public.support_requests for select to authenticated
  using (public.can_admin_org(organization_id));

grant all on public.support_requests to service_role;
grant select, insert on public.support_requests to authenticated;

-- Migration: platform_settings (singleton)
-- Adds a single-row table for platform-wide, power-admin-controlled settings.
-- First setting: demo_mode — when true, hides all pricing/billing/upgrade UI
-- across the SaaS for white-label demos and presentations.
--
-- The flag is non-sensitive (purely controls UI visibility), so SELECT is open.
-- INSERT/UPDATE is restricted to power_admin via the existing
-- public.is_power_admin() helper added in 20260326000015_create_rls_policies.sql.

create table if not exists public.platform_settings (
  id              boolean primary key default true,
  demo_mode       boolean not null default false,
  updated_at      timestamptz not null default now(),
  -- Enforce single-row pattern: only id=true can ever exist.
  constraint platform_settings_singleton check (id = true)
);

comment on table  public.platform_settings is
  'Singleton table holding platform-wide settings managed by power_admin.';
comment on column public.platform_settings.demo_mode is
  'When true, hides pricing/billing/upgrade/Stripe UI across the app. Does not change RLS or feature permissions.';

-- Seed the singleton row if not present.
insert into public.platform_settings (id, demo_mode)
values (true, false)
on conflict (id) do nothing;

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.platform_settings enable row level security;

-- Public read — UI flag is non-sensitive and read by anonymous visitors
-- on the marketing/public site.
drop policy if exists platform_settings_read on public.platform_settings;
create policy platform_settings_read
  on public.platform_settings
  for select
  using (true);

-- Only power_admin can mutate.
drop policy if exists platform_settings_insert on public.platform_settings;
create policy platform_settings_insert
  on public.platform_settings
  for insert
  with check (public.is_power_admin());

drop policy if exists platform_settings_update on public.platform_settings;
create policy platform_settings_update
  on public.platform_settings
  for update
  using (public.is_power_admin())
  with check (public.is_power_admin());

-- ── Grants ───────────────────────────────────────────────────────────────────
grant select on public.platform_settings to anon, authenticated;
grant insert, update on public.platform_settings to authenticated;

-- ── Auto-touch updated_at ────────────────────────────────────────────────────
create or replace function public.platform_settings_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_platform_settings_touch on public.platform_settings;
create trigger trg_platform_settings_touch
  before update on public.platform_settings
  for each row
  execute function public.platform_settings_touch_updated_at();

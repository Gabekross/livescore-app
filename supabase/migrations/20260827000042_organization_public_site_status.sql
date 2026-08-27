-- Add an organization-level public website availability switch.
-- public_site_paused_reason is for platform/admin context only and must not be
-- shown on the public unavailable page.

alter table public.organizations
  add column if not exists public_site_enabled boolean not null default true,
  add column if not exists public_site_paused_reason text;

comment on column public.organizations.public_site_enabled is
  'When false, public org pages show a neutral unavailable message instead of website content.';

comment on column public.organizations.public_site_paused_reason is
  'Admin-only reason for pausing an organization public site; never shown publicly.';

-- Migration 004: teams

create table public.teams (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  logo_url        text,
  created_at      timestamptz not null default now()
);

comment on column public.teams.logo_url is 'Public URL from Supabase Storage bucket ''team-logos''.';

-- Migration 006: tournaments
-- slug is used for SEO-friendly public URLs: /tournaments/[slug]
-- is_archived controls archive visibility without deleting historical data.
-- cover_image_url is used on the tournament detail page hero.

create table public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  slug            text not null,
  start_date      date,
  end_date        date,
  venue           text,
  is_archived     boolean not null default false,
  cover_image_url text,
  created_at      timestamptz not null default now(),

  unique(organization_id, slug),

  constraint chk_tournament_dates check (
    start_date is null or end_date is null or start_date <= end_date
  )
);

comment on column public.tournaments.slug        is 'URL-safe slug. Unique within an organization.';
comment on column public.tournaments.is_archived is 'Archived tournaments appear in /archive, not in /tournaments.';

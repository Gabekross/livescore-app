-- Migration 018: enhance posts for full editorial/news experience
-- Adds: excerpt, tournament association, SEO fields, updated_at tracking

-- ── New columns ──────────────────────────────────────────────────────────────

alter table public.posts
  add column if not exists excerpt         text,
  add column if not exists tournament_id   uuid references public.tournaments(id) on delete set null,
  add column if not exists seo_title       text,
  add column if not exists seo_description text,
  add column if not exists og_image_url    text,
  add column if not exists updated_at      timestamptz not null default now();

comment on column public.posts.excerpt         is 'Short summary shown on listing cards. Falls back to first ~160 chars of body.';
comment on column public.posts.tournament_id   is 'Optional: links this post to a specific tournament.';
comment on column public.posts.seo_title       is 'Override for <title> tag. Falls back to title.';
comment on column public.posts.seo_description is 'Meta description and OG description. Falls back to excerpt.';
comment on column public.posts.og_image_url    is 'OG/social share image. Falls back to cover_image_url.';
comment on column public.posts.updated_at      is 'Auto-updated on row changes via trigger.';

-- ── updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- ── Index for tournament-post lookups ────────────────────────────────────────
create index if not exists idx_posts_tournament_id
  on public.posts(tournament_id)
  where tournament_id is not null;

create index if not exists idx_posts_status_published_at
  on public.posts(organization_id, status, published_at desc);

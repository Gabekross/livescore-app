-- Migration 022: sponsors
-- Supports two scopes:
--   tournament_id IS NULL  → org-wide (shown on homepage + footer)
--   tournament_id SET      → tournament-specific (shown on that tournament's page)
--
-- Public can read active sponsors (anon + authenticated).
-- Only org admins can insert / update / delete (uses existing can_admin_org() helper).

-- ── Table ─────────────────────────────────────────────────────────────────────
create table if not exists public.sponsors (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  tournament_id   uuid                    references public.tournaments(id) on delete cascade,

  name            text        not null,
  logo_url        text,
  website_url     text,
  tagline         text,

  -- Title → featured/largest; Gold → standard; Silver / Bronze → smaller
  tier            text        not null default 'gold'
                              check (tier in ('title', 'gold', 'silver', 'bronze')),

  display_order   integer     not null default 0,
  is_active       boolean     not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists sponsors_org_idx
  on public.sponsors(organization_id);

create index if not exists sponsors_tournament_idx
  on public.sponsors(tournament_id)
  where tournament_id is not null;

create index if not exists sponsors_active_order_idx
  on public.sponsors(organization_id, display_order)
  where is_active = true;

-- ── Updated-at trigger ────────────────────────────────────────────────────────
-- Reuses the touch_updated_at() function created in migration 018.
create trigger sponsors_touch_updated_at
  before update on public.sponsors
  for each row execute function public.touch_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.sponsors enable row level security;

-- Anyone can read active sponsors
create policy "public can read active sponsors"
  on public.sponsors for select to anon, authenticated
  using (is_active = true);

-- Org admins can read ALL sponsors (including inactive) for their org
create policy "org admin can read all sponsors"
  on public.sponsors for select to authenticated
  using (public.can_admin_org(organization_id));

-- Org admins can insert / update / delete their own org's sponsors
create policy "org admin can manage sponsors"
  on public.sponsors for all to authenticated
  using      (public.can_admin_org(organization_id))
  with check (public.can_admin_org(organization_id));

-- ── Comments ──────────────────────────────────────────────────────────────────
comment on table  public.sponsors                  is 'Sponsor records scoped to an organisation, optionally to a specific tournament.';
comment on column public.sponsors.tournament_id    is 'NULL = org-wide sponsor; set = tournament-specific sponsor.';
comment on column public.sponsors.tier             is 'title | gold | silver | bronze — controls display size and sort order.';
comment on column public.sponsors.display_order    is 'Lower numbers appear first within the same tier.';

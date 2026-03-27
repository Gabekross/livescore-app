-- Migration 007: tournament_stages
-- show_standings replaces the old hardcoded 'Preliminary' name check in
-- TournamentStandings.tsx. Admins can toggle standings per stage.

create table public.tournament_stages (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  stage_name     text not null,
  order_number   integer not null,
  show_standings boolean not null default true
);

comment on column public.tournament_stages.show_standings is
  'When true, a standings table is shown for this stage. Replaces name-based conditional logic.';

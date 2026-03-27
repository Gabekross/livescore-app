-- Migration 011: match_lineups
-- Composite PK (match_id, player_id) matches the existing upsert pattern in the codebase.
-- formation_slot maps a player to a numbered position slot in formationLayouts.

create table public.match_lineups (
  match_id       uuid not null references public.matches(id)  on delete cascade,
  player_id      uuid not null references public.players(id)  on delete cascade,
  team_id        uuid not null references public.teams(id),
  is_starting    boolean not null default false,
  goals          integer not null default 0,
  assists        integer not null default 0,
  yellow_cards   integer not null default 0,
  red_cards      integer not null default 0,
  formation_slot integer,
  primary key (match_id, player_id)
);

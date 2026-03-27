-- Migration 010: matches
--
-- match_type:
--   tournament  – part of a tournament structure (tournament_id required)
--   friendly    – standalone match (tournament_id nullable)
--
-- affects_standings:
--   true  – counted in group/tournament standings (always false for friendlies)
--   false – friendly or exhibition; excluded from all standing calculations
--
-- status values (normalized from old codebase):
--   scheduled   was: 'scheduled'
--   live        was: 'ongoing'
--   halftime    was: 'halftime'
--   completed   was: 'finished'

create table public.matches (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  tournament_id     uuid references public.tournaments(id),
  group_id          uuid references public.groups(id),
  home_team_id      uuid not null references public.teams(id),
  away_team_id      uuid not null references public.teams(id),
  match_date        timestamptz not null,
  venue             text,
  match_type        text not null default 'tournament'
                    check (match_type in ('tournament', 'friendly')),
  affects_standings boolean not null default true,
  status            text not null default 'scheduled'
                    check (status in ('scheduled', 'live', 'halftime', 'completed')),
  home_score        integer,
  away_score        integer,
  home_formation    text,
  away_formation    text,
  created_at        timestamptz not null default now(),

  constraint chk_match_teams_differ check (home_team_id <> away_team_id),

  -- Friendly matches must not affect standings
  constraint chk_friendly_no_standings check (
    match_type <> 'friendly' or affects_standings = false
  ),

  -- Tournament matches require a tournament_id
  constraint chk_tournament_match_has_tournament check (
    match_type <> 'tournament' or tournament_id is not null
  )
);

comment on column public.matches.match_type        is 'tournament or friendly. Friendly matches are never counted in standings.';
comment on column public.matches.affects_standings is 'Derived from match_type for friendlies; can be set false for special tournament matches.';
comment on column public.matches.status            is 'scheduled | live | halftime | completed';

-- Migration 005: players

create table public.players (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references public.teams(id) on delete cascade,
  name           text not null,
  jersey_number  integer,
  position       text,
  created_at     timestamptz not null default now()
);

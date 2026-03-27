-- Migration 008: groups

create table public.groups (
  id        uuid primary key default gen_random_uuid(),
  stage_id  uuid not null references public.tournament_stages(id) on delete cascade,
  name      text not null
);

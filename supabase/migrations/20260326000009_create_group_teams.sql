-- Migration 009: group_teams
-- Join table assigning teams to groups within a stage.

create table public.group_teams (
  group_id  uuid not null references public.groups(id)  on delete cascade,
  team_id   uuid not null references public.teams(id)   on delete cascade,
  primary key (group_id, team_id)
);

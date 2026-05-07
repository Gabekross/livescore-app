-- Migration 029: Split player name into first_name + last_name, add phone_number
-- Keeps the existing `name` column for backwards compatibility.

-- 1. Add new columns
alter table public.players
  add column if not exists first_name    text,
  add column if not exists last_name     text,
  add column if not exists phone_number  text;

-- 2. Backfill from existing `name` column
--    first word → first_name, remainder → last_name
update public.players
set
  first_name = split_part(trim(name), ' ', 1),
  last_name  = nullif(trim(substr(trim(name), length(split_part(trim(name), ' ', 1)) + 2)), '')
where first_name is null and name is not null;

-- 3. Make first_name NOT NULL now that backfill is done
alter table public.players
  alter column first_name set not null;

-- 4. Drop and recreate the view (CREATE OR REPLACE cannot reorder/add columns)
drop view if exists public.player_stats_summary;

create view public.player_stats_summary as
select
  ml.player_id,
  p.name                                     as player_name,
  p.first_name,
  p.last_name,
  p.team_id,
  t.name                                     as team_name,
  t.organization_id,
  count(distinct ml.match_id)::integer       as matches_played,
  sum(ml.goals)::integer                     as goals,
  sum(ml.assists)::integer                   as assists,
  sum(ml.yellow_cards)::integer              as yellow_cards,
  sum(ml.red_cards)::integer                 as red_cards
from public.match_lineups ml
join public.players  p on p.id  = ml.player_id
join public.teams    t on t.id  = p.team_id
group by
  ml.player_id,
  p.name,
  p.first_name,
  p.last_name,
  p.team_id,
  t.name,
  t.organization_id;

comment on view public.player_stats_summary is
  'Aggregated player stats from match_lineups. Filter by organization_id to scope to a single org.';

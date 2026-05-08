-- Migration 030: Fix player_stats_summary view
--
-- Root cause: the view had no SELECT grant for anon/authenticated, so
-- Supabase client queries returned zero rows.
--
-- Also fixes the team join: uses ml.team_id (team the player played for
-- in that match) instead of p.team_id (player's current team), which is
-- more correct for transferred players.

drop view if exists public.player_stats_summary;

create view public.player_stats_summary as
select
  ml.player_id,
  p.name                                     as player_name,
  p.first_name,
  p.last_name,
  ml.team_id,
  t.name                                     as team_name,
  t.organization_id,
  count(distinct ml.match_id)::integer       as matches_played,
  coalesce(sum(ml.goals), 0)::integer        as goals,
  coalesce(sum(ml.assists), 0)::integer      as assists,
  coalesce(sum(ml.yellow_cards), 0)::integer as yellow_cards,
  coalesce(sum(ml.red_cards), 0)::integer    as red_cards
from public.match_lineups ml
join public.players p on p.id = ml.player_id
join public.teams   t on t.id = ml.team_id
group by
  ml.player_id,
  p.name,
  p.first_name,
  p.last_name,
  ml.team_id,
  t.name,
  t.organization_id;

comment on view public.player_stats_summary is
  'Aggregated player stats from match_lineups. Filter by organization_id to scope to a single org.';

-- Grant SELECT so the Supabase client can actually read the view
grant select on public.player_stats_summary to anon, authenticated;

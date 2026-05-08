-- Migration 031: Add tournament dimension to player_stats_summary
--
-- The view now includes tournament_id and tournament_name so the stats
-- page can filter per tournament. Friendly matches (tournament_id IS NULL)
-- get NULL for both columns — they still appear under "All Tournaments"
-- and can be shown separately in the UI.

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
  m.tournament_id,
  tr.name                                    as tournament_name,
  count(distinct ml.match_id)::integer       as matches_played,
  coalesce(sum(ml.goals), 0)::integer        as goals,
  coalesce(sum(ml.assists), 0)::integer      as assists,
  coalesce(sum(ml.yellow_cards), 0)::integer as yellow_cards,
  coalesce(sum(ml.red_cards), 0)::integer    as red_cards
from public.match_lineups ml
join public.players     p  on p.id  = ml.player_id
join public.teams       t  on t.id  = ml.team_id
join public.matches     m  on m.id  = ml.match_id
left join public.tournaments tr on tr.id = m.tournament_id
group by
  ml.player_id,
  p.name,
  p.first_name,
  p.last_name,
  ml.team_id,
  t.name,
  t.organization_id,
  m.tournament_id,
  tr.name;

comment on view public.player_stats_summary is
  'Per-player per-team per-tournament stats from match_lineups. Filter by organization_id and optionally tournament_id.';

grant select on public.player_stats_summary to anon, authenticated;

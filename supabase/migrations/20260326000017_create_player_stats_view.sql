-- Migration 017: player_stats_summary view
-- Aggregates match_lineups per player across all matches.
-- Used by the admin player stats page and future public top-scorers widget.
-- Includes organization_id so the consumer can filter to a single org.
--
-- Note: This view does not define its own RLS. Consumers must filter by
-- organization_id themselves. The underlying match_lineups table has a
-- "public can read" policy, so all anon users can query this view.
-- If you need to restrict it, wrap it in an RPC function with SECURITY DEFINER.

create or replace view public.player_stats_summary as
select
  ml.player_id,
  p.name                         as player_name,
  p.team_id,
  t.name                         as team_name,
  t.organization_id,
  count(distinct ml.match_id)::integer   as matches_played,
  sum(ml.goals)::integer                 as goals,
  sum(ml.assists)::integer               as assists,
  sum(ml.yellow_cards)::integer          as yellow_cards,
  sum(ml.red_cards)::integer             as red_cards
from public.match_lineups ml
join public.players  p on p.id  = ml.player_id
join public.teams    t on t.id  = p.team_id
group by
  ml.player_id,
  p.name,
  p.team_id,
  t.name,
  t.organization_id;

comment on view public.player_stats_summary is
  'Aggregated player stats from match_lineups. Filter by organization_id to scope to a single org.';

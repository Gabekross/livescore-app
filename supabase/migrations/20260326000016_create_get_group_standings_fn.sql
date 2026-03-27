-- Migration 016: get_group_standings RPC function
--
-- Called by GroupStandings.tsx: supabase.rpc('get_group_standings', { group_input: groupId })
--
-- Only counts matches where:
--   status = 'completed'   (not scheduled/live/halftime)
--   affects_standings = true  (excludes friendlies)
--   both scores are non-null
--
-- Sorted by: points desc, goal_difference desc, goals_for desc

create or replace function public.get_group_standings(group_input uuid)
returns table (
  team_id         uuid,
  team_name       text,
  played          integer,
  wins            integer,
  draws           integer,
  losses          integer,
  goals_for       integer,
  goals_against   integer,
  goal_difference integer,
  points          integer
)
language sql stable security definer
as $$
  with eligible_matches as (
    select
      home_team_id,
      away_team_id,
      home_score,
      away_score
    from public.matches
    where group_id          = group_input
      and status            = 'completed'
      and affects_standings = true
      and home_score        is not null
      and away_score        is not null
  ),
  per_side as (
    -- Home perspective
    select
      home_team_id                                            as team_id,
      count(*)                                               as played,
      count(*) filter (where home_score > away_score)        as wins,
      count(*) filter (where home_score = away_score)        as draws,
      count(*) filter (where home_score < away_score)        as losses,
      coalesce(sum(home_score), 0)                           as goals_for,
      coalesce(sum(away_score), 0)                           as goals_against
    from eligible_matches
    group by home_team_id

    union all

    -- Away perspective
    select
      away_team_id                                           as team_id,
      count(*)                                               as played,
      count(*) filter (where away_score > home_score)        as wins,
      count(*) filter (where away_score = home_score)        as draws,
      count(*) filter (where away_score < home_score)        as losses,
      coalesce(sum(away_score), 0)                           as goals_for,
      coalesce(sum(home_score), 0)                           as goals_against
    from eligible_matches
    group by away_team_id
  ),
  aggregated as (
    select
      team_id,
      sum(played)::integer                                   as played,
      sum(wins)::integer                                     as wins,
      sum(draws)::integer                                    as draws,
      sum(losses)::integer                                   as losses,
      sum(goals_for)::integer                                as goals_for,
      sum(goals_against)::integer                            as goals_against,
      (sum(goals_for) - sum(goals_against))::integer         as goal_difference,
      (sum(wins) * 3 + sum(draws))::integer                  as points
    from per_side
    group by team_id
  )
  select
    a.team_id,
    t.name  as team_name,
    a.played,
    a.wins,
    a.draws,
    a.losses,
    a.goals_for,
    a.goals_against,
    a.goal_difference,
    a.points
  from aggregated a
  join public.teams t on t.id = a.team_id
  order by a.points desc, a.goal_difference desc, a.goals_for desc, t.name asc
$$;

comment on function public.get_group_standings(uuid) is
  'Returns standings for a single group. Only counts completed, affects_standings=true matches.';

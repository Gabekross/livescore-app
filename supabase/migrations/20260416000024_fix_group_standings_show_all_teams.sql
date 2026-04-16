-- Migration 024: Fix get_group_standings to always show all assigned teams
--
-- Previous version started from the matches table, so groups with no completed
-- matches returned zero rows — teams only appeared once they had played a game.
--
-- This version starts from group_teams (all teams assigned to the group) and
-- LEFT JOINs the match aggregates, so every team shows immediately with 0s.

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
  -- Start from ALL teams assigned to this group, then LEFT JOIN match stats.
  -- Teams with no matches played get 0 across every column.
  select
    t.id                              as team_id,
    t.name                            as team_name,
    coalesce(a.played,          0)    as played,
    coalesce(a.wins,            0)    as wins,
    coalesce(a.draws,           0)    as draws,
    coalesce(a.losses,          0)    as losses,
    coalesce(a.goals_for,       0)    as goals_for,
    coalesce(a.goals_against,   0)    as goals_against,
    coalesce(a.goal_difference, 0)    as goal_difference,
    coalesce(a.points,          0)    as points
  from public.group_teams gt
  join  public.teams t  on t.id = gt.team_id
  left join aggregated  a  on a.team_id = gt.team_id
  where gt.group_id = group_input
  order by
    coalesce(a.points,          0) desc,
    coalesce(a.goal_difference, 0) desc,
    coalesce(a.goals_for,       0) desc,
    t.name asc
$$;

comment on function public.get_group_standings(uuid) is
  'Returns standings for a single group. All assigned teams are always shown (with 0s before any matches are played). Only counts completed, affects_standings=true matches.';

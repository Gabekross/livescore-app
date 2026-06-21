-- Migration 036: live standings
--
-- Standings should behave as a live table while matches are in progress. This
-- counts live, halftime, and completed matches, while still excluding scheduled
-- matches, friendlies, and rows without scores.

drop function if exists public.get_group_standings(uuid);

create function public.get_group_standings(group_input uuid)
returns table (
  team_id         uuid,
  team_name       text,
  team_logo_url   text,
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
      and status            in ('live', 'halftime', 'completed')
      and affects_standings = true
      and home_score        is not null
      and away_score        is not null
  ),
  per_side as (
    select
      home_team_id                                            as team_id,
      count(*)                                                as played,
      count(*) filter (where home_score > away_score)         as wins,
      count(*) filter (where home_score = away_score)         as draws,
      count(*) filter (where home_score < away_score)         as losses,
      coalesce(sum(home_score), 0)                            as goals_for,
      coalesce(sum(away_score), 0)                            as goals_against
    from eligible_matches
    group by home_team_id

    union all

    select
      away_team_id                                            as team_id,
      count(*)                                                as played,
      count(*) filter (where away_score > home_score)         as wins,
      count(*) filter (where away_score = home_score)         as draws,
      count(*) filter (where away_score < home_score)         as losses,
      coalesce(sum(away_score), 0)                            as goals_for,
      coalesce(sum(home_score), 0)                            as goals_against
    from eligible_matches
    group by away_team_id
  ),
  aggregated as (
    select
      team_id,
      sum(played)::integer                                    as played,
      sum(wins)::integer                                      as wins,
      sum(draws)::integer                                     as draws,
      sum(losses)::integer                                    as losses,
      sum(goals_for)::integer                                 as goals_for,
      sum(goals_against)::integer                             as goals_against,
      (sum(goals_for) - sum(goals_against))::integer          as goal_difference,
      (sum(wins) * 3 + sum(draws))::integer                   as points
    from per_side
    group by team_id
  )
  select
    t.id                              as team_id,
    t.name                            as team_name,
    t.logo_url                        as team_logo_url,
    coalesce(a.played,          0)    as played,
    coalesce(a.wins,            0)    as wins,
    coalesce(a.draws,           0)    as draws,
    coalesce(a.losses,          0)    as losses,
    coalesce(a.goals_for,       0)    as goals_for,
    coalesce(a.goals_against,   0)    as goals_against,
    coalesce(a.goal_difference, 0)    as goal_difference,
    coalesce(a.points,          0)    as points
  from public.group_teams gt
  join public.teams t on t.id = gt.team_id
  left join aggregated a on a.team_id = gt.team_id
  where gt.group_id = group_input
  order by
    coalesce(a.points,          0) desc,
    coalesce(a.goal_difference, 0) desc,
    coalesce(a.goals_for,       0) desc,
    t.name asc
$$;

comment on function public.get_group_standings(uuid) is
  'Returns live standings for a single group, including team logo URLs. Counts live, halftime, and completed affects_standings=true matches with scores.';

grant execute on function public.get_group_standings(uuid) to anon, authenticated;

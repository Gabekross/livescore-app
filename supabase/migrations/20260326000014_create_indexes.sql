-- Migration 014: indexes
-- Performance indexes for common query patterns observed in the codebase.

-- organizations
create index idx_organizations_slug on public.organizations(slug);

-- site_settings
create index idx_site_settings_org on public.site_settings(organization_id);

-- admin_profiles
create index idx_admin_profiles_org  on public.admin_profiles(organization_id);

-- teams
create index idx_teams_org on public.teams(organization_id);

-- players
create index idx_players_team on public.players(team_id);

-- tournaments
create index idx_tournaments_org        on public.tournaments(organization_id);
create index idx_tournaments_archived   on public.tournaments(organization_id, is_archived);
create index idx_tournaments_start_date on public.tournaments(start_date);

-- tournament_stages
create index idx_tournament_stages_tournament on public.tournament_stages(tournament_id);

-- groups
create index idx_groups_stage on public.groups(stage_id);

-- group_teams
create index idx_group_teams_team  on public.group_teams(team_id);
create index idx_group_teams_group on public.group_teams(group_id);

-- matches — most heavily queried table
create index idx_matches_org            on public.matches(organization_id);
create index idx_matches_tournament     on public.matches(tournament_id);
create index idx_matches_group          on public.matches(group_id);
create index idx_matches_status         on public.matches(status);
create index idx_matches_date           on public.matches(match_date);
create index idx_matches_type           on public.matches(match_type);
create index idx_matches_org_date       on public.matches(organization_id, match_date);
create index idx_matches_org_status     on public.matches(organization_id, status);
create index idx_matches_home_team      on public.matches(home_team_id);
create index idx_matches_away_team      on public.matches(away_team_id);

-- match_lineups
create index idx_lineups_match   on public.match_lineups(match_id);
create index idx_lineups_player  on public.match_lineups(player_id);
create index idx_lineups_team    on public.match_lineups(team_id);

-- posts
create index idx_posts_org             on public.posts(organization_id);
create index idx_posts_status          on public.posts(organization_id, status);
create index idx_posts_published       on public.posts(organization_id, published_at desc)
                                       where status = 'published';

-- media
create index idx_media_org         on public.media(organization_id);
create index idx_media_entity      on public.media(entity_type, entity_id);

-- Add coach_name to teams table
-- Stores the head coach / manager name for display on match detail pages
-- and admin team management.

alter table public.teams add column if not exists coach_name text;

comment on column public.teams.coach_name is 'Head coach / manager name';

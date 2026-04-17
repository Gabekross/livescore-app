-- Migration: add show_on_public_teams_page to teams
--
-- Purpose: allow admins to hide specific teams from the public /teams listing
-- without affecting fixtures, standings, match assignment, or any admin flow.
--
-- Default TRUE → all existing teams remain visible. Zero disruption.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS show_on_public_teams_page boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN teams.show_on_public_teams_page IS
  'When false the team is hidden from the public /teams page. '
  'It still appears in fixtures, match pages, standings, and all admin views.';

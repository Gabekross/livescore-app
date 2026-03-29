-- Add match-specific coach name overrides.
-- When set, these take precedence over the team-level coach_name.
-- When NULL, the public pages fall back to teams.coach_name.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS home_coach text,
  ADD COLUMN IF NOT EXISTS away_coach text;

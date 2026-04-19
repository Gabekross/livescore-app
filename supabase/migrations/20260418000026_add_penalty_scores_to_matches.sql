-- Migration 026: add penalty shootout scores to matches
-- pen_home_score / pen_away_score are set only when a match was decided by
-- a penalty shootout. The main home_score / away_score always reflect the
-- score at full time (or extra time). Both columns must be set together or
-- left null.

alter table public.matches
  add column pen_home_score integer default null,
  add column pen_away_score integer default null;

comment on column public.matches.pen_home_score is
  'Penalty shootout score for the home team. Null when match was not decided by penalties.';
comment on column public.matches.pen_away_score is
  'Penalty shootout score for the away team. Null when match was not decided by penalties.';

-- Migration 021: add cover_images array to posts
-- Allows multiple images per post displayed as a carousel.
-- cover_image_url remains the single "selected" cover for SEO/OG/cards.
-- cover_images stores the full ordered list of image URLs.

alter table public.posts
  add column if not exists cover_images jsonb not null default '[]'::jsonb;

comment on column public.posts.cover_images is
  'Ordered array of image URLs shown as a carousel on the article page. cover_image_url is the admin-selected cover from this list (used for cards, OG tags, hero).';

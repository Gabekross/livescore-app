-- Optional public author credit for news articles.

alter table public.posts
  add column if not exists author_name text;

comment on column public.posts.author_name is 'Optional public byline/author credit shown on article pages.';

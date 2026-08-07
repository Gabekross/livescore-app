-- Optional public link for article author credit.

alter table public.posts
  add column if not exists author_url text;

comment on column public.posts.author_url is 'Optional external URL linked from the public article author byline.';

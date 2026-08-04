-- Anonymous article likes.
-- Public readers never write directly to this table; writes go through the API.

create table if not exists public.article_likes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  post_id         uuid not null references public.posts(id) on delete cascade,
  visitor_id      text not null,
  created_at      timestamptz not null default now(),

  constraint article_likes_visitor_len check (char_length(visitor_id) between 12 and 96),
  constraint article_likes_unique unique (organization_id, post_id, visitor_id)
);

create index if not exists idx_article_likes_org_post
  on public.article_likes(organization_id, post_id);

create index if not exists idx_article_likes_post_created
  on public.article_likes(post_id, created_at desc);

alter table public.article_likes enable row level security;

drop policy if exists "Admins can read article likes" on public.article_likes;
create policy "Admins can read article likes"
  on public.article_likes
  for select
  to authenticated
  using (public.can_admin_org(organization_id));

grant all on public.article_likes to service_role;
grant select on public.article_likes to authenticated;

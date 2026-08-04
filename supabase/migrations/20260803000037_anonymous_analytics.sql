-- Anonymous, low-write analytics for public site visits and article reads.
-- Stores one row per anonymous browser, per day, per event/content.

create table if not exists public.analytics_daily_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_date      date not null default current_date,
  event_type      text not null check (event_type in ('site_visit', 'news_article_view')),
  visitor_id      text not null,
  content_key     text not null default '',
  post_id         uuid references public.posts(id) on delete cascade,
  path            text,
  view_count      integer not null default 1 check (view_count > 0),
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),

  constraint analytics_daily_events_visitor_len check (char_length(visitor_id) between 12 and 96),
  constraint analytics_daily_events_content_match check (
    (event_type = 'news_article_view' and post_id is not null and content_key = post_id::text)
    or
    (event_type = 'site_visit' and post_id is null and content_key = '')
  ),
  constraint analytics_daily_events_unique unique (
    organization_id,
    event_date,
    event_type,
    visitor_id,
    content_key
  )
);

create index if not exists idx_analytics_daily_events_org_date
  on public.analytics_daily_events(organization_id, event_date desc);

create index if not exists idx_analytics_daily_events_org_type_date
  on public.analytics_daily_events(organization_id, event_type, event_date desc);

create index if not exists idx_analytics_daily_events_post_date
  on public.analytics_daily_events(post_id, event_date desc)
  where post_id is not null;

alter table public.analytics_daily_events enable row level security;

drop policy if exists "Admins can read analytics" on public.analytics_daily_events;
create policy "Admins can read analytics"
  on public.analytics_daily_events
  for select
  to authenticated
  using (public.can_admin_org(organization_id));

create or replace function public.record_analytics_event(
  p_organization_id uuid,
  p_event_type text,
  p_visitor_id text,
  p_post_id uuid default null,
  p_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content_key text := coalesce(p_post_id::text, '');
begin
  if p_event_type not in ('site_visit', 'news_article_view') then
    raise exception 'Invalid analytics event type';
  end if;

  if p_event_type = 'news_article_view' and p_post_id is null then
    raise exception 'post_id is required for news article analytics';
  end if;

  if p_event_type = 'site_visit' and p_post_id is not null then
    raise exception 'post_id is not allowed for site visit analytics';
  end if;

  insert into public.analytics_daily_events (
    organization_id,
    event_date,
    event_type,
    visitor_id,
    content_key,
    post_id,
    path,
    view_count
  )
  values (
    p_organization_id,
    current_date,
    p_event_type,
    p_visitor_id,
    v_content_key,
    p_post_id,
    left(p_path, 500),
    1
  )
  on conflict (organization_id, event_date, event_type, visitor_id, content_key)
  do update set
    view_count = public.analytics_daily_events.view_count + 1,
    last_seen_at = now(),
    path = excluded.path;
end;
$$;

grant all on public.analytics_daily_events to service_role;
grant select on public.analytics_daily_events to authenticated;
grant execute on function public.record_analytics_event(uuid, text, text, uuid, text) to service_role;

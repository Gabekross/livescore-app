-- Migration 012: posts (news/blog)
-- slug is unique per organization for SEO-friendly URLs: /news/[slug]
-- status: draft (admin-only) | published (public)

create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  slug            text not null,
  body            text,
  cover_image_url text,
  status          text not null default 'draft'
                  check (status in ('draft', 'published')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),

  unique(organization_id, slug)
);

comment on column public.posts.slug        is 'URL-safe slug. Unique within an organization.';
comment on column public.posts.published_at is 'Set when status changes to published. Used for ordering and display.';

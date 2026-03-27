-- Migration 001: organizations
-- Root tenant table. Every content entity is scoped to an organization.
-- slug is the URL/env-var identifier (e.g. 'jcl26').
-- domain column is reserved for future domain-based org resolution.

create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  domain     text unique,            -- reserved for future domain-based routing
  created_at timestamptz not null default now()
);

comment on table  public.organizations          is 'Root tenant. All platform content is scoped to an organization.';
comment on column public.organizations.slug     is 'URL-safe identifier used via NEXT_PUBLIC_ORGANIZATION_SLUG env var.';
comment on column public.organizations.domain   is 'Reserved: maps a custom domain to an org for multi-domain routing.';

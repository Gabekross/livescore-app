-- Migration 002: site_settings
-- One row per organization. Controls public branding, active theme, and SEO defaults.
-- active_theme maps to a CSS class applied to <html> (e.g. 'theme-uefa-dark').

create table public.site_settings (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  site_name       text not null default '',
  site_tagline    text not null default '',
  logo_url        text,
  favicon_url     text,
  active_theme    text not null default 'theme-uefa-dark',
  primary_color   text,
  accent_color    text,
  og_image_url    text,
  footer_text     text,
  updated_at      timestamptz not null default now()
);

comment on table  public.site_settings               is 'Per-org branding, theme, and SEO configuration.';
comment on column public.site_settings.active_theme  is 'CSS class name applied to <html>. Must match a theme defined in globals.scss.';
comment on column public.site_settings.primary_color is 'Optional override. If set, applied as --color-primary CSS variable.';

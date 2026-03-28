-- Migration 020: Add contact_email to site_settings
-- Allows organizations to set a public contact email shown in their site footer.

alter table public.site_settings
  add column if not exists contact_email text;

comment on column public.site_settings.contact_email is
  'Optional public contact email shown in the organization site footer.';

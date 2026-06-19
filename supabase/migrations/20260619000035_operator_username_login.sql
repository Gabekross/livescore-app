-- Migration 035: operator username login
--
-- Match operators may not have email addresses. Supabase Auth still requires
-- an email-shaped login internally, so the app stores a human-friendly operator
-- login ID separately and generates the Auth email server-side.

alter table public.admin_profiles
  add column if not exists operator_login_id text,
  add column if not exists contact_email text;

create unique index if not exists idx_admin_profiles_operator_login_id_unique
  on public.admin_profiles (lower(operator_login_id))
  where operator_login_id is not null;

alter table public.admin_profiles
  drop constraint if exists chk_operator_login_id_role;

alter table public.admin_profiles
  add constraint chk_operator_login_id_role check (
    operator_login_id is null or role = 'match_operator'
  );

comment on column public.admin_profiles.operator_login_id is
  'Human-friendly login ID for match_operator users who may not have an email address.';

comment on column public.admin_profiles.contact_email is
  'Optional real contact email for a match_operator. Supabase Auth may use a generated internal email instead.';

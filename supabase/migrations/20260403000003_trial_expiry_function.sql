-- Migration: Trial expiry automation
-- This function can be called by a Supabase cron job (pg_cron) or Edge Function.
-- It marks expired trials as 'expired' status.

-- ── expire_trials() ─────────────────────────────────────────
-- Finds all subscriptions in 'trialing' status where trial_ends_at < now()
-- and updates them to 'expired'.
-- Returns the count of expired subscriptions.

create or replace function public.expire_trials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.subscriptions
       set status     = 'expired',
           updated_at = now()
     where status = 'trialing'
       and trial_ends_at < now()
    returning id, organization_id
  ),
  logged as (
    insert into public.billing_events (organization_id, event_type, payload)
    select
      e.organization_id,
      'trial_expired',
      jsonb_build_object('subscription_id', e.id, 'expired_at', now()::text)
    from expired e
  )
  select count(*) into v_count from expired;

  return v_count;
end;
$$;

comment on function public.expire_trials is
  'Marks trialing subscriptions past their trial_ends_at as expired. Safe to call repeatedly (idempotent). Intended for cron or scheduled invocation.';

-- Grant to service_role (for Edge Function / cron invocation)
grant execute on function public.expire_trials() to service_role;

-- ── Optional: Set up pg_cron job ─────────────────────────────
-- Uncomment the following if pg_cron extension is enabled in your Supabase project:
--
-- select cron.schedule(
--   'expire-trials',          -- job name
--   '0 */6 * * *',            -- every 6 hours
--   'select public.expire_trials()'
-- );

-- ============================================================
-- Subscriptions & Billing
-- ============================================================

-- ── subscriptions table ─────────────────────────────────────
create table if not exists public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  plan              text not null default 'free'
                      check (plan in ('free', 'pro')),
  status            text not null default 'trialing'
                      check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  billing_interval  text check (billing_interval in ('month', 'year')),

  -- Trial
  trial_starts_at   timestamptz not null default now(),
  trial_ends_at     timestamptz not null default (now() + interval '7 days'),

  -- Current billing period (set when Stripe confirms)
  current_period_start timestamptz,
  current_period_end   timestamptz,

  -- Stripe references
  stripe_customer_id      text,
  stripe_subscription_id  text unique,

  -- Metadata
  canceled_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- One subscription per org
  constraint subscriptions_organization_id_key unique (organization_id)
);

-- Indexes
create index if not exists idx_subscriptions_org
  on public.subscriptions(organization_id);
create index if not exists idx_subscriptions_stripe_customer
  on public.subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;
create index if not exists idx_subscriptions_status
  on public.subscriptions(status);

-- ── billing_events table ────────────────────────────────────
create table if not exists public.billing_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  event_type       text not null,
  stripe_event_id  text unique,
  payload          jsonb default '{}',
  created_at       timestamptz not null default now()
);

create index if not exists idx_billing_events_org
  on public.billing_events(organization_id);
create index if not exists idx_billing_events_type
  on public.billing_events(event_type);

-- ── get_org_plan() helper ───────────────────────────────────
-- Returns the effective plan for an organization:
--   'pro'     — active paid subscription
--   'free'    — trialing or no subscription
--   'expired' — trial ended without upgrade, or canceled/past_due
create or replace function public.get_org_plan(p_org_id uuid)
returns text
language plpgsql
stable
security definer
as $$
declare
  v_sub record;
begin
  select * into v_sub
    from public.subscriptions
   where organization_id = p_org_id
   limit 1;

  -- No subscription row → free (shouldn't happen after provisioning)
  if v_sub is null then
    return 'free';
  end if;

  -- Active paid subscription
  if v_sub.plan = 'pro' and v_sub.status = 'active' then
    return 'pro';
  end if;

  -- Trialing
  if v_sub.status = 'trialing' then
    if now() <= v_sub.trial_ends_at then
      return 'free';
    else
      return 'expired';
    end if;
  end if;

  -- Past due — give a grace window (still show pro but flag it)
  if v_sub.status = 'past_due' then
    return 'expired';
  end if;

  -- Canceled or expired
  if v_sub.status in ('canceled', 'expired') then
    return 'expired';
  end if;

  return 'free';
end;
$$;

-- ── RLS policies ────────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;

-- Org admins can read their own subscription
create policy "org_admins_read_own_subscription"
  on public.subscriptions for select
  using (
    organization_id in (
      select ap.organization_id from public.admin_profiles ap
       where ap.id = auth.uid()
         and ap.role in ('org_admin', 'power_admin')
    )
  );

-- Only service role (webhooks) can insert/update subscriptions
-- No insert/update/delete policies for authenticated — handled via service role

-- Org admins can read their billing events
create policy "org_admins_read_own_billing_events"
  on public.billing_events for select
  using (
    organization_id in (
      select ap.organization_id from public.admin_profiles ap
       where ap.id = auth.uid()
         and ap.role in ('org_admin', 'power_admin')
    )
  );

-- ── Grant service_role full access ──────────────────────────
grant all on public.subscriptions   to service_role;
grant all on public.billing_events  to service_role;

-- Grant authenticated read access (RLS handles row filtering)
grant select on public.subscriptions  to authenticated;
grant select on public.billing_events to authenticated;

-- ── Updated_at trigger ──────────────────────────────────────
create or replace function public.update_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.update_subscription_updated_at();

-- Migration: add cancel_at_period_end to subscriptions
-- Tracks whether a Pro subscription is scheduled to cancel at period end.
-- True means the user cancelled via portal/API but still has access until
-- current_period_end, after which customer.subscription.deleted fires.

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

comment on column public.subscriptions.cancel_at_period_end is
  'When true the subscription will not renew — access continues until current_period_end.';

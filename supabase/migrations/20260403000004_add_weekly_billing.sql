-- Migration: Add 'week' as a billing_interval option
-- Supports weekly billing cycle for Pro plan

alter table public.subscriptions
  drop constraint if exists subscriptions_billing_interval_check;

alter table public.subscriptions
  add constraint subscriptions_billing_interval_check
  check (billing_interval in ('week', 'month', 'year'));

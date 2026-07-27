-- Card payments (Stripe Checkout).
--
-- Two things matter here:
--
-- 1. Every payment must attach to an order that already exists in our
--    database, so we can never receive money with nothing to fulfil.
--    invoices.stripe_checkout_id links the two.
--
-- 2. Stripe retries webhooks. Recording each event id means a retry can
--    never instruct two surveys or raise two purchase orders — the second
--    attempt sees the id already present and stops.

create table if not exists webhook_events (
  id text primary key,                    -- Stripe's event id, e.g. evt_123
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

comment on table webhook_events is
  'Idempotency ledger for Stripe webhooks. A repeated event id is ignored.';

alter table webhook_events enable row level security;

-- Payment state on the invoice. 'awaiting-payment' is the gap between
-- creating the order and Stripe confirming the money arrived.
alter table invoices
  add column if not exists stripe_payment_intent text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_amount numeric(10,2);

create index if not exists invoices_checkout_idx on invoices (stripe_checkout_id);

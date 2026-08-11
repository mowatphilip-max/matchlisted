-- Phase 1 of BUILD-BRIEF.md (Jan 2027 model): the fee ledger and the audit
-- trail. Additive only. The existing invoices table keeps running the
-- current upfront model; charges is the deferred-fee ledger that the later
-- phases move collection onto. Nothing writes charges yet — this migration
-- is the foundation the Phase 3 trigger engine lands on.

-- ---------------------------------------------------------------------------
-- Charges: every fee the platform is owed, from creation to settlement.
-- One row per obligation; status moves pending → due → (mandated | invoiced)
-- → paid, or written_off. BUILD-BRIEF.md §4.
-- ---------------------------------------------------------------------------
create type charge_type as enum
  ('home_report','withdrawal_fee','rightmove_addon','photography_addon',
   'buyer_fee','conveyancing_commission');
create type charge_status as enum
  ('pending','due','mandated','invoiced','paid','written_off');
create type charge_trigger as enum
  ('missives_concluded','withdrawn','listed_elsewhere','longstop','purchased');
create type collection_route as enum
  ('solicitor_mandate','card','stripe_checkout','invoice');

create table if not exists charges (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('listing','transaction')),
  subject_id uuid not null,
  payer_user_id uuid not null references profiles (id) on delete restrict,
  type charge_type not null,
  net_amount numeric(10,2) not null,
  vat_amount numeric(10,2) not null,
  gross_amount numeric(10,2) not null,
  status charge_status not null default 'pending',
  trigger charge_trigger,
  due_at timestamptz,
  collection_route collection_route,
  stripe_payment_intent text,
  mandate_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists charges_status_idx on charges (status, due_at);
create index if not exists charges_payer_idx on charges (payer_user_id);
create index if not exists charges_subject_idx on charges (subject_type, subject_id);

comment on table charges is
  'The fee ledger (BUILD-BRIEF.md §4). A charge is an obligation, not a '
  'payment: if the card fails the row moves to invoiced, never disappears.';

-- ---------------------------------------------------------------------------
-- Audit log: every Home Report download, status change and charge state
-- change. Append-only. BUILD-BRIEF.md §4: "You will need this if Trading
-- Standards ever ask."
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id text not null,
  meta jsonb not null default '{}',
  at timestamptz not null default now()
);

create index if not exists audit_log_subject_idx on audit_log (subject_type, subject_id, at desc);
create index if not exists audit_log_actor_idx on audit_log (actor_id, at desc);
create index if not exists audit_log_action_idx on audit_log (action, at desc);

comment on table audit_log is
  'Append-only. actor_id null = system action or a since-deleted account.';

-- Server-only access, like every other table: RLS on, no browser policies.
alter table charges enable row level security;
alter table audit_log enable row level security;

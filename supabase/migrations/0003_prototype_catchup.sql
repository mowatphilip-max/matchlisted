-- Catch-up migration: everything built after 0001 was written.
--
-- Adds the introduction pipeline, Home Report purchase orders, the email
-- outbox, match-alert dedupe, and the Quiet Seeker public-profile columns.
-- Additive only — no renames, no drops, no type changes.

-- ---------------------------------------------------------------------------
-- Quiet Seeker public profile (the anonymised card shown on /seekers)
-- ---------------------------------------------------------------------------
alter table seeker_briefs
  add column if not exists public_ref text unique,
  add column if not exists headline text,
  add column if not exists story text;

comment on column seeker_briefs.public_ref is
  'Anonymised reference shown publicly (e.g. QS-2104) — never the user id.';

-- ---------------------------------------------------------------------------
-- Per-user alert threshold: notify when a NEW pairing scores at least this %.
-- 0 = off. Null = the default (90).
-- ---------------------------------------------------------------------------
alter table profiles
  add column if not exists match_alert_pct smallint
    check (match_alert_pct between 0 and 100);

-- ---------------------------------------------------------------------------
-- Hush Homes: "I'll do the Home Report later" preview listings
-- ---------------------------------------------------------------------------
alter table hush_homes
  add column if not exists preview_listed boolean not null default false;

comment on column hush_homes.preview_listed is
  'Description + hazed photos only. Full go-live still requires a verified '
  'Home Report — enforce in the query, never in the UI alone.';

-- ---------------------------------------------------------------------------
-- Introductions: a seller raised their hand at a Quiet Seeker's profile.
-- Identity is never shared until the seeker accepts.
-- ---------------------------------------------------------------------------
create type introduction_status as enum ('new','offered','accepted','declined');

create table if not exists introductions (
  id uuid primary key default gen_random_uuid(),
  -- Seekers sourced from the Mowatt sheets have no account yet, so this is
  -- deliberately not a foreign key: it holds either a profile id or a
  -- 'mowatt:REF' marker for an offline approach.
  seeker_ref text not null,
  seller_id uuid not null references profiles (id) on delete cascade,
  home_id uuid references hush_homes (id) on delete set null,
  status introduction_status not null default 'new',
  created_at timestamptz not null default now(),
  offered_at timestamptz,
  responded_at timestamptz,
  unique (seeker_ref, seller_id)
);

create index if not exists introductions_seller_idx on introductions (seller_id);
create index if not exists introductions_status_idx on introductions (status);

-- ---------------------------------------------------------------------------
-- Purchase orders: raised when a seller pays for their Home Report.
-- The owner has paid us; the surveyor bills us against this number.
-- ---------------------------------------------------------------------------
create type po_status as enum ('instructed','billed','settled');
create type home_report_supplier as enum
  ('allied-surveyors','graham-sibbald','shepherd');

create table if not exists purchase_orders (
  id text primary key,                       -- human reference, e.g. 'PO-1042'
  home_id uuid not null references hush_homes (id) on delete restrict,
  seller_id uuid not null references profiles (id) on delete restrict,
  supplier home_report_supplier not null,
  estimated_value integer not null,          -- the owner's estimate the band came from
  base numeric(10,2) not null,               -- surveyor fee ex VAT (what they bill us)
  vat numeric(10,2) not null,
  margin numeric(10,2) not null,             -- our arrangement fee
  total numeric(10,2) not null,              -- paid by the owner
  invoice_id uuid references invoices (id) on delete set null,
  status po_status not null default 'instructed',
  created_at timestamptz not null default now(),
  billed_at timestamptz,
  settled_at timestamptz
);

create index if not exists purchase_orders_status_idx on purchase_orders (status);

-- Link the report back to its PO.
alter table hush_homes
  add column if not exists home_report_po_id text references purchase_orders (id);

-- ---------------------------------------------------------------------------
-- Email log: every message the platform sends (audit trail + admin outbox).
-- ---------------------------------------------------------------------------
create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  to_address text not null,
  subject text not null,
  body text not null,
  -- Populated once a real provider is wired: their message id, plus any
  -- delivery failure so a bounced receipt is visible rather than silent.
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists emails_created_idx on emails (created_at desc);

-- ---------------------------------------------------------------------------
-- Match-alert dedupe: one "possible match" alert per user per pairing, ever.
-- ---------------------------------------------------------------------------
create table if not exists sent_alerts (
  user_id uuid not null references profiles (id) on delete cascade,
  alert_key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, alert_key)
);

-- ---------------------------------------------------------------------------
-- Row Level Security. Locked by default: these tables are reached through
-- the server (which uses the secret key and bypasses RLS). No policies are
-- granted to browser clients, so a leaked publishable key reads nothing.
-- ---------------------------------------------------------------------------
alter table introductions enable row level security;
alter table purchase_orders enable row level security;
alter table emails enable row level security;
alter table sent_alerts enable row level security;

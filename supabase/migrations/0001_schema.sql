-- Matchlisted production schema. Mirrors src/lib/types.ts one-for-one so the
-- in-memory prototype store can be swapped for Supabase without model changes.
-- RLS is enabled on every table from day one (policies in 0002).

create extension if not exists "pgcrypto";

create type property_type as enum
  ('detached','semi-detached','terraced','bungalow','flat','cottage','townhouse');
create type garden_preference as enum ('no-preference','nice-to-have','must-have');
create type buying_position as enum
  ('cash-nothing-to-sell','cash-after-sale','mortgage-sold','mortgage-to-sell','first-time-buyer');
create type home_status as enum
  ('draft','pending-approval','live','under-offer','sold','withdrawn');
create type home_report_status as enum ('none','ordered','uploaded','verified');
create type offer_status as enum ('submitted','accepted','declined','countered');
create type invoice_kind as enum
  ('home-report','conveyancing-deposit','sourcing-fee','withdrawal-fee');
create type invoice_status as enum ('due','paid');
create type viewing_status as enum ('booked','completed','cancelled');
create type notification_kind as enum ('match','viewing','offer','system');

-- Profiles extend Supabase auth.users.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table seeker_briefs (
  user_id uuid primary key references profiles (id) on delete cascade,
  areas text[] not null default '{}',            -- lib/areas.ts ids
  budget_min integer not null check (budget_min >= 50000),
  budget_max integer not null check (budget_max <= 5000000),
  min_beds smallint not null default 1,
  min_baths smallint not null default 1,
  garden garden_preference not null default 'no-preference',
  types property_type[] not null default '{}',
  features text[] not null default '{}',
  position buying_position not null,
  notes text,
  -- contract signature (checkbox + audit trail)
  contract_typed_name text,
  contract_signed_at timestamptz,
  contract_ip text,
  contract_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_max >= budget_min)
);

create table hush_homes (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles (id) on delete cascade,
  headline text not null,
  area_id text not null,
  address_line text not null,                    -- private: seller + admin only
  price integer not null,
  beds smallint not null,
  baths smallint not null,
  type property_type not null,
  garden boolean not null default false,
  features text[] not null default '{}',
  description text not null default '',
  photos text[] not null default '{}',           -- storage paths
  floor_plan text,
  status home_status not null default 'draft',
  -- home report gate
  report_status home_report_status not null default 'none',
  report_supplier text,
  report_ordered_at timestamptz,
  report_invoice_id uuid,
  report_file text,                              -- private storage path
  report_uploaded_at timestamptz,
  report_verified_at timestamptz,
  -- seller contract
  contract_typed_name text,
  contract_signed_at timestamptz,
  contract_ip text,
  contract_version text,
  created_at timestamptz not null default now()
);
create index on hush_homes (status);
create index on hush_homes (seller_id);

create table lawyers (
  id uuid primary key default gen_random_uuid(),
  firm text not null,
  contact_name text not null,
  location text not null,
  fee_estimate integer not null,
  blurb text not null default ''
);

create table viewing_slots (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references hush_homes (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  booked_by uuid references profiles (id) on delete set null
);
create index on viewing_slots (home_id);

create table viewings (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references hush_homes (id) on delete cascade,
  seeker_id uuid not null references profiles (id) on delete cascade,
  slot_id uuid not null references viewing_slots (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status viewing_status not null default 'booked',
  feedback text,
  still_interested boolean
);
create index on viewings (home_id);
create index on viewings (seeker_id);

create table offers (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references hush_homes (id) on delete cascade,
  seeker_id uuid not null references profiles (id) on delete cascade,
  lawyer_id uuid not null references lawyers (id),
  amount integer not null,
  note text,
  status offer_status not null default 'submitted',
  counter_amount integer,
  history jsonb not null default '[]',
  missives_concluded_at timestamptz,
  created_at timestamptz not null default now()
);
create index on offers (home_id);
create index on offers (seeker_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  home_id uuid references hush_homes (id) on delete set null,
  offer_id uuid references offers (id) on delete set null,
  lawyer_id uuid references lawyers (id) on delete set null,
  kind invoice_kind not null,
  description text not null,
  net numeric(10,2) not null,
  vat numeric(10,2) not null,
  status invoice_status not null default 'due',
  stripe_checkout_id text,                       -- production: Stripe session
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on invoices (user_id, status);

create table saved_homes (
  seeker_id uuid not null references profiles (id) on delete cascade,
  home_id uuid not null references hush_homes (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (seeker_id, home_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  kind notification_kind not null,
  title text not null,
  body text not null,
  href text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index on notifications (user_id, read_at);

create table seen_matches (
  user_id uuid not null references profiles (id) on delete cascade,
  match_key text not null,                       -- home_id:seeker_id
  pct smallint not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, match_key)
);

create table match_weights (
  id boolean primary key default true check (id), -- single row
  location smallint not null default 35,
  price smallint not null default 25,
  beds smallint not null default 12,
  type smallint not null default 10,
  baths smallint not null default 8,
  garden smallint not null default 6,
  other smallint not null default 4
);
insert into match_weights default values;

-- RLS on from the start; policies land in 0002_rls.sql.
alter table profiles enable row level security;
alter table seeker_briefs enable row level security;
alter table hush_homes enable row level security;
alter table lawyers enable row level security;
alter table viewing_slots enable row level security;
alter table viewings enable row level security;
alter table offers enable row level security;
alter table invoices enable row level security;
alter table saved_homes enable row level security;
alter table notifications enable row level security;
alter table seen_matches enable row level security;
alter table match_weights enable row level security;

-- DECISIONS.md (10–11 Aug 2026) §§2, 3, 6: the two-ledger model.
--
-- 1. Withdrawal fee ABOLISHED (§3) — on withdrawal, listing elsewhere or the
--    longstop the seller owes the £580 Home Report charge and nothing else.
-- 2. conveyancing_commission leaves the consumer ledger entirely (§6): the
--    case pack fee is B2B, invoiced to the panel firm on pack_delivered,
--    and lives on the firm ledger below — never on charges.
-- 3. board_addon joins the consumer charge types (§2, £120 inc VAT).
-- 4. panel_firms + firm_invoices: consumer charges and firm invoices are
--    SEPARATE LEDGERS (§6 "Where the money sits in the data model"). The
--    charges table carries consumer-protection machinery (14-day notices,
--    cancellation rights, mandates); none of that applies to a business
--    invoice to a law firm. Do not merge them; charges.payer_user_id stays
--    NOT NULL and always references a user.

-- ---------------------------------------------------------------------------
-- charge_type: Postgres cannot drop an enum value, so the type is recreated.
-- Refuse loudly if any row still uses a value that is going away (none
-- should: only the seed script has ever written charges, and it writes only
-- home_report and buyer_fee).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from charges
    where type::text in ('withdrawal_fee', 'conveyancing_commission')
  ) then
    raise exception
      'charges rows exist with abolished types (withdrawal_fee / conveyancing_commission) — resolve them before applying 0010';
  end if;
end $$;

create type charge_type_v2 as enum
  ('home_report','rightmove_addon','photography_addon','board_addon',
   'buyer_fee');

alter table charges
  alter column type type charge_type_v2 using type::text::charge_type_v2;

drop type charge_type;
alter type charge_type_v2 rename to charge_type;

comment on column charges.type is
  'Consumer fee lines only (DECISIONS.md §6): the payer is always a user. '
  'B2B lines (case pack fee, panel seat) live on firm_invoices.';

-- ---------------------------------------------------------------------------
-- The conveyancing panel (DECISIONS.md §6). A seat is a fixed annual fee per
-- firm by territory — NEVER indexed to volume in-year, no bands, no true-up,
-- no rebate. Fixed for twelve months, renegotiated at renewal.
-- ---------------------------------------------------------------------------
create table if not exists panel_firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  territory text not null,
  seat_fee_annual numeric(10,2) not null,
  invoicing_schedule text not null default 'monthly'
    check (invoicing_schedule in ('monthly','quarterly','annual')),
  renewal_date date not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table panel_firms is
  'Conveyancing panel members (DECISIONS.md §6). Papered as two agreements — '
  'a services agreement (pack spec + SLA) and a panel licence (territory) — '
  'and never the word "commission".';

-- ---------------------------------------------------------------------------
-- The firm ledger: every fee a panel firm owes us. Two kinds only:
--   case_pack_fee — £150 + VAT per case, triggered by pack_delivered and
--                   NEVER by missives_concluded (a fee payable on completion
--                   is transaction commission however it is labelled, Law
--                   Society of Scotland rule D9.2). Never refundable on
--                   fall-through — contingency makes it commission again.
--                   Carries listing_id so per-listing revenue is reportable.
--   panel_seat    — the annual seat fee, invoiced on the firm's schedule.
--                   Never attached to a listing.
-- ---------------------------------------------------------------------------
create type firm_invoice_kind as enum ('case_pack_fee','panel_seat');
create type firm_invoice_status as enum ('due','invoiced','paid','written_off');

create table if not exists firm_invoices (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references panel_firms (id) on delete restrict,
  kind firm_invoice_kind not null,
  -- nullable by design: set on case_pack_fee rows, null on panel_seat rows
  listing_id uuid references hush_homes (id) on delete set null,
  net_amount numeric(10,2) not null,
  vat_amount numeric(10,2) not null,
  gross_amount numeric(10,2) not null,
  status firm_invoice_status not null default 'due',
  -- panel_seat rows: the invoicing period this row covers
  period_start date,
  period_end date,
  due_at timestamptz,
  invoiced_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint firm_invoices_pack_needs_listing
    check (kind <> 'panel_seat' or listing_id is null)
);

create index if not exists firm_invoices_firm_idx on firm_invoices (firm_id, status);
create index if not exists firm_invoices_listing_idx on firm_invoices (listing_id);

comment on table firm_invoices is
  'The firm-side ledger (DECISIONS.md §6 "Where the money sits"). B2B '
  'invoicing against a PanelFirm — separate from the consumer charges '
  'ledger, which carries consumer-protection machinery. Never merge them.';

-- Server-only access, like every other table: RLS on, no browser policies.
alter table panel_firms enable row level security;
alter table firm_invoices enable row level security;

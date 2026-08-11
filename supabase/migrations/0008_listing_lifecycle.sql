-- Phase 2 of BUILD-BRIEF.md: the full listing lifecycle.
--
--   draft -> shadow -> hr_ordered -> live -> under_offer -> sold
--                                      \-> expired (longstop)
--   any -> withdrawn
--
-- Additive only. New enum values sit alongside the existing ones; existing
-- rows keep their statuses. Visibility stays exactly as §3 demands: only
-- live / under-offer / sold are ever seeker-visible, so the new pre-live
-- statuses are covered by the existing data-layer scope automatically.

-- Postgres requires enum additions outside a transaction in older versions;
-- our migrate runner wraps files in one, which modern Postgres allows for
-- ADD VALUE as long as the new values are not used in the same transaction.
alter type home_status add value if not exists 'shadow';
alter type home_status add value if not exists 'hr_ordered';
alter type home_status add value if not exists 'expired';

alter table hush_homes
  -- The owner's own estimate of value, driving the Match Report and the
  -- Home Report fee band. askingPrice (price) stays the marketed figure.
  add column if not exists owner_estimate integer,
  add column if not exists go_live_at timestamptz,
  -- goLiveAt + longstop months (CONFIG). Null until live.
  add column if not exists expires_at timestamptz,
  -- The admin approval hard gate (§6.2). Pending until a human approves.
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','changes_requested')),
  add column if not exists approval_notes text;

comment on column hush_homes.approval_status is
  'Hard gate before go-live: an admin approves every listing against the '
  'minimum standards in CONFIG.listingStandards.';

-- The Match Report empty state captures an email, never fabricates a count
-- (§6.1). One row per address+area ask; alerted_at set once we have told
-- them a seeker now matches.
create table if not exists match_report_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  area_id text,
  town text,
  beds smallint,
  property_type text,
  value_band text,
  created_at timestamptz not null default now(),
  alerted_at timestamptz
);

create index if not exists match_report_leads_email_idx on match_report_leads (email);
alter table match_report_leads enable row level security;

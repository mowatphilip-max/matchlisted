-- Quiet Seeker card v2 fields: property type (closed icon set), readiness
-- badges, vetted seal, budget meter scale ends.
--
-- ADDITIVE ONLY: new nullable/defaulted columns, no renames, no drops, no
-- type changes — safe to run against a live shared database, and existing
-- rows backfill to the safe defaults ('any'-equivalent empty set, empty
-- readiness, vetted false).
--
-- NOTE (2026-07-27): no Supabase instance is connected yet — the live
-- "seeker table" is currently the two public Mowatt Google Sheets, which we
-- read server-side and never write. This migration keeps the future schema
-- in step with src/lib/types.ts for the day the data moves into Postgres.
-- It has NOT been run anywhere.

alter table seeker_briefs
  -- Multi-select from the closed set; empty array = "open to any".
  -- First element drives the card icon.
  add column if not exists property_types text[] not null default '{}',
  -- Readiness enum values (cash_buyer, chain_free, offer_accepted,
  -- solicitor_instructed, mortgage_aip, flexible_entry, deposit_ready,
  -- local, repeat_buyer).
  add column if not exists readiness text[] not null default '{}',
  -- Only ever set true after a real ID & funds check.
  add column if not exists vetted boolean not null default false,
  -- Budget meter scale ends; UI derives ±30% when null.
  add column if not exists budget_range_min numeric null,
  add column if not exists budget_range_max numeric null;

comment on column seeker_briefs.property_types is
  'Closed icon-set keys; empty = any. First element is the card icon.';
comment on column seeker_briefs.vetted is
  'A claim about a real check — never defaulted on, never hardcoded in UI.';

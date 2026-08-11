-- DECISIONS.md §0.5: conditional selling fix.
--
-- Requiring a buyer to appoint (and pay for) a solicitor before they can
-- submit an offer is conditional selling under the Estate Agents
-- (Undesirable Practices) (No. 2) Order 1991. A buyer must be able to submit
-- a Note of Offer with no lawyer appointed and nothing paid; a solicitor is
-- attached later, after acceptance, if and when the buyer chooses one.

alter table offers alter column lawyer_id drop not null;

comment on column offers.lawyer_id is
  'Nullable by design (DECISIONS.md §0.5): an offer never requires a lawyer. '
  'Set post-acceptance when the buyer chooses a solicitor.';

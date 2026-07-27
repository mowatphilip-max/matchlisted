-- Human-readable reference numbers.
--
-- Purchase orders (PO-1042) and Quiet Seeker refs (QS-2104) are quoted to
-- surveyors and shown on public cards, so they must be short, readable and
-- never reused. Postgres sequences guarantee that even with several people
-- acting at once — the old in-memory counter reset on every restart and
-- would happily hand two surveyors the same PO number.

create sequence if not exists purchase_order_seq start with 1001;
create sequence if not exists seeker_ref_seq start with 2300;

-- Next reference, formatted. Called by the app on insert.
create or replace function next_purchase_order_ref() returns text
  language sql volatile as $$
  select 'PO-' || nextval('purchase_order_seq')::text;
$$;

create or replace function next_seeker_ref() returns text
  language sql volatile as $$
  select 'QS-' || nextval('seeker_ref_seq')::text;
$$;

comment on sequence seeker_ref_seq is
  'Starts at 2300 to sit clear of the existing Mowatt sheet refs (20253+ '
  'in East Lothian, 202513+ in Edinburgh) so numbers can never collide.';

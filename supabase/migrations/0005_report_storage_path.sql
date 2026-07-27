-- Where the uploaded Home Report PDF actually lives.
--
-- Until now only the file NAME was recorded and the document itself was
-- discarded. This column points into the private 'home-reports' storage
-- bucket. It must never be sent to the browser — downloads go through a
-- server route that checks permission and mints a short-lived signed link.

alter table hush_homes
  add column if not exists report_storage_path text;

comment on column hush_homes.report_storage_path is
  'Path in the private home-reports bucket. Server-side only: a Home Report '
  'contains the full address, valuation and seller details.';

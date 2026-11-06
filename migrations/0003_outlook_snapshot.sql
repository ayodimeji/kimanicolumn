-- Last desk reading written by the background refresh.
-- One shared row. No personal data. A failed save must not blank the desk.
create table if not exists outlook_snapshot (
  id int primary key check (id = 1),
  payload jsonb not null,
  saved_at timestamptz not null default now()
);

-- Daily reference closes for instruments with no StockCharts series.
-- Unowned: one shared book for every visitor. No personal data.
create table if not exists spot_closes (
  instrument text not null,
  day date not null,
  close double precision not null check (close > 0),
  recorded_at timestamptz not null default now(),
  primary key (instrument, day)
);

import type { DailyClose, PairId } from "@/lib/fundamentals/model";

const KEEP_DAYS = 200;
const STORED: PairId[] = ["USDNGN", "PALM"];

export type StoredBook = {
  ok: boolean;
  series: Partial<Record<PairId, DailyClose[]>>;
};

type CloseRow = { instrument: string; day: string; close: number | string };

function emptyBook(): StoredBook {
  return { ok: false, series: {} };
}

function floorDay(now: Date): string {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - KEEP_DAYS);
  return cutoff.toISOString().slice(0, 10);
}

function asCloses(rows: CloseRow[]): Partial<Record<PairId, DailyClose[]>> {
  const series: Partial<Record<PairId, DailyClose[]>> = {};
  for (const row of rows) {
    const close = typeof row.close === "number" ? row.close : Number(row.close);
    if (!Number.isFinite(close) || close <= 0) continue;
    const id = row.instrument as PairId;
    const point = { date: String(row.day).slice(0, 10), close };
    const list = series[id] ?? [];
    list.push(point);
    series[id] = list;
  }
  for (const id of Object.keys(series) as PairId[]) {
    series[id]?.sort((a, b) => a.date.localeCompare(b.date));
  }
  return series;
}

/**
 * Save today's prints and return stored daily closes.
 * Persistence is Postgres (Neon when deployed, in-memory PGLite in preview).
 * Never touches the local disk: Vercel functions cannot mkdir a project folder.
 * Failures are returned, not thrown, so a store outage does not blank the desk.
 */
export async function syncCloses(
  prints: { id: PairId; price: number }[],
  now: Date,
): Promise<StoredBook> {
  const day = now.toISOString().slice(0, 10);
  const floor = floorDay(now);
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    for (const print of prints) {
      if (!Number.isFinite(print.price) || print.price <= 0) continue;
      await sql`
        insert into spot_closes (instrument, day, close)
        values (${print.id}, ${day}::date, ${print.price})
        on conflict (instrument, day)
        do update set close = excluded.close, recorded_at = now()
      `;
    }
    await sql`delete from spot_closes where day < ${floor}::date`;
    const rows = await sql<CloseRow>`
      select instrument, day::text as day, close
      from spot_closes
      where instrument in (${STORED[0]}, ${STORED[1]})
      order by day asc
    `;
    return { ok: true, series: asCloses(rows) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "history store failed";
    console.error("[spot-history]", message);
    return emptyBook();
  }
}

export function mergeCloses(base: DailyClose[], extra: DailyClose[]): DailyClose[] {
  const byDate = new Map<string, number>();
  for (const point of base) byDate.set(point.date, point.close);
  for (const point of extra) byDate.set(point.date, point.close);
  return [...byDate.entries()]
    .map(([date, close]) => ({ date, close }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

type YahooChart = {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators?: { quote?: { close?: (number | null)[] }[] };
    }[];
  };
};

export function dailyCloses(text: string): DailyClose[] {
  if (!text) return [];
  try {
    const payload = JSON.parse(text) as YahooChart;
    const result = payload.chart?.result?.[0];
    const times = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const points: DailyClose[] = [];
    for (let index = 0; index < times.length; index += 1) {
      const close = closes[index];
      const time = times[index];
      if (typeof close !== "number" || close <= 0 || typeof time !== "number") continue;
      points.push({ date: new Date(time * 1000).toISOString().slice(0, 10), close });
    }
    return points;
  } catch {
    return [];
  }
}

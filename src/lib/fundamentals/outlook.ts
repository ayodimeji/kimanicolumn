import { createServerFn } from "@tanstack/react-start";
import {
  ECONOMIES,
  ECONOMY_CODES,
  type EconomyCode,
  type CocoaBalance,
  type MarketBackdrop,
  type Outlook,
  type PairId,
  type PalmBoard,
  type RainWindow,
  type RawEconomy,
  type YearSeries,
  blendYears,
  buildOutlook,
  outlookWeights,
} from "@/lib/fundamentals/model";
import { dailyCloses, mergeCloses, syncCloses } from "@/lib/fundamentals/series";

const IMF = "https://www.imf.org/external/datamapper/api/v1";
const BIS =
  "https://stats.bis.org/api/v1/data/WS_CBPOL/D.US+XM+AU+GB+CH+CA?lastNObservations=500&format=csv";
const BTC_SPOT = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
const XAU_SPOT = "https://api.gold-api.com/price/XAU";
const XAG_SPOT = "https://api.gold-api.com/price/XAG";
const YIELD = "https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=3mo";
const DOLLAR = "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=3mo";
const CRUDE = "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=3mo";
const VIX = "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d";
const COCOA_PX = "https://query1.finance.yahoo.com/v8/finance/chart/CC%3DF?interval=1m&range=1d";
const NGN_PX = "https://query1.finance.yahoo.com/v8/finance/chart/NGN%3DX?interval=1d&range=6mo";
const MPOB_RELEASE = "https://price.mpob.gov.my/pdf/monthly/release";
const CBN_MPR = "https://www.cbn.gov.ng/api/GetAllMoneyMarketIndicators";
const BOC_TARGET = "https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/";
const RBA_TARGET = "https://www.rba.gov.au/cash-rate-target-overview.html";
const FED_TARGET = "https://www.federalreserve.gov/monetarypolicy/openmarket.htm";
const FED_CALENDAR = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
const ECB_TARGET = "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html";
const BOE_TARGET = "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate";
const SNB_TARGET = "https://www.snb.ch/en/";

const FX_LIVE: [PairId, string][] = [
  ["EURUSD", "EURUSD=X"],
  ["AUDUSD", "AUDUSD=X"],
  ["EURGBP", "EURGBP=X"],
  ["EURCHF", "EURCHF=X"],
  ["USDCAD", "USDCAD=X"],
  ["USDCHF", "USDCHF=X"],
];

const TTL_MS = 60 * 1000;

type Cache = { at: number; outlook: Outlook };
let cache: Cache | null = null;

type ImfPayload = { values?: Record<string, Record<string, Record<string, unknown>>> };

type YahooChart = {
  chart?: {
    result?: {
      meta?: { regularMarketPrice?: number; regularMarketTime?: number };
      timestamp?: number[];
      indicators?: { quote?: { close?: (number | null)[] }[] };
    }[];
  };
};

function quoteUrl(symbol: string): string {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
}

function readSeries(text: string): { last: number | null; change: number | null; time: number | null; opened: number | null } {
  if (!text) return { last: null, change: null, time: null, opened: null };
  try {
    const result = (JSON.parse(text) as YahooChart).chart?.result?.[0];
    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
    );
    const last = result?.meta?.regularMarketPrice;
    const end = typeof last === "number" && last > 0 ? last : (closes.at(-1) ?? null);
    const first = closes[0];
    const time = result?.meta?.regularMarketTime;
    return {
      last: end,
      change: first && end ? end / first - 1 : null,
      time: typeof time === "number" ? time : null,
      opened: first ?? null,
    };
  } catch {
    return { last: null, change: null, time: null, opened: null };
  }
}

function readPalmKernelRm(text: string): number | null {
  const start = text.indexOf("Pen. Malaysia Palm Kernel");
  const end = text.indexOf("Crude Palm Kernel Oil");
  if (start < 0 || end < start) return null;
  const average = text.slice(start, end).split("Pen. Malaysia Average").pop() ?? "";
  const tokens = (average.match(/[0-9,]+\.[0-9]+|NT/g) ?? []).slice(0, 4);
  const spot = tokens.find((token) => token !== "NT");
  if (!spot) return null;
  const rm = Number(spot.replace(/,/g, ""));
  // Ex-mill kernel is well below crude palm kernel oil. Reject an oil print.
  return rm >= 1000 && rm <= 4500 ? rm : null;
}

async function pdfText(bytes: Uint8Array): Promise<string> {
  const { inflateSync, inflateRawSync } = await import("node:zlib");
  const raw = Buffer.from(bytes).toString("latin1");
  const chunks: string[] = [];
  for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
    const body = Buffer.from(match[1], "latin1");
    for (const inflate of [inflateSync, inflateRawSync]) {
      try {
        chunks.push(inflate(body).toString("latin1"));
        break;
      } catch {
        // try the other flate form
      }
    }
  }
  const words: string[] = [];
  for (const block of chunks.join("\n").matchAll(/\[(.*?)\]\s*TJ/gs)) {
    let line = "";
    for (const bit of block[1].matchAll(/\((?:\\.|[^)])*\)/g)) {
      line += bit[0].slice(1, -1).replace(/\\\(/g, "(").replace(/\\\)/g, ")");
    }
    if (line.trim()) words.push(line.trim());
  }
  return words.join("\n");
}

function mpobMonths(now: Date): { year: number; month: number }[] {
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const months: { year: number; month: number }[] = [];
  for (let index = 0; index < 3; index += 1) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return months;
}

/** MPOB Peninsular Malaysia palm kernel ex-mill (the nut), in USD per tonne. Not palm oil and not palm kernel oil. */
async function fetchPalmKernel(now: Date): Promise<number | null> {
  try {
    let rm: number | null = null;
    for (const { year, month } of mpobMonths(now)) {
      const stamp = `${year}-${String(month).padStart(2, "0")}-01%2000:00:00`;
      const response = await fetch(`${MPOB_RELEASE}/${stamp}`, {
        headers: { "user-agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(18_000),
      });
      if (!response.ok) continue;
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes[0] !== 0x25) continue;
      rm = readPalmKernelRm(await pdfText(bytes));
      if (rm != null) break;
    }
    if (rm == null) return null;
    const ringgit = readSeries(await fetchText(quoteUrl("MYR=X"), "application/json")).last;
    if (ringgit == null || ringgit < 2 || ringgit > 8) return null;
    const usd = rm / ringgit;
    return usd > 200 && usd < 2000 ? usd : null;
  } catch {
    return null;
  }
}

async function fetchLiveFx(): Promise<{ spots: Partial<Record<PairId, number>>; fxDate: string | null }> {
  const rows = await Promise.all(
    FX_LIVE.map(async ([id, symbol]) => {
      try {
        const text = await fetchText(quoteUrl(symbol), "application/json");
        const quote = readSeries(text);
        return { id, price: quote.last, time: quote.time };
      } catch {
        return { id, price: null as number | null, time: null as number | null };
      }
    }),
  );
  const spots: Partial<Record<PairId, number>> = {};
  let newest = 0;
  for (const row of rows) {
    if (row.price != null) spots[row.id] = row.price;
    if (row.time != null && row.time > newest) newest = row.time;
  }
  return {
    spots,
    fxDate: newest > 0 ? new Date(newest * 1000).toISOString().slice(0, 10) : null,
  };
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function yearsAgo(date: Date, years: number): string {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() - years);
  return isoDay(next);
}

async function climateTotal(lat: number, lon: number, start: string, end: string): Promise<{ rain: number; temp: number } | null> {
  const text = await fetchText(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum,temperature_2m_mean`,
    "application/json",
  );
  const payload = JSON.parse(text) as {
    daily?: { precipitation_sum?: (number | null)[]; temperature_2m_mean?: (number | null)[] };
  };
  const rain = (payload.daily?.precipitation_sum ?? []).filter((value): value is number => typeof value === "number");
  const temp = (payload.daily?.temperature_2m_mean ?? []).filter((value): value is number => typeof value === "number");
  if (rain.length < 15) return null;
  return {
    rain: rain.reduce((sum, value) => sum + value, 0),
    temp: temp.length >= 15 ? temp.reduce((sum, value) => sum + value, 0) / temp.length : Number.NaN,
  };
}

async function rainWindow(points: { lat: number; lon: number }[], now: Date): Promise<RainWindow | null> {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  const recentStart = isoDay(start);
  const recentEnd = isoDay(end);
  const samples = await Promise.all(
    points.map(async (point) => {
      const [recent, priorYear, twoYears] = await Promise.all([
        climateTotal(point.lat, point.lon, recentStart, recentEnd).catch(() => null),
        climateTotal(point.lat, point.lon, yearsAgo(start, 1), yearsAgo(end, 1)).catch(() => null),
        climateTotal(point.lat, point.lon, yearsAgo(start, 2), yearsAgo(end, 2)).catch(() => null),
      ]);
      const priorRain = [priorYear?.rain, twoYears?.rain].filter((value): value is number => value != null);
      const priorTemp = [priorYear?.temp, twoYears?.temp].filter((value): value is number => value != null && Number.isFinite(value));
      if (recent == null || priorRain.length === 0) return null;
      return {
        recent: recent.rain,
        normal: priorRain.reduce((sum, value) => sum + value, 0) / priorRain.length,
        recentTemp: Number.isFinite(recent.temp) ? recent.temp : null,
        normalTemp: priorTemp.length > 0 ? priorTemp.reduce((sum, value) => sum + value, 0) / priorTemp.length : null,
      };
    }),
  );
  const ready = samples.filter((sample): sample is RainWindow => sample != null);
  if (ready.length === 0) return null;
  const temps = ready.filter((sample) => sample.recentTemp != null && sample.normalTemp != null);
  return {
    recent: ready.reduce((sum, sample) => sum + sample.recent, 0) / ready.length,
    normal: ready.reduce((sum, sample) => sum + sample.normal, 0) / ready.length,
    recentTemp: temps.length > 0 ? temps.reduce((sum, sample) => sum + (sample.recentTemp ?? 0), 0) / temps.length : null,
    normalTemp: temps.length > 0 ? temps.reduce((sum, sample) => sum + (sample.normalTemp ?? 0), 0) / temps.length : null,
  };
}

function readAmount(text: string): number | null {
  if (!text) return null;
  try {
    const payload = JSON.parse(text) as { data?: { amount?: string }; price?: number };
    const amount = payload.data?.amount != null ? Number(payload.data.amount) : payload.price;
    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) return amount;
  } catch {
    return null;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function seriesFrom(payload: ImfPayload, indicator: string, imfCode: string): YearSeries {
  const row = payload.values?.[indicator]?.[imfCode];
  if (!row) throw new Error(`The IMF outlook feed has no ${indicator} series for ${imfCode}.`);
  const series: YearSeries = {};
  for (const [year, value] of Object.entries(row)) series[year] = asNumber(value);
  return series;
}

async function fetchText(url: string, accept: string): Promise<string> {
  let last = "the feed did not respond";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept,
          "user-agent":
            attempt === 0
              ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
              : "curl/8.5.0",
        },
        signal: AbortSignal.timeout(18_000),
      });
      if (!response.ok) {
        last = `status ${response.status}`;
        continue;
      }
      return await response.text();
    } catch (error) {
      last = error instanceof Error ? error.message : "network error";
    }
  }
  throw new Error(last);
}

/** BIS reprints the previous overnight target for a few sessions after a decision. */
async function fetchCanadaTarget(): Promise<{ rate: number; date: string } | null> {
  try {
    const html = await fetchText(BOC_TARGET, "text/html");
    const match = /data-date="(\d{4}-\d{2}-\d{2})"[\s\S]*?<td>\s*([0-9]+(?:\.[0-9]+)?)/.exec(html);
    if (!match) return null;
    const rate = Number(match[2]);
    if (!Number.isFinite(rate)) return null;
    return { date: match[1], rate };
  } catch {
    return null;
  }
}

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

async function fetchAustraliaTarget(): Promise<{ rate: number; date: string } | null> {
  try {
    const html = await fetchText(RBA_TARGET, "text/html");
    const rateMatch = /landing-page-chart-statistic-value">\s*([0-9]+(?:\.[0-9]+)?)/.exec(html);
    const dateMatch = /Effective date\s*([0-9]{1,2})\s+([A-Za-z]+)\s+([0-9]{4})/.exec(html);
    if (!rateMatch || !dateMatch) return null;
    const month = MONTHS[dateMatch[2].toLowerCase()];
    const rate = Number(rateMatch[1]);
    if (!month || !Number.isFinite(rate)) return null;
    const date = `${dateMatch[3]}-${String(month).padStart(2, "0")}-${String(Number(dateMatch[1])).padStart(2, "0")}`;
    return { rate, date };
  } catch {
    return null;
  }
}

const MONTHS3: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function isoDate(year: string, monthName: string, day: string): string | null {
  const month = MONTHS[monthName.toLowerCase()] ?? MONTHS3[monthName.slice(0, 3).toLowerCase()];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

/** Midpoint of a Fed target range. 3.75-4.00 is the same 3.875 BIS prints. */
function rangeMidpoint(level: string): number | null {
  const parts = level.split("-").map((part) => Number(part));
  if (parts.length === 0 || parts.some((part) => !Number.isFinite(part))) return null;
  return Math.round((parts.reduce((sum, part) => sum + part, 0) / parts.length) * 1000) / 1000;
}

async function fetchFedTarget(): Promise<{ rate: number; date: string; level: string } | null> {
  try {
    const html = await fetchText(FED_TARGET, "text/html");
    const years = [...html.matchAll(/<h4>(20\d{2})<\/h4>/g)];
    if (years.length === 0) return null;
    const section = html.slice(years[0].index ?? 0, years[1]?.index ?? html.length);
    const rows = [
      ...section.matchAll(
        /scope="row">([A-Za-z]+)\s+(\d{1,2})<\/td>[\s\S]*?([0-9]+\.[0-9]+(?:-[0-9]+\.[0-9]+)?)<\/td>\s*<\/tr>/g,
      ),
    ];
    const row = rows.at(-1);
    if (!row) return null;
    const date = isoDate(years[0][1], row[1], row[2]);
    const rate = rangeMidpoint(row[3]);
    if (!date || rate == null) return null;
    return { rate, date, level: row[3] };
  } catch {
    return null;
  }
}

/** Latest published FOMC statement. A meeting with no statement is not invented. */
async function fetchFedMeeting(now: Date): Promise<string | null> {
  try {
    const today = now.toISOString().slice(0, 10).replaceAll("-", "");
    const html = await fetchText(FED_CALENDAR, "text/html");
    const dates = [...html.matchAll(/\/newsevents\/pressreleases\/monetary(20\d{6})a\.htm/g)]
      .map((match) => match[1])
      .filter((date) => date <= today)
      .sort();
    const latest = dates.at(-1);
    if (!latest) return null;
    return `${latest.slice(0, 4)}-${latest.slice(4, 6)}-${latest.slice(6, 8)}`;
  } catch {
    return null;
  }
}

/** Latest "Monetary policy decisions" entry. Accounts and other items are ignored. */
async function fetchEcbMeeting(now: Date): Promise<string | null> {
  const today = now.toISOString().slice(0, 10);
  const years = [now.getUTCFullYear(), now.getUTCFullYear() - 1];
  for (const year of years) {
    try {
      const html = await fetchText(
        `https://www.ecb.europa.eu/press/govcdec/mopo/${year}/html/index_include.en.html`,
        "text/html",
      );
      const dates = [
        ...html.matchAll(
          /<dt isoDate="(\d{4}-\d{2}-\d{2})">[\s\S]*?<\/dt>\s*<dd>[\s\S]*?<div class="title"><a [^>]*>\s*([^<]+)<\/a>/g,
        ),
      ]
        .filter((match) => match[2].trim() === "Monetary policy decisions" && match[1] <= today)
        .map((match) => match[1])
        .sort();
      const latest = dates.at(-1);
      if (latest) return latest;
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchUkTarget(): Promise<{ rate: number; date: string } | null> {
  try {
    const html = await fetchText(BOE_TARGET, "text/html");
    const rateMatch = /Current Bank Rate[\s\S]{0,240}?stat-figure">\s*([0-9]+(?:\.[0-9]+)?)%/.exec(html);
    const dateMatch = /Published on\s+([0-9]{1,2})\s+([A-Za-z]+)\s+([0-9]{4})/.exec(html);
    if (!rateMatch || !dateMatch) return null;
    const rate = Number(rateMatch[1]);
    const date = isoDate(dateMatch[3], dateMatch[2], dateMatch[1]);
    if (!date || !Number.isFinite(rate)) return null;
    return { rate, date };
  } catch {
    return null;
  }
}

/** SNB policy rate only. SARON is the overnight market rate and is not the policy setting. */
async function fetchSnbTarget(): Promise<{ rate: number; date: string } | null> {
  try {
    const html = await fetchText(SNB_TARGET, "text/html");
    const match =
      /SNB policy rate[\s\S]{0,700}?h-typo-t3">\s*(-?[0-9]+(?:\.[0-9]+)?)%[\s\S]{0,700}?h-typo-tiny">(\d{2})\.(\d{2})\.(\d{4})/.exec(
        html,
      );
    if (!match) return null;
    const rate = Number(match[1]);
    if (!Number.isFinite(rate)) return null;
    return { rate, date: `${match[4]}-${match[3]}-${match[2]}` };
  } catch {
    return null;
  }
}

async function fetchEcbTarget(): Promise<{ rate: number; date: string } | null> {
  try {
    const html = await fetchText(ECB_TARGET, "text/html");
    const rows = [
      ...html.matchAll(
        /<td class="number">(?:<strong>(20\d{2})<\/strong>|&nbsp;)?<\/td>\s*<td class="number">(\d{1,2})\s+([A-Za-z]{3})\.?<\/td>\s*<td class="number">([0-9]+\.[0-9]+)<\/td>/g,
      ),
    ];
    let year: string | null = null;
    for (const row of rows) {
      if (row[1]) year = row[1];
      if (!year) continue;
      const date = isoDate(year, row[3], row[2]);
      const rate = Number(row[4]);
      if (!date || !Number.isFinite(rate)) continue;
      return { rate, date };
    }
    return null;
  } catch {
    return null;
  }
}

function stepRate(points: { date: string; rate: number }[]): {
  rate: number;
  date: string;
  previous: number | null;
  changed: string | null;
} {
  const ready = points.filter((point) => Number.isFinite(point.rate));
  ready.sort((a, b) => a.date.localeCompare(b.date));
  const latest = ready[ready.length - 1];
  if (!latest) throw new Error("No policy observations.");
  let start = ready.length - 1;
  while (start > 0 && Math.abs(ready[start - 1].rate - latest.rate) < 0.001) start -= 1;
  const prior = start > 0 ? ready[start - 1] : null;
  if (!prior) return { rate: latest.rate, date: latest.date, previous: null, changed: null };
  return { rate: latest.rate, date: latest.date, previous: prior.rate, changed: ready[start].date };
}

function parseNairaPolicy(text: string): { rate: number; date: string; previous: number | null; changed: string | null } {
  const rows = JSON.parse(text) as { tyear?: number; tmonth?: number; mpr?: string }[];
  const points = rows
    .filter((row) => typeof row.tyear === "number" && typeof row.tmonth === "number" && Number(row.mpr) > 0)
    .map((row) => ({
      date: new Date(Date.UTC(row.tyear!, row.tmonth!, 0)).toISOString().slice(0, 10),
      rate: Number(row.mpr),
    }));
  if (points.length === 0) throw new Error("CBN policy-rate feed has no MPR.");
  return stepRate(points);
}

function parseBis(csv: string): Map<string, { rate: number; date: string; previous: number | null; changed: string | null }> {
  const rows = new Map<string, { date: string; rate: number }[]>();
  for (const line of csv.split(/\r?\n/)) {
    const area = /^D,([A-Z]{2}),/.exec(line);
    if (!area) continue;
    const last = [...line.matchAll(/,(\d{4}-\d{2}-\d{2}),(-?\d+(?:\.\d+)?),/g)].at(-1);
    if (!last) continue;
    const list = rows.get(area[1]) ?? [];
    list.push({ date: last[1], rate: Number(last[2]) });
    rows.set(area[1], list);
  }
  const out = new Map<string, { rate: number; date: string; previous: number | null; changed: string | null }>();
  for (const [area, list] of rows) out.set(area, stepRate(list));
  return out;
}

type SlowSnap = {
  at: number;
  failed: boolean;
  economies: RawEconomy[];
  chinaGrowth: number | null;
  chinaPrevious: number | null;
  cocoaRain: RainWindow | null;
  palmRain: RainWindow | null;
  cocoaBalance: CocoaBalance | null;
  palmBoard: PalmBoard | null;
};

const SLOW_MS = 60 * 60 * 1000;
let slow: SlowSnap | null = null;

type FastMarket = {
  nominalYield: number | null;
  yieldChange: number | null;
  yieldAsOf: string | null;
  dollarChange: number | null;
  crudeChange: number | null;
  vix: number | null;
};
let lastFast: FastMarket | null = null;
let lastFastAt = 0;

function asDay(time: number | null): string | null {
  return time == null ? null : new Date(time * 1000).toISOString().slice(0, 10);
}

function signedMove(verb: string, percent: number): number {
  return /fell|decreas/i.test(verb) ? -percent : percent;
}

async function fetchCocoaBalance(now: Date): Promise<CocoaBalance | null> {
  const months = ["november", "august", "may", "february"];
  const years = [now.getUTCFullYear(), now.getUTCFullYear() - 1];
  for (const year of years) {
    for (const month of months) {
      try {
        const response = await fetch(`https://www.icco.org/${month}-${year}-quarterly-bulletin-of-cocoa-statistics/`, {
          headers: { accept: "text/html", "user-agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(18_000),
        });
        if (!response.ok) continue;
        const html = await response.text();
        const text = html
          .replace(/<[^>]+>/g, " ")
          .replace(/&#8211;|&ndash;/g, "-")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ");
        const production = /World Gross Production (increased|decreased|fell|rose) by ([0-9.]+)% year-on-year to ([0-9.]+) million/i.exec(text);
        const grindings = /World Grindings (increased|decreased|fell|rose) by ([0-9.]+)% year-on-year to ([0-9.]+) million/i.exec(text);
        const stocks = /End-of-season stocks (increased|decreased|fell|rose) by (?:almost |about |nearly )?([0-9.]+)%/i.exec(text);
        const withheld = /withheld production and grindings data for the (\d{4}\/\d{2}) season/i.exec(text);
        const published = /However, data for the (\d{4}\/\d{2}) season/i.exec(text);
        const season = published?.[1] ?? /data for the (\d{4}\/\d{2}) season/i.exec(text)?.[1];
        if (!production || !grindings || !stocks || !season) continue;
        if (withheld && season === withheld[1]) continue;
        return {
          season,
          productionYoY: signedMove(production[1], Number(production[2]) / 100),
          grindingsYoY: signedMove(grindings[1], Number(grindings[2]) / 100),
          stocksYoY: signedMove(stocks[1], Number(stocks[2]) / 100),
          note: withheld
            ? `ICCO ${month} ${year} bulletin. ${withheld[1]} production and grindings were withheld, so this is the published ${season} balance.`
            : `ICCO ${month} ${year} bulletin, ${season} season.`,
        };
      } catch {
        continue;
      }
    }
  }
  return null;
}

async function fetchPalmBoard(now: Date): Promise<PalmBoard | null> {
  const years = [now.getUTCFullYear(), now.getUTCFullYear() - 1];
  for (const year of years) {
    try {
      const response = await fetch(`https://bepi.mpob.gov.my/stat/web_report1.php?val=${year}84`, {
        headers: { accept: "text/html", "user-agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(18_000),
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (!html.includes("Palm Kernel")) continue;
      const cells = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) =>
        match[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(),
      );
      const number = /^[\d,]+(?:\.\d+)?$/;
      let section = "";
      const found = new Map<string, number[]>();
      for (let index = 0; index < cells.length; index += 1) {
        const cell = cells[index];
        if (/PRODUCTION|CLOSING STOCK|EXPORT|IMPORT|PRICE/.test(cell)) {
          section = cell;
          continue;
        }
        if (!cell || cell.startsWith("(") || cell.startsWith("Explanatory") || /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(cell)) continue;
        const values: number[] = [];
        let cursor = index + 1;
        while (cursor < cells.length && (cells[cursor] === "" || number.test(cells[cursor]))) {
          if (cells[cursor]) values.push(Number(cells[cursor].replace(/,/g, "")));
          cursor += 1;
        }
        if (values.length >= 3) found.set(`${section}|${cell}`, values);
        index = cursor - 1;
      }
      const gap = (key: string) => {
        const values = found.get(key);
        if (!values || values.length < 3) return null;
        const last = values[values.length - 1];
        const prior = values.slice(0, -1);
        const average = prior.reduce((sum, value) => sum + value, 0) / prior.length;
        return average > 0 ? last / average - 1 : null;
      };
      const kernelStock = gap("CLOSING STOCK (TONNES)|Palm Kernel");
      const kernelOutput = gap("PRODUCTION (TONNES)|Palm Kernel");
      const oilPalmOutput = gap("PRODUCTION (TONNES)|Crude Palm Oil");
      const kernelOilExports = gap("EXPORT (TONNES)|Palm Kernel Oil");
      if (kernelStock == null || kernelOutput == null || oilPalmOutput == null || kernelOilExports == null) continue;
      const count = found.get("PRODUCTION (TONNES)|Palm Kernel")?.length ?? 0;
      return { kernelStock, kernelOutput, oilPalmOutput, kernelOilExports, month: `${year}, ${count} months` };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchSlow(now: Date): Promise<Omit<SlowSnap, "at" | "failed">> {
  const [gdpText, cpiText, caText, lurText, cocoaRain, palmRain, cocoaBalance, palmBoard] = await Promise.all([
    fetchText(`${IMF}/NGDP_RPCH`, "application/json").catch((error: Error) => {
      throw new Error(`IMF growth feed unavailable (${error.message}).`);
    }),
    fetchText(`${IMF}/PCPIPCH`, "application/json").catch((error: Error) => {
      throw new Error(`IMF inflation feed unavailable (${error.message}).`);
    }),
    fetchText(`${IMF}/BCA_NGDPD`, "application/json").catch((error: Error) => {
      throw new Error(`IMF external-balance feed unavailable (${error.message}).`);
    }),
    fetchText(`${IMF}/LUR`, "application/json").catch((error: Error) => {
      throw new Error(`IMF unemployment feed unavailable (${error.message}).`);
    }),
    rainWindow(
      [
        { lat: 5.79, lon: -6.61 },
        { lat: 6.69, lon: -1.62 },
      ],
      now,
    ).catch(() => null),
    rainWindow(
      [
        { lat: 1.86, lon: 103 },
        { lat: 0.51, lon: 101.45 },
      ],
      now,
    ).catch(() => null),
    fetchCocoaBalance(now),
    fetchPalmBoard(now),
  ]);

  const gdp = JSON.parse(gdpText) as ImfPayload;
  const cpi = JSON.parse(cpiText) as ImfPayload;
  const ca = JSON.parse(caText) as ImfPayload;
  const lur = JSON.parse(lurText) as ImfPayload;
  const economies: RawEconomy[] = ECONOMY_CODES.map((code: EconomyCode) => {
    const meta = ECONOMIES[code];
    let unemploymentByYear: YearSeries = {};
    try {
      unemploymentByYear = seriesFrom(lur, "LUR", meta.imf);
    } catch {
      unemploymentByYear = {};
    }
    return {
      code,
      policyRate: 0,
      policyAsOf: "",
      policyPrevious: null,
      policyChanged: null,
      policySource: "",
      policyLevel: null,
      policyMeeting: null,
      policyMeetingHeld: null,
      growthByYear: seriesFrom(gdp, "NGDP_RPCH", meta.imf),
      inflationByYear: seriesFrom(cpi, "PCPIPCH", meta.imf),
      currentAccountByYear: seriesFrom(ca, "BCA_NGDPD", meta.imf),
      unemploymentByYear,
    };
  });

  const weights = outlookWeights(now);
  let chinaGrowth: number | null = null;
  let chinaPrevious: number | null = null;
  try {
    const china = seriesFrom(gdp, "NGDP_RPCH", "CHN");
    chinaGrowth = blendYears(china, weights.year0, weights.year1, weights.weight0, weights.weight1);
    const prior = china[String(weights.year0 - 1)];
    chinaPrevious = typeof prior === "number" && Number.isFinite(prior) ? prior : null;
  } catch {
    chinaGrowth = null;
    chinaPrevious = null;
  }
  return { economies, chinaGrowth, chinaPrevious, cocoaRain, palmRain, cocoaBalance, palmBoard };
}

async function loadSlow(now: Date): Promise<SlowSnap> {
  if (slow && !slow.failed && Date.now() - slow.at < SLOW_MS) return slow;
  try {
    const next = await fetchSlow(now);
    slow = { at: Date.now(), failed: false, ...next };
    return slow;
  } catch (error) {
    if (slow) {
      slow = { ...slow, failed: true };
      return slow;
    }
    throw error;
  }
}

type PolicyFields = Pick<
  RawEconomy,
  | "policyRate"
  | "policyAsOf"
  | "policyPrevious"
  | "policyChanged"
  | "policySource"
  | "policyLevel"
  | "policyMeeting"
  | "policyMeetingHeld"
>;
type PolicySnap = { at: number; fellBack: boolean; rates: Record<EconomyCode, PolicyFields> };
let policySnap: PolicySnap | null = null;
let policyFlight: Promise<PolicySnap> | null = null;

function preferOfficial(
  bis: { rate: number; date: string; previous: number | null; changed: string | null } | null,
  official: { rate: number; date: string } | null,
  source: string,
): PolicyFields | null {
  if (!official) {
    if (!bis) return null;
    return {
      policyRate: bis.rate,
      policyAsOf: bis.date,
      policyPrevious: bis.previous,
      policyChanged: bis.changed,
      policySource: "BIS",
      policyLevel: null,
      policyMeeting: null,
      policyMeetingHeld: null,
    };
  }
  const same = bis != null && Math.abs(official.rate - bis.rate) < 0.001;
  return {
    policyRate: official.rate,
    policyAsOf: official.date,
    policyPrevious: same && bis ? bis.previous : bis ? bis.rate : null,
    policyChanged: same && bis?.changed ? bis.changed : official.date,
    policySource: source,
    policyLevel: null,
    policyMeeting: null,
    policyMeetingHeld: null,
  };
}

function withMeeting(fields: PolicyFields, meeting: string | null, today: string, level: string | null): PolicyFields {
  const change = fields.policyChanged ?? fields.policyAsOf;
  let policyMeeting: string | null = null;
  let policyMeetingHeld: boolean | null = null;
  if (meeting && meeting <= today && change && meeting >= change) {
    policyMeeting = meeting;
    policyMeetingHeld = meeting > fields.policyAsOf;
  } else if (
    !meeting &&
    (fields.policySource === "Federal Reserve" ||
      fields.policySource === "ECB" ||
      fields.policySource === "RBA" ||
      fields.policySource === "Bank of Canada") &&
    fields.policyAsOf
  ) {
    policyMeeting = fields.policyAsOf;
    policyMeetingHeld = fields.policyChanged != null && fields.policyAsOf > fields.policyChanged;
  }
  return { ...fields, policyLevel: level, policyMeeting, policyMeetingHeld };
}

async function fetchPolicy(now: Date): Promise<PolicySnap> {
  const today = now.toISOString().slice(0, 10);
  const [bisText, fed, ecb, canada, australia, uk, swiss, cbnText, fedMeeting, ecbMeeting] = await Promise.all([
    fetchText(BIS, "text/csv").catch(() => ""),
    fetchFedTarget(),
    fetchEcbTarget(),
    fetchCanadaTarget(),
    fetchAustraliaTarget(),
    fetchUkTarget(),
    fetchSnbTarget(),
    fetchText(CBN_MPR, "application/json").catch(() => ""),
    fetchFedMeeting(now),
    fetchEcbMeeting(now),
  ]);
  const bis = bisText ? parseBis(bisText) : new Map();
  let naira: { rate: number; date: string; previous: number | null; changed: string | null } | null = null;
  if (cbnText) {
    try {
      naira = parseNairaPolicy(cbnText);
    } catch {
      naira = null;
    }
  }
  const official: Partial<Record<EconomyCode, { rate: number; date: string; source: string } | null>> = {
    USD: fed ? { rate: fed.rate, date: fed.date, source: "Federal Reserve" } : null,
    EUR: ecb ? { ...ecb, source: "ECB" } : null,
    GBP: uk ? { ...uk, source: "Bank of England" } : null,
    CHF: swiss ? { ...swiss, source: "SNB" } : null,
    CAD: canada ? { ...canada, source: "Bank of Canada" } : null,
    AUD: australia ? { ...australia, source: "RBA" } : null,
  };
  let fellBack = false;
  const rates = {} as Record<EconomyCode, PolicyFields>;
  for (const code of ECONOMY_CODES) {
    const previous = policySnap?.rates[code];
    let chosen: PolicyFields | null = null;
    if (code === "NGN") {
      chosen = naira
        ? {
            policyRate: naira.rate,
            policyAsOf: naira.date,
            policyPrevious: naira.previous,
            policyChanged: naira.changed,
            policySource: "CBN",
            policyLevel: null,
            policyMeeting: null,
            policyMeetingHeld: null,
          }
        : null;
    } else {
      const meta = ECONOMIES[code];
      const page = official[code] ?? null;
      chosen = preferOfficial(bis.get(meta.bis) ?? null, page, page?.source ?? "BIS");
    }
    if (chosen) {
      const gb = bis.get("GB");
      const ukDecision = uk && (!gb || Math.abs(uk.rate - gb.rate) >= 0.001) ? uk.date : null;
      const meeting = code === "USD" ? fedMeeting : code === "EUR" ? ecbMeeting : code === "GBP" ? ukDecision : null;
      const level =
        code === "USD" && chosen.policySource === "Federal Reserve"
          ? (fed?.level ?? null)
          : code === "EUR" && chosen.policySource === "ECB"
            ? ecb
              ? ecb.rate.toFixed(2)
              : null
            : null;
      rates[code] = withMeeting(chosen, meeting, today, level);
    } else if (previous) {
      rates[code] = previous;
      fellBack = true;
    } else {
      throw new Error(`No policy rate for ${code}.`);
    }
  }
  return { at: fellBack && policySnap ? policySnap.at : Date.now(), fellBack, rates };
}

async function loadPolicy(): Promise<PolicySnap> {
  if (policyFlight) return policyFlight;
  const run = (async () => {
    try {
      return await fetchPolicy(new Date());
    } catch (error) {
      if (policySnap) return { ...policySnap, fellBack: true };
      throw error;
    }
  })();
  policyFlight = run;
  try {
    const next = await run;
    policySnap = next;
    return next;
  } finally {
    if (policyFlight === run) policyFlight = null;
  }
}

async function loadOutlook(now: Date): Promise<Outlook> {
  const [official, policy, fxLive, btcText, xauText, xagText, yieldText, dollarText, crudeText, vixText, cocoaText, palmUsd, ngnText] =
    await Promise.all([
      loadSlow(now),
      loadPolicy(),
      fetchLiveFx(),
      fetchText(BTC_SPOT, "application/json").catch(() => ""),
      fetchText(XAU_SPOT, "application/json").catch(() => ""),
      fetchText(XAG_SPOT, "application/json").catch(() => ""),
      fetchText(YIELD, "application/json").catch(() => ""),
      fetchText(DOLLAR, "application/json").catch(() => ""),
      fetchText(CRUDE, "application/json").catch(() => ""),
      fetchText(VIX, "application/json").catch(() => ""),
      fetchText(COCOA_PX, "application/json").catch(() => ""),
      fetchPalmKernel(now),
      fetchText(NGN_PX, "application/json").catch(() => ""),
    ]);

  const spots: Partial<Record<PairId, number | null>> = { ...fxLive.spots };
  const fxDate = fxLive.fxDate;
  const btc = readAmount(btcText);
  const xau = readAmount(xauText);
  const xag = readAmount(xagText);
  if (btc != null) spots.BTCUSD = btc;
  if (xau != null) spots.XAUUSD = xau;
  if (xag != null) spots.XAGUSD = xag;
  const cocoa = readSeries(cocoaText).last;
  if (cocoa != null) spots.COCOA = cocoa;
  if (palmUsd != null) spots.PALM = palmUsd;
  const ngn = readSeries(ngnText).last;
  if (ngn != null) spots.USDNGN = ngn;
  const prints: { id: PairId; price: number }[] = [];
  if (spots.USDNGN != null) prints.push({ id: "USDNGN", price: spots.USDNGN });
  if (spots.PALM != null) prints.push({ id: "PALM", price: spots.PALM });
  const stored = await syncCloses(prints, now);
  const history = stored.ok
    ? { ok: true as const, note: null }
    : {
        ok: false as const,
        note: "Daily closes were not saved. The price-history database did not respond, so the palm kernel line is left blank. USD/NGN still uses the Yahoo six-month series when that feed answers. No prices are filled in.",
      };

  const yieldSeries = readSeries(yieldText);
  const dollarSeries = readSeries(dollarText);
  const crudeSeries = readSeries(crudeText);
  const vixSeries = readSeries(vixText);
  let marketStale = false;
  const freshMarket: FastMarket = {
    nominalYield: yieldSeries.last,
    yieldChange:
      yieldSeries.last != null && yieldSeries.opened != null ? yieldSeries.last - yieldSeries.opened : null,
    yieldAsOf: asDay(yieldSeries.time),
    dollarChange: dollarSeries.change,
    crudeChange: crudeSeries.change,
    vix: vixSeries.last,
  };
  const market: FastMarket = {
    nominalYield: freshMarket.nominalYield ?? lastFast?.nominalYield ?? null,
    yieldChange: freshMarket.yieldChange ?? lastFast?.yieldChange ?? null,
    yieldAsOf: freshMarket.yieldAsOf ?? lastFast?.yieldAsOf ?? null,
    dollarChange: freshMarket.dollarChange ?? lastFast?.dollarChange ?? null,
    crudeChange: freshMarket.crudeChange ?? lastFast?.crudeChange ?? null,
    vix: freshMarket.vix ?? lastFast?.vix ?? null,
  };
  if (
    (freshMarket.nominalYield == null && lastFast?.nominalYield != null) ||
    (freshMarket.dollarChange == null && lastFast?.dollarChange != null) ||
    (freshMarket.crudeChange == null && lastFast?.crudeChange != null) ||
    (freshMarket.vix == null && lastFast?.vix != null)
  ) {
    marketStale = true;
  }
  if (freshMarket.nominalYield != null || freshMarket.dollarChange != null || freshMarket.crudeChange != null) {
    lastFast = market;
    if (!marketStale) lastFastAt = now.getTime();
  }
  const backdrop: MarketBackdrop = {
    nominalYield: market.nominalYield,
    yieldChange: market.yieldChange,
    yieldAsOf: market.yieldAsOf,
    dollarChange: market.dollarChange,
    chinaGrowth: official.chinaGrowth,
    chinaPrevious: official.chinaPrevious,
    cocoaRain: official.cocoaRain,
    palmRain: official.palmRain,
    cocoaBalance: official.cocoaBalance,
    palmBoard: official.palmBoard,
    crudeChange: market.crudeChange,
    vix: market.vix,
  };

  return buildOutlook({
    now,
    economies: official.economies.map((economy) => {
      const fields = policy.rates[economy.code];
      if (!fields) throw new Error(`No policy rate for ${economy.code}.`);
      return { ...economy, ...fields };
    }),
    spots,
    fxDate,
    backdrop,
    series: {
      USDNGN: mergeCloses(dailyCloses(ngnText), stored.series.USDNGN ?? []),
      PALM:
        palmUsd == null
          ? []
          : (stored.series.PALM ?? []).filter((point) => point.date >= "2026-11-03"),
    },
    history,
    stale: official.failed || policy.fellBack || marketStale,
    marketRetrievedAt: (marketStale && lastFastAt ? new Date(lastFastAt) : now).toISOString(),
    officialInputsRetrievedAt: new Date(policy.at).toISOString(),
  });
}

const SNAPSHOT_MS = 6 * 60 * 1000;

async function readSnapshot(): Promise<Cache | null> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ payload: Outlook | string; saved_at: string | Date }>`
      select payload, saved_at from outlook_snapshot where id = 1
    `;
    const row = rows[0];
    if (!row) return null;
    const at = new Date(row.saved_at).getTime();
    if (!Number.isFinite(at) || Date.now() - at > SNAPSHOT_MS) return null;
    const outlook = typeof row.payload === "string" ? (JSON.parse(row.payload) as Outlook) : row.payload;
    if (!outlook?.marketRetrievedAt || !outlook.officialInputsRetrievedAt) return null;
    return { at, outlook };
  } catch {
    return null;
  }
}

async function saveSnapshot(outlook: Outlook): Promise<void> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into outlook_snapshot (id, payload, saved_at)
      values (1, ${JSON.stringify(outlook)}::jsonb, now())
      on conflict (id) do update set payload = excluded.payload, saved_at = now()
    `;
  } catch (error) {
    console.error("[outlook-snapshot]", error instanceof Error ? error.message : "save failed");
  }
}

export const getOutlook = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const fresh =
      typeof input === "object" &&
      input !== null &&
      "fresh" in input &&
      (input as { fresh?: unknown }).fresh === true;
    return { fresh };
  })
  .handler(async ({ data }): Promise<{ ok: true; outlook: Outlook } | { ok: false; error: string }> => {
    if (!data.fresh && cache && Date.now() - cache.at < TTL_MS) {
      return { ok: true, outlook: cache.outlook };
    }
    if (!data.fresh && !cache) {
      const saved = await readSnapshot();
      if (saved) {
        cache = saved;
        return { ok: true, outlook: saved.outlook };
      }
    }
    try {
      const outlook = await loadOutlook(new Date());
      cache = { at: Date.now(), outlook };
      if (!outlook.stale) void saveSnapshot(outlook);
      return { ok: true, outlook };
    } catch (error) {
      if (cache) return { ok: true, outlook: { ...cache.outlook, stale: true } };
      return { ok: false, error: error instanceof Error ? error.message : "The macro feeds did not respond." };
    }
  });

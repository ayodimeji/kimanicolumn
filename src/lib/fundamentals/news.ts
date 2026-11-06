import { createServerFn } from "@tanstack/react-start";
import { PAIR_IDS, type PairId } from "@/lib/fundamentals/model";

export type PairReport = {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
};

export type PairNews = {
  fetchedAt: string;
  pairs: Record<PairId, PairReport[]>;
};

const TTL_MS = 60 * 1000;
const MAX_PER_PAIR = 4;
const HOUR = 60 * 60 * 1000;

const NOISE =
  /technical outlook|weekly technical|price forecast|\banalysis\b|what i am watching|chart update|moving average|key support|finds support|swing area|selling opportunities|wave \(|under pressure|boxing day|christmas day|chief risk officer|enforcement action|survey of consumer finances|tokenis|collateral|certification regime|banknote|court of directors|securities lending|diversity, equity/i;

const IMPACT =
  /\b(rate|hike|hikes|cut|cuts|hold|holds|tighten|tightening|easing|inflation|cpi|ppi|jobs|payrolls?|unemployment|gdp|recession|oil|wti|brent|crude|intervention|minutes|fomc|decision|decisions|policy|tariff|tariffs|fiscal|yields?|resign|steps?\s+down|governor)\b/i;

const SIDE: Record<"EUR" | "USD" | "AUD" | "GBP" | "CHF" | "CAD" | "NGN", RegExp> = {
  EUR: /\b(eur|euro|eurozone|euro area|european central bank|ecb|lagarde)\b/i,
  USD: /\b(usd|dollar|greenback|federal reserve|fomc|\bfed\b|powell)\b/i,
  AUD: /\b(aud|aussie|australia|rba|reserve bank of australia)\b/i,
  GBP: /\b(gbp|sterling|pound|bank of england|\bboe\b|bailey)\b/i,
  CHF: /\b(chf|swiss franc|swiss national bank|\bsnb\b)\b/i,
  CAD: /\b(cad|loonie|canada|bank of canada|macklem|wti|brent|crude oil|oil prices?)\b/i,
  NGN: /\b(ngn|naira|nigeria|central bank of nigeria|\bcbn\b|cardoso)\b/i,
};

const PAIR_NAME: Record<PairId, RegExp> = {
  EURUSD: /\beur\s*\/\s*usd\b|\beurusd\b|\beuro[-\s]dollar\b/i,
  AUDUSD: /\baud\s*\/\s*usd\b|\baudusd\b|\baussie[-\s]dollar\b/i,
  EURGBP: /\beur\s*\/\s*gbp\b|\beurgbp\b|\beuro[-\s]sterling\b/i,
  EURCHF: /\beur\s*\/\s*chf\b|\beurchf\b|\beuro[-\s]franc\b/i,
  USDCAD: /\busd\s*\/\s*cad\b|\busdcad\b|\bdollar[-\s]cad\b/i,
  USDCHF: /\busd\s*\/\s*chf\b|\busdchf\b|\bdollar[-\s]franc\b/i,
  BTCUSD: /\b(bitcoin|btc(?:usd)?|btc\s*\/\s*usd)\b/i,
  XAUUSD: /\b(gold|bullion|xau(?:usd)?|xau\s*\/\s*usd)\b/i,
  XAGUSD: /\b(silver|xag(?:usd)?|xag\s*\/\s*usd)\b/i,
  COCOA: /\bcocoa\b/i,
  PALM: /\bpalm kernels?\b(?!\s+oil)/i,
  USDNGN: /\b(usd\s*\/\s*ngn|usdngn|naira)\b/i,
};

type Side = "EUR" | "USD" | "AUD" | "GBP" | "CHF" | "CAD" | "NGN";
type FxPair = Exclude<PairId, "BTCUSD" | "XAUUSD" | "XAGUSD" | "COCOA" | "PALM">;

const PAIR_SIDES: Record<FxPair, [Side, Side]> = {
  EURUSD: ["EUR", "USD"],
  AUDUSD: ["AUD", "USD"],
  EURGBP: ["EUR", "GBP"],
  EURCHF: ["EUR", "CHF"],
  USDCAD: ["USD", "CAD"],
  USDCHF: ["USD", "CHF"],
  USDNGN: ["USD", "NGN"],
};

type RawItem = {
  title: string;
  url: string;
  publishedAt: number;
  source: string;
  official: boolean;
  economies: Side[];
};

const FEEDS: { url: string; source: string; official: boolean; economies: Side[] }[] = [
  { url: "https://www.forexlive.com/feed/", source: "InvestingLive", official: false, economies: [] },
  {
    url: `https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=${encodeURIComponent(
      '("EUR/USD" OR "USD/CAD" OR "USD/CHF" OR "AUD/USD" OR "EUR/GBP" OR "EUR/CHF" OR "USD/NGN" OR naira OR "Central Bank of Nigeria" OR "European Central Bank" OR "Bank of Canada" OR "Swiss National Bank" OR "Reserve Bank of Australia" OR "Bank of England" OR FOMC OR "Federal Reserve") when:2d',
    )}`,
    source: "Google News",
    official: false,
    economies: [],
  },
  {
    url: `https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=${encodeURIComponent(
      '("bitcoin" OR "gold" OR "silver" OR "bullion" OR "XAU" OR "XAG" OR "cocoa" OR "palm kernel") when:2d',
    )}`,
    source: "Google News",
    official: false,
    economies: [],
  },
  {
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    source: "Federal Reserve",
    official: true,
    economies: ["USD"],
  },
  {
    url: "https://www.ecb.europa.eu/rss/press.html",
    source: "European Central Bank",
    official: true,
    economies: ["EUR"],
  },
  {
    url: "https://www.bankofengland.co.uk/rss/news",
    source: "Bank of England",
    official: true,
    economies: ["GBP"],
  },
  {
    url: "https://www.rba.gov.au/rss/rss-cb-media-releases.xml",
    source: "Reserve Bank of Australia",
    official: true,
    economies: ["AUD"],
  },
  {
    url: "https://www.snb.ch/public/en/rss/pressrel",
    source: "Swiss National Bank",
    official: true,
    economies: ["CHF"],
  },
];

function namedEntity(name: string): string {
  return `&${name};`;
}

function decode(value: string): string {
  let text = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "");
  for (let pass = 0; pass < 2; pass += 1) {
    const next = text
      .split(namedEntity("amp"))
      .join("&")
      .split(namedEntity("lt"))
      .join("<")
      .split(namedEntity("gt"))
      .join(">")
      .split(namedEntity("quot"))
      .join('"')
      .split(namedEntity("apos"))
      .join("'")
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
    if (next === text) break;
    text = next;
  }
  return text.replace(/\s+/g, " ").trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decode(match[1]) : "";
}

export function itemsFromFeed(
  xml: string,
  source: string,
  official: boolean,
  economies: Side[],
  now: number,
): RawItem[] {
  const items: RawItem[] = [];
  for (const block of xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? []) {
    let title = tag(block, "title");
    const link = tag(block, "link");
    const named = tag(block, "source");
    const when = tag(block, "pubDate") || tag(block, "dc:date") || tag(block, "date");
    const publishedAt = Date.parse(when);
    if (!title || !/^https?:\/\//i.test(link) || !Number.isFinite(publishedAt)) continue;
    if (publishedAt > now + HOUR) continue;
    const itemSource = named || source;
    if (title.endsWith(` - ${itemSource}`)) title = title.slice(0, -(` - ${itemSource}`).length).trim();
    if (NOISE.test(title)) continue;
    const namedPairs = PAIR_IDS.filter((id) => PAIR_NAME[id].test(title)).length;
    if (namedPairs >= 3) continue;
    items.push({ title, url: link, publishedAt, source: itemSource, official, economies });
  }
  return items;
}

function covers(side: Side, item: RawItem): boolean {
  return SIDE[side].test(item.title) || (item.official && item.economies.includes(side));
}

function ageScore(item: RawItem, now: number, points: number): number {
  const ageH = (now - item.publishedAt) / HOUR;
  if (ageH > 24 * 14) return 0;
  if (ageH > 72 && !item.official) return 0;
  return points + Math.max(0, 6 - ageH / 12);
}

function assetRelevant(
  pair: "BTCUSD" | "XAUUSD" | "XAGUSD" | "COCOA" | "PALM",
  item: RawItem,
  now: number,
): number {
  const topic = PAIR_NAME[pair].test(item.title);
  const soft = pair === "COCOA" || pair === "PALM";
  const impact =
    IMPACT.test(item.title) ||
    /\b(etf|halving|hack|breach|liquidations?|sell-?off|plunges|sinks|tumbles|drops|falls|fell)\b/i.test(item.title) ||
    (soft && /\b(crop|drought|rainfall|harvest|output|exports?|disease|weather|biodiesel|stocks)\b/i.test(item.title));
  const fed = !soft && item.official && item.economies.includes("USD") && IMPACT.test(item.title);
  if (topic) {
    if (!impact && !item.official) return 0;
  } else if (!fed) {
    return 0;
  }
  return ageScore(item, now, (topic ? 10 : 4) + (impact ? 2 : 0) + (item.official ? 3 : 0));
}

function relevant(pair: PairId, item: RawItem, now: number): number {
  if (pair === "BTCUSD" || pair === "XAUUSD" || pair === "XAGUSD" || pair === "COCOA" || pair === "PALM") {
    return assetRelevant(pair, item, now);
  }
  const [base, quote] = PAIR_SIDES[pair];
  const named = PAIR_NAME[pair].test(item.title);
  if (pair === "USDNGN" && !(named || covers("NGN", item))) return 0;
  const baseHit = covers(base, item);
  const quoteHit = covers(quote, item);
  const impact = IMPACT.test(item.title);
  if (!(named || baseHit || quoteHit)) return 0;
  if (!impact) return 0;
  let score = 0;
  if (named) score += 10;
  if (baseHit && quoteHit) score += 6;
  else if (baseHit || quoteHit) score += 3;
  if (impact) score += 2;
  if (item.official) score += 3;
  return ageScore(item, now, score);
}

function sameStory(left: string, right: string): boolean {
  const words = (title: string) =>
    new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3));
  const a = words(left);
  const b = words(right);
  if (a.size === 0 || b.size === 0) return false;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / (a.size + b.size - shared) >= 0.55;
}

export function selectReports(items: RawItem[], now: number): Record<PairId, PairReport[]> {
  const pairs = {} as Record<PairId, PairReport[]>;
  for (const id of PAIR_IDS) {
    const ranked = items
      .map((item) => ({ item, score: relevant(id, item, now) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || b.item.publishedAt - a.item.publishedAt);
    const seen = new Set<string>();
    const picked: PairReport[] = [];
    for (const row of ranked) {
      const key = row.item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(key) || picked.some((report) => sameStory(report.title, row.item.title))) continue;
      seen.add(key);
      picked.push({
        title: row.item.title,
        source: row.item.source,
        url: row.item.url,
        publishedAt: new Date(row.item.publishedAt).toISOString(),
      });
      if (picked.length === MAX_PER_PAIR) break;
    }
    pairs[id] = picked;
  }
  return pairs;
}

async function readFeed(feed: (typeof FEEDS)[number], now: number): Promise<RawItem[]> {
  const response = await fetch(feed.url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${feed.source} returned ${response.status}`);
  return itemsFromFeed(await response.text(), feed.source, feed.official, feed.economies, now);
}

async function loadNews(now: Date): Promise<PairNews> {
  const stamp = now.getTime();
  const batches = await Promise.allSettled(FEEDS.map((feed) => readFeed(feed, stamp)));
  const items = batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []));
  if (items.length === 0) {
    const reason = batches.find((batch) => batch.status === "rejected");
    const message =
      reason && reason.status === "rejected" ? String(reason.reason) : "The news feeds did not respond.";
    throw new Error(message);
  }
  return { fetchedAt: now.toISOString(), pairs: selectReports(items, stamp) };
}

type Cache = { at: number; news: PairNews };
let cache: Cache | null = null;

export const getPairNews = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const fresh =
      typeof input === "object" &&
      input !== null &&
      "fresh" in input &&
      (input as { fresh?: unknown }).fresh === true;
    return { fresh };
  })
  .handler(async ({ data }): Promise<{ ok: true; news: PairNews } | { ok: false; error: string }> => {
    if (!data.fresh && cache && Date.now() - cache.at < TTL_MS) {
      return { ok: true, news: cache.news };
    }
    try {
      const news = await loadNews(new Date());
      cache = { at: Date.now(), news };
      return { ok: true, news };
    } catch (error) {
      if (cache) return { ok: true, news: cache.news };
      const message = error instanceof Error ? error.message : "The news feeds did not respond.";
      return { ok: false, error: message };
    }
  });

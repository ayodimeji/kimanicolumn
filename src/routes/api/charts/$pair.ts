import { createFileRoute } from "@tanstack/react-router";
import { CHART_SYMBOL, PAIR_IDS, type PairId } from "@/lib/fundamentals/model";

const TTL_MS = 60 * 1000;
const MIN_BYTES = 8_000;
const PACE_MS = 1_100;
const BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

type Cached = { at: number; bytes: Uint8Array };
const cache = new Map<PairId, Cached>();

let pace: Promise<void> = Promise.resolve();

function isPairId(value: string): value is PairId {
  return (PAIR_IDS as readonly string[]).includes(value);
}

function chartUrl(pair: PairId): string | null {
  const symbol = CHART_SYMBOL[pair];
  if (!symbol) return null;
  return `https://stockcharts.com/c-sc/sc?s=%24${symbol}&p=D&yr=0&mn=6&dy=0&id=p${symbol}`;
}

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = pace.then(job, job);
  pace = run.then(
    () => new Promise((resolve) => setTimeout(resolve, PACE_MS)),
    () => new Promise((resolve) => setTimeout(resolve, PACE_MS)),
  );
  return run;
}

async function fetchChart(pair: PairId): Promise<Uint8Array> {
  const url = chartUrl(pair);
  if (!url) throw new Error(`No StockCharts symbol for ${pair}.`);
  const response = await fetch(url, {
    headers: {
      Accept: "image/png,image/*,*/*",
      "User-Agent": BROWSER,
      Referer: "https://stockcharts.com/",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`StockCharts returned ${response.status} for ${pair}.`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("image/png")) throw new Error(`StockCharts did not return a chart for ${pair}.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < MIN_BYTES) throw new Error(`StockCharts returned an empty chart for ${pair}.`);
  return bytes;
}

async function loadChart(pair: PairId): Promise<Uint8Array> {
  const hit = cache.get(pair);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.bytes;
  const bytes = await enqueue(() => fetchChart(pair));
  cache.set(pair, { at: Date.now(), bytes });
  return bytes;
}

export const Route = createFileRoute("/api/charts/$pair")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const pair = params.pair.toUpperCase();
        if (!isPairId(pair)) {
          return new Response("Unknown pair", { status: 404 });
        }
        const url = chartUrl(pair);
        if (!url) return new Response("No chart for this market", { status: 404 });
        try {
          const bytes = await loadChart(pair);
          const body = new Uint8Array(bytes.byteLength);
          body.set(bytes);
          return new Response(body.buffer, {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=60",
            },
          });
        } catch {
          return new Response("Chart unavailable", { status: 502 });
        }
      },
    },
  },
});

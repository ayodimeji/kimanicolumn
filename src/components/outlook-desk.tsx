import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getOutlook } from "@/lib/fundamentals/outlook";
import { getPairNews, type PairNews, type PairReport } from "@/lib/fundamentals/news";
import {
  CHART_SYMBOL,
  formatFlex,
  formatSpot,
  type DailyClose,
  type Outlook,
  type PairId,
  type PairOutlook,
  type Tone,
} from "@/lib/fundamentals/model";

type Result = { ok: true; outlook: Outlook } | { ok: false; error: string };
type NewsResult = { ok: true; news: PairNews } | { ok: false; error: string };
type SortMode = "desk" | "bull" | "bear";

const SORTS: { id: SortMode; label: string }[] = [
  { id: "desk", label: "Desk order" },
  { id: "bull", label: "Most bullish" },
  { id: "bear", label: "Most bearish" },
];

function formatStamp(iso: string): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso))} WAT`;
}

function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function toneText(tone: Tone): string {
  if (tone === "bear") return "text-paper/80";
  return "text-paper";
}

function toneBar(tone: Tone): string {
  if (tone === "bear") return "bg-paper/70";
  return "bg-paper";
}

function sortPairs(pairs: PairOutlook[], mode: SortMode): PairOutlook[] {
  const next = [...pairs];
  if (mode === "bull") next.sort((a, b) => b.bullish - a.bullish || a.id.localeCompare(b.id));
  if (mode === "bear") next.sort((a, b) => a.bullish - b.bullish || a.id.localeCompare(b.id));
  return next;
}

function BiasMeter({ pair }: { pair: PairOutlook }) {
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pair.bullish}
      aria-label={`${pair.id} fundamental bias, ${pair.bullish} percent bullish`}
      className="mt-4"
    >
      <div className="relative mx-2 h-8">
        <div className="absolute top-3.5 right-0 left-0 h-1 rounded-full bg-paper/35" />
        <div className="absolute top-2 left-1/2 h-4 w-px bg-paper" />
        <div
          className={`absolute top-1 size-4 -translate-x-1/2 rounded-full border-2 border-ink ${toneBar(pair.tone)}`}
          style={{ left: `${pair.bullish}%` }}
        />
      </div>
      <div className="flex justify-between text-xs tracking-wide text-paper/75 uppercase">
        <span>Bearish</span>
        <span>50</span>
        <span>Bullish</span>
      </div>
    </div>
  );
}

const CONVERTIBLE = new Set<PairId>(["BTCUSD", "XAUUSD", "XAGUSD", "COCOA", "PALM"]);

function LineChart({ points, stored }: { points: DailyClose[]; stored: boolean }) {
  const width = 640;
  const height = 220;
  const pad = 18;
  const closes = points.map((point) => point.close);
  const min = closes.length ? Math.min(...closes) : 0;
  const max = closes.length ? Math.max(...closes) : 1;
  const span = max - min || 1;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = max === min ? height / 2 : pad + (1 - (point.close - min) / span) * (height - pad * 2);
    return { x, y };
  });
  const start = points[0]?.date ?? "";
  const end = points[points.length - 1]?.date ?? "";
  const caption = points.length > 20 ? "Six-month daily line" : points.length > 0 ? "Daily line from the reference spot" : "Daily line unavailable";

  return (
    <figure className="mt-4 overflow-hidden rounded-card bg-paper text-ink">
      {points.length === 0 ? (
        <p className="px-3 py-6 text-sm">
          {stored
            ? "No daily closes collected yet."
            : "No stored daily closes. The history database did not answer, so this line is left blank."}
        </p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label={caption}>
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={coords.map((point) => `${point.x},${point.y}`).join(" ")}
          />
          {coords.length > 0 ? <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.5" fill="currentColor" /> : null}
        </svg>
      )}
      <figcaption className="border-t border-line px-3 py-2 text-xs">
        <span className="font-medium">{caption}</span>
        {start ? <span className="mt-0.5 block text-ink/70">{start} – {end}</span> : null}
      </figcaption>
    </figure>
  );
}

function PairChart({
  pair,
  rev,
  points,
  stored,
}: {
  pair: PairOutlook;
  rev: number;
  points: DailyClose[];
  stored: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const symbol = CHART_SYMBOL[pair.id];
  const src = rev > 0 ? `/api/charts/${pair.id}?v=${rev}` : `/api/charts/${pair.id}`;
  const page = symbol ? `https://stockcharts.com/sc3/ui/?s=${encodeURIComponent(`$${symbol}`)}` : "";

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!symbol) return <LineChart points={points} stored={stored} />;

  return (
    <figure className="mt-4 overflow-hidden rounded-card bg-paper text-ink">
      {failed ? (
        <p className="px-3 py-6 text-sm">The StockCharts chart did not load.</p>
      ) : (
        <img
          src={src}
          alt={`${pair.base}/${pair.quote} six-month daily chart from StockCharts`}
          className="block h-auto w-full bg-paper"
          onError={() => setFailed(true)}
        />
      )}
      <figcaption className="border-t border-line px-3 py-2 text-xs">
        <a
          href={page}
          className="font-medium underline decoration-line underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          Six-month daily chart on StockCharts
        </a>
      </figcaption>
    </figure>
  );
}

function PairReports({ reports }: { reports: PairReport[] }) {
  if (reports.length === 0) {
    return <p className="mt-4 text-sm text-paper/80">No significant report for this pair in the last few days.</p>;
  }
  return (
    <div className="mt-4">
      <h3 className="text-xs tracking-wide text-paper/75 uppercase">Latest reports</h3>
      <ul className="mt-2 divide-y divide-paper/25 border-y border-paper/25">
        {reports.map((report) => (
          <li key={report.url}>
            <a
              href={report.url}
              target="_blank"
              rel="noreferrer"
              className="block py-3 text-paper"
            >
              <span className="text-sm font-medium underline decoration-paper underline-offset-4">{report.title}</span>
              <span className="mt-1 block text-xs font-normal text-paper/75">
                {report.source} · {formatStamp(report.publishedAt)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PairCard({
  pair,
  outlook,
  reports,
  open,
  chartRev,
  onToggle,
}: {
  pair: PairOutlook;
  outlook: Outlook;
  reports: PairReport[];
  open: boolean;
  chartRev: number;
  onToggle: () => void;
}) {
  const [naira, setNaira] = useState(false);
  const base = outlook.currencies.find((currency) => currency.code === pair.base);
  const quote = outlook.currencies.find((currency) => currency.code === pair.quote);
  const ngnRate = outlook.pairs.find((item) => item.id === "USDNGN")?.spot ?? null;
  const canConvert = CONVERTIBLE.has(pair.id) && pair.spot != null && ngnRate != null;
  const shown = canConvert && naira ? pair.spot! * ngnRate! : pair.spot;
  const caption = naira ? "Naira" : pair.id === "PALM" ? "Palm kernel" : pair.id === "COCOA" ? "Cocoa" : "Reference spot";
  const rows = base && quote
    ? [
        ["Policy rate", base.policyLevel ?? formatFlex(base.policyRate), quote.policyLevel ?? formatFlex(quote.policyRate)],
        ["Last rate change", formatDay(base.policyChanged ?? base.policyAsOf), formatDay(quote.policyChanged ?? quote.policyAsOf)],
        [
          "Latest decision",
          base.policyMeeting ? `${formatDay(base.policyMeeting)}${base.policyMeetingHeld ? " · held" : ""}` : "Not on an official calendar",
          quote.policyMeeting ? `${formatDay(quote.policyMeeting)}${quote.policyMeetingHeld ? " · held" : ""}` : "Not on an official calendar",
        ],
        ["Inflation outlook", `${formatFlex(base.inflation)}%`, `${formatFlex(quote.inflation)}%`],
        ["Real policy rate", formatFlex(base.realRate), formatFlex(quote.realRate)],
        ["Growth outlook", `${formatFlex(base.growth)}%`, `${formatFlex(quote.growth)}%`],
        ["Current account", `${formatFlex(base.currentAccount)}%`, `${formatFlex(quote.currentAccount)}%`],
      ]
    : [];

  return (
    <article className="flex flex-col overflow-hidden rounded-card border-2 border-ink bg-ink text-paper">
      <div className={`h-1 ${toneBar(pair.tone)}`} />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-3xl font-medium tracking-tight">
            {pair.base}
            <span className="text-paper/70">/</span>
            {pair.quote}
          </h2>
          {canConvert ? (
            <button
              type="button"
              onClick={() => setNaira((current) => !current)}
              aria-pressed={naira}
              className="text-right text-sm tabular-nums text-paper/75"
            >
              {shown == null ? "Spot unavailable" : formatSpot(shown)}
              <span className="mt-0.5 block text-xs tracking-wide uppercase underline decoration-paper/40 underline-offset-4">
                {caption}
              </span>
            </button>
          ) : (
            <p className="text-right text-sm tabular-nums text-paper/75">
              {shown == null ? "Spot unavailable" : formatSpot(shown)}
              <span className="mt-0.5 block text-xs tracking-wide uppercase">{caption}</span>
            </p>
          )}
        </div>

        <p className={`mt-3 font-serif text-2xl ${toneText(pair.tone)}`}>{pair.label}</p>
        <p className="mt-1 text-sm tabular-nums">
          <span className="font-semibold">{pair.bullish}% bullish</span>
          <span className="text-paper/75"> · {pair.bearish}% bearish</span>
        </p>
        {pair.regime ? (
          <div className="mt-1 space-y-1 text-xs text-paper/75">
            <p>
              {pair.confidence ?? "Low"} confidence · {pair.available ?? 0}/{pair.wanted ?? 0} drivers · Regime {pair.regime}
            </p>
            <p>
              {pair.dominant ? `Dominant: ${pair.dominant}` : "No dominant driver"}
              {pair.counterforce ? ` · Counterforce: ${pair.counterforce}` : ""}
            </p>
          </div>
        ) : null}
        <BiasMeter pair={pair} />
        <PairChart pair={pair} rev={chartRev} points={outlook.series[pair.id] ?? []} stored={outlook.history.ok} />
        <PairReports reports={reports} />

        <button
          type="button"
          className="mt-4 min-h-11 self-start text-sm font-medium text-paper underline decoration-paper/50 underline-offset-4"
          aria-expanded={open}
          onClick={onToggle}
        >
          {open ? "Hide the inputs" : "Show the inputs"}
        </button>

        {open && rows.length > 0 ? (
          <div className="mt-3 text-sm">
            <div className="grid grid-cols-3 gap-2 pb-1 font-medium">
              <span />
              <span className="text-right">{pair.base}</span>
              <span className="text-right">{pair.quote}</span>
            </div>
            {rows.map(([label, left, right]) => (
              <div key={label} className="grid grid-cols-3 gap-2 border-t border-paper/25 py-1.5">
                <span className="text-paper/75">{label}</span>
                <span className="text-right tabular-nums">{left}</span>
                <span className="text-right tabular-nums">{right}</span>
              </div>
            ))}
          </div>
        ) : open ? (
          <div className="mt-3 text-sm">
            {pair.drivers.map((driver) => (
              <div key={driver.id} className="border-t border-paper/25 py-1.5">
                <p className="font-medium">{driver.label}</p>
                <p className="text-xs tabular-nums text-paper/75">{driver.detail}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function countLabel(outlook: Outlook): string {
  const bull = outlook.pairs.filter((pair) => pair.tone === "bull").length;
  const bear = outlook.pairs.filter((pair) => pair.tone === "bear").length;
  const mixed = outlook.pairs.filter((pair) => pair.label === "Mixed").length;
  const neutral = outlook.pairs.length - bull - bear - mixed;
  return `${bull} bullish · ${mixed} mixed · ${neutral} neutral · ${bear} bearish`;
}

const REFRESH_MS = 60_000;

export function OutlookDesk({ initial, initialNews }: { initial: Result; initialNews: NewsResult }) {
  const refresh = useServerFn(getOutlook);
  const refreshNews = useServerFn(getPairNews);
  const [result, setResult] = useState(initial);
  const [news, setNews] = useState(initialNews);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("desk");
  const [openId, setOpenId] = useState<string | null>(null);
  const [chartRev, setChartRev] = useState(0);
  const busyRef = useRef(false);
  const resultRef = useRef(result);
  const newsRef = useRef(news);
  const lastPull = useRef(Date.now());
  resultRef.current = result;
  newsRef.current = news;

  async function pull(manual: boolean) {
    if (busyRef.current) return;
    if (!manual && Date.now() - lastPull.current < REFRESH_MS - 5_000) return;
    busyRef.current = true;
    if (manual) {
      setBusy(true);
      setNotice(null);
    }
    try {
      const [next, nextNews] = await Promise.all([
        refresh({ data: { fresh: true } }),
        refreshNews({ data: { fresh: true } }),
      ]);
      if (next.ok) {
        lastPull.current = Date.now();
        setResult(next);
        setChartRev(Date.now());
        if (manual) setNotice(null);
      } else if (manual) {
        if (resultRef.current.ok) setNotice(next.error);
        else {
          setResult(next);
          setNotice(next.error);
        }
      }
      if (nextNews.ok) setNews(nextNews);
      else if (manual && !newsRef.current.ok) setNotice(nextNews.error);
    } catch {
      if (manual) setNotice("The feeds did not answer. The last reading is still on the desk.");
    } finally {
      busyRef.current = false;
      if (manual) setBusy(false);
    }
  }

  const pullRef = useRef(pull);
  pullRef.current = pull;

  useEffect(() => {
    const tick = () => {
      void pullRef.current(false);
    };
    const id = window.setInterval(tick, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const outlook = result.ok ? result.outlook : null;
  const pairs = outlook ? sortPairs(outlook.pairs, sort) : [];

  return (
    <div className="min-h-screen bg-paper">
      <div className="h-1.5 bg-ink" />
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Kimani Column</h1>
            <p className="mt-3 max-w-xl text-base text-muted">Independent market research</p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={() => void pull(true)}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-paper disabled:opacity-60"
            >
              <RefreshCw className={busy ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
              {busy ? "Updating" : "Update readings"}
            </button>
            {outlook ? (
              <p className="text-sm text-muted">
                <span className="font-medium text-ink">{countLabel(outlook)}</span>
                <span className="mt-1 block tabular-nums">Markets {formatStamp(outlook.marketRetrievedAt)}</span>
                <span className="mt-1 block tabular-nums">
                  {outlook.stale ? "Official inputs last verified" : "Official inputs"}{" "}
                  {formatStamp(outlook.officialInputsRetrievedAt)}
                </span>
                <span className="mt-1 block">
                  {outlook.stale
                    ? "A feed did not answer. The missing piece is still the last verified copy."
                    : "Prices refresh every minute. Official rates are checked on each update."}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {notice ? (
          <p className="mb-4 rounded-card border border-ink bg-ink px-4 py-3 text-sm text-paper" role="status">
            {notice}
          </p>
        ) : null}
        {outlook && !news.ok ? (
          <p className="mb-4 text-sm text-muted">Reports did not load. The score is unchanged. {news.error}</p>
        ) : null}
        {outlook && !outlook.history.ok && outlook.history.note ? (
          <p className="mb-4 text-sm text-muted">{outlook.history.note}</p>
        ) : null}

        {!outlook ? (
          <section className="rounded-card border-2 border-ink bg-ink p-6 text-paper">
            <h2 className="font-serif text-2xl">The desk could not load a reading</h2>
            <p className="mt-2 max-w-xl text-sm text-paper/80">{result.ok ? "" : result.error}</p>
            <p className="mt-3 text-sm text-paper/80">
              Policy rates come from the BIS and the outlook from the IMF. Try again in a moment.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Sort pairs">
              {SORTS.map((item) => {
                const active = sort === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSort(item.id)}
                    className={`min-h-11 rounded-full px-4 text-sm font-medium ${
                      active ? "bg-ink text-paper" : "bg-paper-2 text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pairs.map((pair) => (
                <PairCard
                  key={pair.id}
                  pair={pair}
                  outlook={outlook}
                  reports={news.ok ? news.news.pairs[pair.id] : []}
                  chartRev={chartRev}
                  open={openId === pair.id}
                  onToggle={() => setOpenId((current) => (current === pair.id ? null : pair.id))}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export function DeskPending() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="h-1.5 bg-ink" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-4xl font-medium">Kimani Column</h1>
        <p className="mt-3 text-base text-muted">Independent market research</p>
        <p className="mt-2 text-sm text-muted">Pulling policy rates and the IMF outlook…</p>
      </div>
    </div>
  );
}

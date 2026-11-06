export const ECONOMY_CODES = ["USD", "EUR", "AUD", "GBP", "CHF", "CAD", "NGN"] as const;
export type EconomyCode = (typeof ECONOMY_CODES)[number];

export const PAIR_IDS = [
  "EURUSD",
  "AUDUSD",
  "EURGBP",
  "EURCHF",
  "USDCAD",
  "USDCHF",
  "USDNGN",
  "BTCUSD",
  "XAUUSD",
  "XAGUSD",
  "COCOA",
  "PALM",
] as const;
export type PairId = (typeof PAIR_IDS)[number];

export type AssetCode = "BTC" | "XAU" | "XAG" | "COCOA" | "PALM";
export type Leg = EconomyCode | AssetCode;

export type DriverId = "real" | "growth" | "external" | "employment" | "inflation" | "dollar" | "supply" | "energy" | "risk" | "china" | "temp" | "stocks" | "demand";
export type Tone = "bull" | "bear" | "neutral";
export type RiskRegime = "Risk-on" | "Neutral" | "Risk-off" | "Not in the feed";
export type Confidence = "High" | "Medium" | "Low";

export const ECONOMIES: Record<
  EconomyCode,
  { currency: string; economy: string; imf: string; bis: string }
> = {
  USD: { currency: "US dollar", economy: "the United States", imf: "USA", bis: "US" },
  EUR: { currency: "euro", economy: "the euro area", imf: "EURO", bis: "XM" },
  AUD: { currency: "Australian dollar", economy: "Australia", imf: "AUS", bis: "AU" },
  GBP: { currency: "sterling", economy: "the United Kingdom", imf: "GBR", bis: "GB" },
  CHF: { currency: "Swiss franc", economy: "Switzerland", imf: "CHE", bis: "CH" },
  CAD: { currency: "Canadian dollar", economy: "Canada", imf: "CAN", bis: "CA" },
  NGN: { currency: "naira", economy: "Nigeria", imf: "NGA", bis: "" },
};

export const PAIRS: { id: PairId; base: EconomyCode; quote: EconomyCode }[] = [
  { id: "EURUSD", base: "EUR", quote: "USD" },
  { id: "AUDUSD", base: "AUD", quote: "USD" },
  { id: "EURGBP", base: "EUR", quote: "GBP" },
  { id: "EURCHF", base: "EUR", quote: "CHF" },
  { id: "USDCAD", base: "USD", quote: "CAD" },
  { id: "USDCHF", base: "USD", quote: "CHF" },
  { id: "USDNGN", base: "USD", quote: "NGN" },
];

/** Full-mark gaps. A wider gap does not push a pillar past its weight. */
export const SCALES = {
  real: 2,
  growth: 1.2,
  external: 4,
  employment: 2,
  inflation: 2,
} as const;

export const WEIGHTS: Record<DriverId, number> = {
  real: 0.5,
  growth: 0.3,
  external: 0.2,
  employment: 0,
  inflation: 0,
  dollar: 0,
  supply: 0,
  energy: 0,
  risk: 0,
  china: 0,
  temp: 0,
  stocks: 0,
  demand: 0,
};

export const DRIVER_LABEL: Record<DriverId, string> = {
  real: "Real yield",
  growth: "Growth",
  external: "External balance",
  employment: "Employment",
  inflation: "Inflation",
  dollar: "Dollar",
  supply: "Weather",
  energy: "Crude oil",
  risk: "Risk regime",
  china: "China demand",
  temp: "Temperature",
  stocks: "Inventories",
  demand: "Grindings",
};

export type YearSeries = Record<string, number | null>;

export type RawEconomy = {
  code: EconomyCode;
  policyRate: number;
  policyAsOf: string;
  inflationByYear: YearSeries;
  growthByYear: YearSeries;
  currentAccountByYear: YearSeries;
  unemploymentByYear: YearSeries;
  policyPrevious: number | null;
  policyChanged: string | null;
  policySource: string;
  /** Published level, such as a Fed range. The score still uses policyRate. */
  policyLevel: string | null;
  /** Latest official decision or meeting. Null when no calendar published one. */
  policyMeeting: string | null;
  /** True when that meeting is later than the last rate change and left the rate in place. */
  policyMeetingHeld: boolean | null;
};

export type CurrencySnap = {
  code: EconomyCode;
  policyRate: number;
  policyAsOf: string;
  inflation: number;
  realRate: number;
  growth: number;
  currentAccount: number;
  unemployment: number | null;
  policyPrevious: number | null;
  policyChanged: string | null;
  policySource: string;
  policyLevel: string | null;
  policyMeeting: string | null;
  policyMeetingHeld: boolean | null;
  growthPrevious: number | null;
};

export type Driver = {
  id: DriverId;
  label: string;
  weight: number;
  norm: number;
  points: number;
  detail: string;
};

export type PairOutlook = {
  id: PairId;
  base: Leg;
  quote: Leg;
  spot: number | null;
  bullish: number;
  bearish: number;
  label: string;
  tone: Tone;
  drivers: Driver[];
  thesis: string;
  regime: RiskRegime;
  confidence: Confidence;
  dominant: string | null;
  counterforce: string | null;
  available: number;
  wanted: number;
  missing: string[];
  why: string;
};

/** StockCharts symbol. Gold and silver charts are $GOLD and $SILVER; $XAUUSD does not draw. */
export const CHART_SYMBOL: Record<PairId, string> = {
  EURUSD: "EURUSD",
  AUDUSD: "AUDUSD",
  EURGBP: "EURGBP",
  EURCHF: "EURCHF",
  USDCAD: "USDCAD",
  USDCHF: "USDCHF",
  USDNGN: "",
  BTCUSD: "BTCUSD",
  XAUUSD: "GOLD",
  XAGUSD: "SILVER",
  COCOA: "COCOA",
  PALM: "",
};

export type RainWindow = { recent: number; normal: number; recentTemp: number | null; normalTemp: number | null };

export type CocoaBalance = {
  season: string;
  productionYoY: number;
  grindingsYoY: number;
  stocksYoY: number;
  note: string;
};

export type PalmBoard = {
  kernelStock: number;
  kernelOutput: number;
  oilPalmOutput: number;
  kernelOilExports: number;
  month: string;
};

export type MarketBackdrop = {
  nominalYield: number | null;
  dollarChange: number | null;
  chinaGrowth: number | null;
  cocoaRain: RainWindow | null;
  palmRain: RainWindow | null;
  cocoaBalance: CocoaBalance | null;
  palmBoard: PalmBoard | null;
  crudeChange: number | null;
  yieldChange: number | null;
  yieldAsOf: string | null;
  chinaPrevious: number | null;
  vix: number | null;
};

export type DailyClose = { date: string; close: number };

export type HistoryStatus = { ok: boolean; note: string | null };

export type Outlook = {
  fetchedAt: string;
  marketRetrievedAt: string;
  officialInputsRetrievedAt: string;
  fxDate: string | null;
  year0: number;
  year1: number;
  weight0: number;
  weight1: number;
  currencies: CurrencySnap[];
  pairs: PairOutlook[];
  series: Partial<Record<PairId, DailyClose[]>>;
  history: HistoryStatus;
  stale: boolean;
};

export function outlookWeights(now: Date): { year0: number; year1: number; weight0: number; weight1: number } {
  const year0 = now.getUTCFullYear();
  const weight1 = now.getUTCMonth() >= 6 ? 0.6 : 0.35;
  return { year0, year1: year0 + 1, weight0: 1 - weight1, weight1 };
}

export function blendYears(
  series: YearSeries,
  year0: number,
  year1: number,
  weight0: number,
  weight1: number,
): number | null {
  const a = series[String(year0)] ?? null;
  const b = series[String(year1)] ?? null;
  if (a == null && b == null) return null;
  if (a == null) return b;
  if (b == null) return a;
  return weight0 * a + weight1 * b;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function biasLabel(bullish: number): string {
  if (bullish >= 74) return "Strongly bullish";
  if (bullish >= 58) return "Bullish";
  if (bullish >= 53) return "Lean bullish";
  if (bullish <= 26) return "Strongly bearish";
  if (bullish <= 42) return "Bearish";
  if (bullish <= 47) return "Lean bearish";
  return "Balanced";
}

export function toneFor(bullish: number): Tone {
  if (bullish >= 53) return "bull";
  if (bullish <= 47) return "bear";
  return "neutral";
}

/** A small path adjustment. It cannot reverse a level that is already clear. */
function applyPath(level: number, shift: number | null): number {
  if (shift == null || Math.abs(shift) < 0.04) return level;
  if (Math.abs(level) < 0.05) return clamp(shift, -0.35, 0.35);
  if (Math.sign(shift) === Math.sign(level)) return clamp(level + Math.sign(level) * Math.min(0.12, Math.abs(shift)), -1, 1);
  return clamp(level * 0.72, -1, 1);
}

function applyHistory(level: number, previous: number | null): number {
  if (previous == null || Math.abs(previous) < 0.05) return level;
  if (Math.abs(level) >= 0.05 && Math.sign(previous) !== Math.sign(level)) return clamp(level * 0.75, -1, 1);
  if (Math.abs(level) > Math.abs(previous) + 0.05) return clamp(level + Math.sign(level || 1) * 0.08, -1, 1);
  if (Math.abs(level) + 0.05 < Math.abs(previous)) return clamp(level * 0.88, -1, 1);
  return level;
}

function priorYear(series: YearSeries, year: number): number | null {
  const value = series[String(year)];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function policyNote(currency: CurrencySnap): string {
  const level = currency.policyLevel ?? formatGap(currency.policyRate);
  const change = currency.policyChanged ?? currency.policyAsOf;
  const move = currency.policyPrevious == null ? null : currency.policyRate - currency.policyPrevious;
  const verb =
    move == null
      ? null
      : Math.abs(move) < 0.005
        ? "unchanged"
        : move > 0
          ? `raised ${formatGap(move)}`
          : `cut ${formatGap(Math.abs(move))}`;
  const changeText = change
    ? `last rate change ${change}${verb ? ` (${verb})` : ""}`
    : "last rate change was not in this feed";
  if (currency.policyMeeting && change && currency.policyMeeting !== change) {
    const action = currency.policyMeetingHeld ? "held" : "met";
    return `${currency.policySource}, current ${level}, ${changeText}, latest decision ${currency.policyMeeting} (${action})`;
  }
  if (currency.policyMeeting) {
    return `${currency.policySource}, current ${level}, latest decision ${currency.policyMeeting}${verb ? ` (${verb})` : ""}`;
  }
  return `${currency.policySource}, current ${level}, ${changeText}`;
}

export function readBias(bullish: number, drivers: Driver[]): { label: string; tone: Tone } {
  const pos = drivers.some((driver) => driver.norm >= 0.25 && driver.weight >= 0.2);
  const neg = drivers.some((driver) => driver.norm <= -0.25 && driver.weight >= 0.2);
  const strongest = drivers.reduce((max, driver) => Math.max(max, Math.abs(driver.norm)), 0);
  if (drivers.length === 0 || strongest < 0.2) return { label: "Neutral", tone: "neutral" };
  if (drivers.length === 1 && strongest < 0.34) return { label: "Neutral", tone: "neutral" };
  if (pos && neg && bullish > 40 && bullish < 60) return { label: "Mixed", tone: "neutral" };
  return { label: biasLabel(bullish), tone: toneFor(bullish) };
}

function formatGap(n: number): string {
  const digits = Math.abs(n * 100 - Math.round(n * 100)) > 0.05 ? 3 : 2;
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
  return n < 0 ? `−${abs}` : abs;
}

function clause(driver: Driver, base: EconomyCode, quote: EconomyCode): string | null {
  if (Math.abs(driver.points) < 0.8) return null;
  const favor = driver.points >= 0 ? base : quote;
  switch (driver.id) {
    case "real":
      return `${favor} has the higher real policy rate.`;
    case "growth":
      return `The growth outlook favors ${favor}.`;
    case "external":
      return `${favor} has the stronger external balance.`;
    case "employment":
      return `The jobs market is tighter in ${ECONOMIES[favor].economy}.`;
    case "energy":
      if (quote === "CAD") return driver.norm < 0 ? "Higher oil supports Canada's terms of trade." : "Lower oil leans against Canada's terms of trade.";
      if (quote === "NGN") return driver.norm < 0 ? "Higher oil is scored as more Nigerian dollar supply." : "Lower oil is scored as less Nigerian dollar supply.";
      return null;
    case "china":
      return driver.norm >= 0 ? "Chinese activity supports this asset." : "Softer Chinese activity leans against this asset.";
    case "risk":
      return null;
    case "supply":
      return driver.norm > 0.15 ? "Weather stress leans toward a tighter crop." : null;
    default:
      return null;
  }
}

function thesisFor(id: PairId, base: EconomyCode, quote: EconomyCode, bullish: number, drivers: Driver[], policyNote: string | null): string {
  const reading = readBias(bullish, drivers);
  const lead =
    reading.label === "Mixed"
      ? `Bullish and bearish forces are both material for ${id}, so this is mixed rather than a firm lean.`
      : reading.label === "Neutral"
        ? `${id} does not have a large enough gap to call a direction.`
        : bullish >= 53
          ? `Fundamentals lean toward a higher ${id}.`
          : bullish <= 47
            ? `Fundamentals lean toward a lower ${id}.`
            : `${id} is close to balanced on these fundamentals.`;
  const notes = [...drivers]
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    .map((driver) => clause(driver, base, quote))
    .filter((line): line is string => Boolean(line))
    .slice(0, 2);
  const oppose = drivers.filter((driver) => Math.sign(driver.norm) !== 0 && Math.sign(driver.norm) !== Math.sign(bullish - 50));
  const conflict =
    reading.label !== "Mixed" && oppose.some((driver) => Math.abs(driver.norm) >= 0.25 && driver.weight >= 0.2)
      ? "Another input still points the other way."
      : null;
  return [lead, ...notes, policyNote, conflict].filter((line): line is string => Boolean(line)).join(" ");
}

type FxId = "EURUSD" | "AUDUSD" | "EURGBP" | "EURCHF" | "USDCAD" | "USDCHF" | "USDNGN";
const REAL_WEIGHT: Record<FxId, number> = {
  EURUSD: 0.42,
  AUDUSD: 0.3,
  EURGBP: 0.46,
  EURCHF: 0.32,
  USDCAD: 0.34,
  USDCHF: 0.28,
  USDNGN: 0.3,
};
const GROWTH_WEIGHT: Record<FxId, number> = {
  EURUSD: 0.24,
  AUDUSD: 0.16,
  EURGBP: 0.3,
  EURCHF: 0.18,
  USDCAD: 0.16,
  USDCHF: 0.14,
  USDNGN: 0.12,
};
const EXTERNAL_WEIGHT: Record<FxId, number> = {
  EURUSD: 0.22,
  AUDUSD: 0.1,
  EURGBP: 0.24,
  EURCHF: 0.18,
  USDCAD: 0,
  USDCHF: 0.16,
  USDNGN: 0.18,
};
const RISK_WEIGHT: Record<FxId, number> = {
  EURUSD: 0.12,
  AUDUSD: 0.18,
  EURGBP: 0,
  EURCHF: 0.32,
  USDCAD: 0.1,
  USDCHF: 0.42,
  USDNGN: 0,
};
const RISK_FLIP = new Set<PairId>(["USDCAD"]);

type Spec = { id: DriverId; label?: string; weight: number; norm: number; detail: string };

function assemble(specs: Spec[]): Driver[] {
  const live = specs.filter((spec) => spec.weight > 0);
  const weightSum = live.reduce((sum, spec) => sum + spec.weight, 0) || 1;
  return live.map((spec) => {
    const weight = spec.weight / weightSum;
    return {
      id: spec.id,
      label: spec.label ?? DRIVER_LABEL[spec.id],
      weight,
      norm: spec.norm,
      points: weight * spec.norm * 50,
      detail: spec.detail,
    };
  });
}

function riskAppetite(vix: number | null): { regime: RiskRegime; norm: number | null; detail: string } {
  // A neutral print adds nothing. Only a clear risk-on or risk-off moves the score.
  if (vix == null || !Number.isFinite(vix) || vix <= 0) {
    return { regime: "Not in the feed", norm: null, detail: "" };
  }
  let regime: RiskRegime = "Neutral";
  let norm = 0;
  if (vix < 16) {
    regime = "Risk-on";
    norm = clamp((16 - vix) / 8, 0, 1);
  } else if (vix > 24) {
    regime = "Risk-off";
    norm = clamp((24 - vix) / 8, -1, 0);
  }
  return {
    regime,
    norm,
    detail: `VIX ${formatGap(vix)}. ${regime}. A neutral regime adds nothing. This is kept separate from the rate gap.`,
  };
}

function chinaDemand(backdrop: MarketBackdrop | undefined): Spec | null {
  if (backdrop?.chinaGrowth == null) return null;
  const previous = backdrop.chinaPrevious;
  const change = previous == null ? null : backdrop.chinaGrowth - previous;
  return {
    id: "china",
    label: "China demand",
    weight: 0,
    norm: change == null ? clamp((backdrop.chinaGrowth - 4) / 2, -1, 1) : clamp(change / 1.2, -1, 1),
    detail:
      previous == null
        ? `China growth ${formatGap(backdrop.chinaGrowth)}% in the IMF outlook. No prior year was available, so this is measured against a 4% reference. Iron ore is not in this feed.`
        : `China growth ${formatGap(backdrop.chinaGrowth)}% versus ${formatGap(previous)}% the year before. This is a small activity offset only. It is not a second growth score, and it is not iron ore.`,
  };
}

function describeReading(
  id: PairId,
  bullish: number,
  drivers: Driver[],
  regime: RiskRegime,
): { confidence: Confidence; dominant: string | null; counterforce: string | null; available: number; wanted: number; missing: string[]; why: string } {
  const plan = COVERAGE[id];
  const missing = plan.wanted.filter((name) => !hasSlot(name, drivers, regime));
  const wanted = plan.wanted.length;
  const available = wanted - missing.length;
  const ratio = wanted === 0 ? 0 : available / wanted;
  const ranked = [...drivers].sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  const dominant = ranked.find((driver) => Math.abs(driver.norm) >= 0.08)?.label ?? ranked[0]?.label ?? null;
  const oppose = ranked.find((driver) => Math.abs(bullish - 50) >= 3 && Math.abs(driver.norm) >= 0.2 && Math.sign(driver.norm) !== Math.sign(bullish - 50));
  const strongest = ranked.reduce((max, driver) => Math.max(max, Math.abs(driver.norm)), 0);
  let confidence: Confidence;
  if (drivers.length === 0 || strongest < 0.2 || ratio < 0.67) confidence = "Low";
  else if (ratio < 1 || oppose || (bullish > 42 && bullish < 58) || strongest < 0.34) confidence = "Medium";
  else confidence = "High";
  if (plan.cap === "Low") confidence = "Low";
  else if (plan.cap === "Medium" && confidence === "High") confidence = "Medium";
  const why = whyLine(id, drivers, regime, dominant, oppose?.label ?? null, missing, plan.note);
  return { confidence, dominant, counterforce: oppose?.label ?? null, available, wanted, missing, why };
}

function hasSlot(name: string, drivers: Driver[], regime: RiskRegime): boolean {
  if (name === "Risk regime") return regime !== "Not in the feed";
  if (ALWAYS_MISSING.has(name)) return false;
  return drivers.some((driver) => driver.label === name);
}

const ALWAYS_MISSING = new Set(["Iron ore", "Disease", "Arrivals", "Palm oil price", "Nigerian production"]);

const COVERAGE: Record<PairId, { wanted: string[]; cap: Confidence | null; note: string | null }> = {
  EURUSD: { wanted: ["Real rate", "Growth", "External balance", "Risk regime"], cap: null, note: null },
  AUDUSD: {
    wanted: ["Real rate", "Growth", "External balance", "Risk regime", "Iron ore"],
    cap: null,
    note: "Iron ore is missing, so China activity is only a small offset and not a second growth score.",
  },
  EURGBP: {
    wanted: ["Real rate", "Growth", "External balance"],
    cap: null,
    note: "Not in this model yet: the BoE/ECB expected-rate differential. No forecast is substituted.",
  },
  EURCHF: { wanted: ["Real rate", "Growth", "External balance", "Risk regime"], cap: null, note: null },
  USDCAD: {
    wanted: ["Real rate", "Growth", "Energy terms of trade", "Risk regime"],
    cap: null,
    note: "Canada's external balance is left out so the oil price is not counted twice.",
  },
  USDCHF: { wanted: ["Real rate", "Growth", "External balance", "Risk regime"], cap: null, note: null },
  USDNGN: {
    wanted: ["Real rate", "Growth", "External balance", "Oil and dollar supply"],
    cap: "Medium",
    note: "Structurally appropriate, but data-constrained. Reserves, intervention, and oil production are not in this feed.",
  },
  BTCUSD: { wanted: ["Real yield", "Dollar", "Risk regime"], cap: null, note: null },
  XAUUSD: { wanted: ["Real yield", "Dollar", "Risk regime"], cap: null, note: null },
  XAGUSD: { wanted: ["Real yield", "Dollar", "Industrial demand", "Risk regime"], cap: null, note: null },
  COCOA: {
    wanted: ["Weather", "Temperature", "Production", "Grindings", "Inventories", "Disease", "Arrivals"],
    cap: "Medium",
    note: "Disease reports, port arrivals, and the crop calendar are not in this feed.",
  },
  PALM: {
    wanted: ["Weather", "Temperature", "Kernel supply", "Kernel production", "Oil-palm production", "Kernel-oil exports", "Palm oil price", "Nigerian production"],
    cap: "Medium",
    note: "Palm oil price, Indonesian production, and Nigerian production are not in this feed. Kernel figures are Malaysia only.",
  },
};

function whyLine(
  id: PairId,
  drivers: Driver[],
  regime: RiskRegime,
  dominant: string | null,
  counterforce: string | null,
  missing: string[],
  note: string | null,
): string {
  const byLabel = (label: string) => drivers.find((driver) => driver.label === label);
  const bits: string[] = [];
  if (id === "XAUUSD" || id === "BTCUSD" || id === "XAGUSD") {
    const real = byLabel("Real yield");
    const dollar = byLabel("Dollar");
    if (real && real.norm < -0.05) bits.push("A higher real yield weighs on it.");
    else if (real && real.norm > 0.05) bits.push("A lower real yield supports it.");
    if (dollar && dollar.norm < -0.05) bits.push("A firmer dollar weighs on it.");
    else if (dollar && dollar.norm > 0.05) bits.push("A softer dollar supports it.");
    if (id === "XAUUSD" && regime === "Neutral") bits.push("Risk appetite is neutral, so gold gets no defensive support.");
    if (id === "XAUUSD" && regime === "Risk-off") bits.push("Risk-off is scored as support for gold, unlike Bitcoin.");
    if (id === "BTCUSD" && regime === "Neutral") bits.push("Risk appetite is neutral, so it adds nothing.");
    if (id === "XAGUSD") bits.push("The industrial leg is China activity, not a copy of gold.");
  } else if (dominant) {
    bits.push(`${dominant} is doing the most work.`);
    if (counterforce) bits.push(`${counterforce} points the other way.`);
    if ((id === "AUDUSD" || id === "EURUSD" || id === "EURCHF" || id === "USDCHF" || id === "USDCAD") && regime === "Neutral") {
      bits.push("The risk regime is neutral, so it does not adjust the score.");
    }
  }
  if (missing.length > 0) bits.push(`Missing: ${missing.join(", ")}.`);
  if (note) bits.push(note);
  return bits.join(" ");
}

export function buildOutlook(args: {
  now: Date;
  economies: RawEconomy[];
  spots: Partial<Record<PairId, number | null>>;
  fxDate: string | null;
  backdrop?: MarketBackdrop;
  series?: Partial<Record<PairId, DailyClose[]>>;
  history?: HistoryStatus;
  stale?: boolean;
  marketRetrievedAt?: string;
  officialInputsRetrievedAt?: string;
}): Outlook {
  const { year0, year1, weight0, weight1 } = outlookWeights(args.now);
  const byCode = new Map(args.economies.map((economy) => [economy.code, economy]));

  const currencies: CurrencySnap[] = ECONOMY_CODES.map((code) => {
    const raw = byCode.get(code);
    if (!raw) throw new Error(`Missing economy ${code}`);
    const inflation = blendYears(raw.inflationByYear, year0, year1, weight0, weight1);
    const growth = blendYears(raw.growthByYear, year0, year1, weight0, weight1);
    const currentAccount = blendYears(raw.currentAccountByYear, year0, year1, weight0, weight1);
    const unemployment = blendYears(raw.unemploymentByYear, year0, year1, weight0, weight1);
    if (inflation == null || growth == null || currentAccount == null) {
      throw new Error(`Incomplete IMF outlook for ${code}`);
    }
    return {
      code,
      policyRate: raw.policyRate,
      policyAsOf: raw.policyAsOf,
      policyPrevious: raw.policyPrevious,
      policyChanged: raw.policyChanged,
      policySource: raw.policySource,
      policyLevel: raw.policyLevel,
      policyMeeting: raw.policyMeeting,
      policyMeetingHeld: raw.policyMeetingHeld,
      inflation,
      realRate: raw.policyRate - inflation,
      growth,
      growthPrevious: priorYear(raw.growthByYear, year0 - 1),
      currentAccount,
      unemployment,
    };
  });

  const snap = new Map(currencies.map((currency) => [currency.code, currency]));

  const pairs: PairOutlook[] = PAIRS.map(({ id, base, quote }) => {
    const fx = id as FxId;
    const b = snap.get(base);
    const q = snap.get(quote);
    const bRaw = byCode.get(base);
    const qRaw = byCode.get(quote);
    if (!b || !q || !bRaw || !qRaw) throw new Error(`Missing pair legs for ${id}`);

    const realLevel = clamp((b.realRate - q.realRate) / SCALES.real, -1, 1);
    const baseMove = b.policyPrevious == null ? null : b.policyRate - b.policyPrevious;
    const quoteMove = q.policyPrevious == null ? null : q.policyRate - q.policyPrevious;
    const policyShift =
      baseMove == null || quoteMove == null ? null : (baseMove - quoteMove) / SCALES.real;
    const growthLevel = clamp((b.growth - q.growth) / SCALES.growth, -1, 1);
    const growthPrevious =
      b.growthPrevious == null || q.growthPrevious == null
        ? null
        : clamp((b.growthPrevious - q.growthPrevious) / SCALES.growth, -1, 1);
    const externalLevel = clamp((b.currentAccount - q.currentAccount) / SCALES.external, -1, 1);
    const externalPreviousGap = (() => {
      const left = priorYear(bRaw.currentAccountByYear, year0 - 1);
      const right = priorYear(qRaw.currentAccountByYear, year0 - 1);
      return left == null || right == null ? null : left - right;
    })();

    const appetite = riskAppetite(args.backdrop?.vix ?? null);
    const china = chinaDemand(args.backdrop);
    const oilUp =
      args.backdrop?.crudeChange == null
        ? null
        : clamp(-args.backdrop.crudeChange / 0.2, -1, 1);
    const oilDetail = (story: string) =>
      `Crude oil ${formatSignedPct(args.backdrop?.crudeChange ?? 0)} over three months. ${story}`;

    const specs: { id: DriverId; label?: string; weight: number; norm: number; detail: string }[] = [
      {
        id: "real",
        label: "Real rate",
        weight: REAL_WEIGHT[fx],
        norm: applyPath(realLevel, policyShift),
        detail: `${base} real ${formatGap(b.realRate)} (${policyNote(b)}) · ${quote} real ${formatGap(q.realRate)} (${policyNote(q)}). This is the current real-rate gap, not a market-implied policy path.`,
      },
      {
        id: "growth",
        weight: GROWTH_WEIGHT[fx],
        norm: applyHistory(growthLevel, growthPrevious),
        detail: `${base} ${formatGap(b.growth)}% · ${quote} ${formatGap(q.growth)}% IMF outlook for ${year0}. ${year0 - 1} was ${b.growthPrevious == null ? "not in the feed" : `${formatGap(b.growthPrevious)}%`} · ${q.growthPrevious == null ? "not in the feed" : `${formatGap(q.growthPrevious)}%`}.`,
      },
      {
        id: "external",
        weight: EXTERNAL_WEIGHT[fx],
        norm: externalLevel,
        detail: `${base} ${formatGap(b.currentAccount)}% · ${quote} ${formatGap(q.currentAccount)}% of GDP, IMF outlook for ${year0}${externalPreviousGap == null ? "" : `. ${year0 - 1} gap ${formatGap(externalPreviousGap)}`}.`,
      },
    ];
    if (id === "AUDUSD" && china) specs.push({ ...china, weight: 0.1 });
    if (oilUp != null && (id === "USDCAD" || id === "USDNGN")) {
      specs.push({
        id: "energy",
        label: id === "USDCAD" ? "Energy terms of trade" : "Oil and dollar supply",
        weight: id === "USDCAD" ? 0.3 : 0.4,
        norm: oilUp,
        detail: oilDetail(
          id === "USDCAD"
            ? "Higher oil supports Canadian export income, which leans against USDCAD. The IMF external balance is not also scored, so this oil move is not counted twice."
            : "Higher oil is scored as more Nigerian dollar supply, which leans against USDNGN. Production, reserves, and intervention are not in this feed.",
        ),
      });
    }
    if (appetite.norm != null && Math.abs(appetite.norm) > 0 && RISK_WEIGHT[fx] > 0) {
      const signed = RISK_FLIP.has(id) ? -appetite.norm : appetite.norm;
      specs.push({
        id: "risk",
        weight: RISK_WEIGHT[fx],
        norm: signed,
        detail:
          id === "EURCHF" || id === "USDCHF"
            ? `${appetite.detail} Risk-off is scored as support for the franc.`
            : id === "USDCAD"
              ? `${appetite.detail} Risk-off is scored as support for the dollar side of USDCAD.`
              : appetite.detail,
      });
    }

    const drivers = assemble(specs.filter((spec) => spec.weight > 0));

    const composite = drivers.reduce((sum, driver) => sum + driver.norm * driver.weight, 0);
    const bullish = clamp(Math.round(50 + 50 * composite), 0, 100);
    const reading = readBias(bullish, drivers);
    const meta = describeReading(id, bullish, drivers, appetite.regime);
    const policyBits = [b, q]
      .filter((leg) => leg.policyPrevious != null && Math.abs(leg.policyRate - leg.policyPrevious) >= 0.05)
      .map((leg) => `${leg.code} ${leg.policyRate > (leg.policyPrevious ?? leg.policyRate) ? "raised" : "cut"} its policy rate`);

    return {
      id,
      base,
      quote,
      spot: args.spots[id] ?? null,
      bullish,
      bearish: 100 - bullish,
      label: reading.label,
      tone: reading.tone,
      drivers,
      thesis: thesisFor(id, base, quote, bullish, drivers, policyBits.length > 0 ? `${policyBits.join(" and ")}.` : null),
      regime: appetite.regime,
      confidence: meta.confidence,
      dominant: meta.dominant,
      counterforce: meta.counterforce,
      available: meta.available,
      wanted: meta.wanted,
      missing: meta.missing,
      why: meta.why,
    };
  });

  const dollar = snap.get("USD");
  if (!dollar) throw new Error("Missing US snapshot");
  const assets = scoreDollarAssets(dollar, args.spots, args.backdrop);

  const marketRetrievedAt = args.marketRetrievedAt ?? args.now.toISOString();
  const officialInputsRetrievedAt = args.officialInputsRetrievedAt ?? marketRetrievedAt;
  return {
    fetchedAt: marketRetrievedAt,
    marketRetrievedAt,
    officialInputsRetrievedAt,
    fxDate: args.fxDate,
    year0,
    year1,
    weight0,
    weight1,
    currencies,
    pairs: [...pairs, ...assets],
    series: args.series ?? {},
    history: args.history ?? { ok: true, note: null },
    stale: args.stale === true,
  };
}

function formatSignedPct(change: number): string {
  const points = change * 100;
  const abs = Math.abs(points).toFixed(1);
  return points < 0 ? `−${abs}%` : `+${abs}%`;
}

function weatherSuitability(window: RainWindow | null, place: string): { norm: number; detail: string } | null {
  if (!window || window.normal <= 0) return null;
  const ratio = window.recent / window.normal;
  let norm = 0;
  let why = "near the usual rainfall, so weather is not given a direction";
  if (ratio < 0.85) {
    norm = clamp((0.85 - ratio) / 0.35, 0, 1);
    why = "drier than usual, which is crop stress rather than a bigger crop";
  } else if (ratio > 1.25) {
    norm = clamp((ratio - 1.25) / 0.5, 0, 1);
    why = "wetter than usual, which raises disease, flooding, and harvest risk rather than a bigger crop";
  }
  return {
    norm,
    detail: `${place}: last 30 days ${formatGap(window.recent)} mm versus ${formatGap(window.normal)} mm normal. ${why}.`,
  };
}

function heatStress(window: RainWindow | null, place: string): { norm: number; detail: string } | null {
  if (!window || window.recentTemp == null || window.normalTemp == null) return null;
  const gap = window.recentTemp - window.normalTemp;
  const norm = Math.abs(gap) < 0.6 ? 0 : clamp((Math.abs(gap) - 0.6) / 1.5, 0, 1);
  const why =
    norm === 0
      ? "close to the usual temperature, so heat is not given a direction"
      : gap > 0
        ? "hotter than usual, which is crop stress"
        : "cooler than usual, which is crop stress";
  return {
    norm,
    detail: `${place}: last 30 days ${formatGap(window.recentTemp)}°C versus ${formatGap(window.normalTemp)}°C normal. ${why}.`,
  };
}

function cropPillar(norm: number, weight: number, id: DriverId, label: string, detail: string): Spec {
  return { id, label, weight: Math.abs(norm) < 0.05 ? 0.05 : weight, norm, detail };
}

function scoreDollarAssets(
  usd: CurrencySnap,
  spots: Partial<Record<PairId, number | null>>,
  backdrop: MarketBackdrop | undefined,
): PairOutlook[] {
  const realYield = backdrop?.nominalYield != null ? backdrop.nominalYield - usd.inflation : usd.realRate;
  const level = clamp((0 - realYield) / SCALES.real, -1, 1);
  const yieldMove = backdrop?.yieldChange == null ? null : clamp(-backdrop.yieldChange / 0.75, -1, 1);
  const realNorm = yieldMove == null ? level : clamp(0.65 * level + 0.35 * yieldMove, -1, 1);
  const yieldDate = backdrop?.yieldAsOf ? ` as of ${backdrop.yieldAsOf}` : "";
  const yieldPath =
    backdrop?.yieldChange == null
      ? "The three-month yield change was not available, so only the level is used."
      : backdrop.yieldChange > 0.05
        ? `The yield is up ${formatGap(backdrop.yieldChange)}pp over three months, which adds to that headwind.`
        : backdrop.yieldChange < -0.05
          ? `The yield is down ${formatGap(Math.abs(backdrop.yieldChange))}pp over three months, which offsets part of that headwind.`
          : "The yield is little changed over three months.";
  const realDetail =
    backdrop?.nominalYield != null
      ? `10-year yield ${formatGap(backdrop.nominalYield)}%${yieldDate} minus IMF inflation ${formatGap(usd.inflation)}% for the outlook year. ${yieldPath}`
      : `US real policy rate ${formatGap(usd.realRate)}. ${yieldPath}`;
  const real = { norm: realNorm, detail: realDetail };
  const dollar =
    backdrop?.dollarChange == null
      ? null
      : {
          norm: clamp(-backdrop.dollarChange / 0.04, -1, 1),
          detail: `Dollar index ${formatSignedPct(backdrop.dollarChange)} over three months`,
        };
  const cocoa = weatherSuitability(backdrop?.cocoaRain ?? null, "West Africa");
  const palm = weatherSuitability(backdrop?.palmRain ?? null, "Malaysia and Indonesia");
  const cocoaHeat = heatStress(backdrop?.cocoaRain ?? null, "West Africa");
  const palmHeat = heatStress(backdrop?.palmRain ?? null, "Malaysia and Indonesia");
  const balance = backdrop?.cocoaBalance ?? null;
  const board = backdrop?.palmBoard ?? null;
  const appetite = riskAppetite(backdrop?.vix ?? null);
  const china = chinaDemand(backdrop);
  const industrial =
    china == null
      ? null
      : {
          norm: china.norm,
          detail: `${china.detail} For silver this is industrial demand. Gold does not use it.`,
        };

  const specs: { id: PairId; base: AssetCode; pillars: Spec[] }[] = [
    {
      id: "BTCUSD",
      base: "BTC",
      pillars: [
        { id: "real", weight: 0.35, norm: real.norm, detail: real.detail },
        ...(dollar ? [{ id: "dollar" as const, weight: 0.25, norm: dollar.norm, detail: dollar.detail }] : []),
        ...(appetite.norm == null || appetite.norm === 0 ? [] : [{ id: "risk" as const, weight: 0.4, norm: appetite.norm, detail: `${appetite.detail} Risk-on supports Bitcoin. Flows and regulation are not in this feed.` }]),
      ],
    },
    {
      id: "XAUUSD",
      base: "XAU",
      pillars: [
        { id: "real", weight: 0.5, norm: real.norm, detail: real.detail },
        ...(dollar ? [{ id: "dollar" as const, weight: 0.28, norm: dollar.norm, detail: dollar.detail }] : []),
        ...(appetite.norm == null || appetite.norm === 0
          ? []
          : [{ id: "risk" as const, weight: 0.22, norm: -appetite.norm, detail: `${appetite.detail} Risk-off is scored as support for gold, which is the opposite of Bitcoin.` }]),
      ],
    },
    {
      id: "XAGUSD",
      base: "XAG",
      pillars: [
        { id: "real", weight: 0.32, norm: real.norm, detail: real.detail },
        ...(dollar ? [{ id: "dollar" as const, weight: 0.18, norm: dollar.norm, detail: dollar.detail }] : []),
        ...(industrial ? [{ id: "china" as const, label: "Industrial demand", weight: 0.32, norm: industrial.norm, detail: industrial.detail }] : []),
        ...(appetite.norm == null || appetite.norm === 0 ? [] : [{ id: "risk" as const, weight: 0.18, norm: appetite.norm, detail: `${appetite.detail} Silver keeps a mild risk-on lean because part of it is industrial. It is not a copy of gold.` }]),
      ],
    },
    {
      id: "COCOA",
      base: "COCOA",
      pillars: [
        ...(cocoa ? [cropPillar(cocoa.norm, 0.24, "supply", "Weather", cocoa.detail)] : []),
        ...(cocoaHeat ? [cropPillar(cocoaHeat.norm, 0.12, "temp", "Temperature", cocoaHeat.detail)] : []),
        ...(balance
          ? [
              cropPillar(
                clamp(-balance.productionYoY / 0.12, -1, 1),
                0.24,
                "growth",
                "Production",
                `${balance.note} World production ${formatSignedPct(balance.productionYoY)} year on year. A bigger crop leans against the price.`,
              ),
              cropPillar(
                clamp(balance.grindingsYoY / 0.08, -1, 1),
                0.2,
                "demand",
                "Grindings",
                `World grindings ${formatSignedPct(balance.grindingsYoY)} year on year. Grindings are demand. Port arrivals are not in this feed.`,
              ),
              cropPillar(
                clamp(-balance.stocksYoY / 0.08, -1, 1),
                0.2,
                "stocks",
                "Inventories",
                `End-of-season stocks ${formatSignedPct(balance.stocksYoY)} year on year. Disease reports are not in this feed.`,
              ),
            ]
          : []),
      ],
    },
    {
      id: "PALM",
      base: "PALM",
      pillars: [
        ...(palm ? [cropPillar(palm.norm, 0.18, "supply", "Weather", `${palm.detail} This is kernel weather, not a palm-oil price.`)] : []),
        ...(palmHeat ? [cropPillar(palmHeat.norm, 0.1, "temp", "Temperature", palmHeat.detail)] : []),
        ...(board
          ? [
              cropPillar(
                clamp(-board.kernelStock / 0.25, -1, 1),
                0.24,
                "stocks",
                "Kernel supply",
                `Malaysia palm-kernel stocks are ${formatSignedPct(board.kernelStock)} versus the other months in the MPOB ${board.month} table. This is the nut, not palm oil.`,
              ),
              cropPillar(
                clamp(-board.kernelOutput / 0.3, -1, 1),
                0.16,
                "growth",
                "Kernel production",
                `Malaysia palm-kernel output is ${formatSignedPct(board.kernelOutput)} versus the other months in that table. The seasonal peak is not removed, because last year's same month is not on this page.`,
              ),
              cropPillar(
                clamp(-board.oilPalmOutput / 0.3, -1, 1),
                0.12,
                "energy",
                "Oil-palm production",
                `Malaysia crude palm-oil output is ${formatSignedPct(board.oilPalmOutput)} versus the other months. More fruit means more kernels. This is not the kernel price.`,
              ),
              cropPillar(
                clamp(board.kernelOilExports / 0.25, -1, 1),
                0.14,
                "demand",
                "Kernel-oil exports",
                `Malaysia palm-kernel-oil exports are ${formatSignedPct(board.kernelOilExports)} versus the other months. This is the oil crushed from the kernel, not the nut price and not a crush margin.`,
              ),
            ]
          : []),
      ],
    },
  ];

  return specs.map(({ id, base, pillars }) => {
    const drivers = assemble(pillars);
    const composite = drivers.reduce((sum, driver) => sum + driver.norm * driver.weight, 0);
    const bullish = drivers.length === 0 ? 50 : clamp(Math.round(50 + 50 * composite), 0, 100);
    const reading = readBias(bullish, drivers);
    const meta = describeReading(id, bullish, drivers, appetite.regime);
    const lean =
      drivers.length === 0
        ? `${id} has no fresh input for this reading.`
        : reading.label === "Mixed"
          ? `Bullish and bearish forces are both material for ${id}, so this is mixed rather than a firm lean.`
          : reading.label === "Neutral"
            ? `${id} does not have a large enough gap to call a direction.`
            : bullish >= 53
              ? `The measured backdrop leans toward a higher ${id}.`
              : bullish <= 47
                ? `The measured backdrop leans toward a lower ${id}.`
                : `${id} is close to balanced on the measured backdrop.`;
    return {
      id,
      base,
      quote: "USD" as const,
      spot: spots[id] ?? null,
      bullish,
      bearish: 100 - bullish,
      label: reading.label,
      tone: reading.tone,
      drivers,
      thesis: lean,
      regime: appetite.regime,
      confidence: meta.confidence,
      dominant: meta.dominant,
      counterforce: meta.counterforce,
      available: meta.available,
      wanted: meta.wanted,
      missing: meta.missing,
      why: meta.why,
    };
  });
}

export function formatFlex(n: number): string {
  return formatGap(n);
}

export function formatSpot(n: number): string {
  const digits = n >= 10000 ? 0 : n >= 20 ? 2 : 4;
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatPoints(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  const abs = Math.abs(rounded).toFixed(1);
  if (rounded > 0) return `+${abs}`;
  if (rounded < 0) return `−${abs}`;
  return "0.0";
}

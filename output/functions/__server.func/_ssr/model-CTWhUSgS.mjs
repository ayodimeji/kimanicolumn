//#region node_modules/.nitro/vite/services/ssr/assets/model-CTWhUSgS.js
var ECONOMY_CODES = [
	"USD",
	"EUR",
	"AUD",
	"GBP",
	"CHF",
	"CAD",
	"NGN"
];
var PAIR_IDS = [
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
	"PALM"
];
var ECONOMIES = {
	USD: {
		currency: "US dollar",
		economy: "the United States",
		imf: "USA",
		bis: "US"
	},
	EUR: {
		currency: "euro",
		economy: "the euro area",
		imf: "EURO",
		bis: "XM"
	},
	AUD: {
		currency: "Australian dollar",
		economy: "Australia",
		imf: "AUS",
		bis: "AU"
	},
	GBP: {
		currency: "sterling",
		economy: "the United Kingdom",
		imf: "GBR",
		bis: "GB"
	},
	CHF: {
		currency: "Swiss franc",
		economy: "Switzerland",
		imf: "CHE",
		bis: "CH"
	},
	CAD: {
		currency: "Canadian dollar",
		economy: "Canada",
		imf: "CAN",
		bis: "CA"
	},
	NGN: {
		currency: "naira",
		economy: "Nigeria",
		imf: "NGA",
		bis: ""
	}
};
var PAIRS = [
	{
		id: "EURUSD",
		base: "EUR",
		quote: "USD"
	},
	{
		id: "AUDUSD",
		base: "AUD",
		quote: "USD"
	},
	{
		id: "EURGBP",
		base: "EUR",
		quote: "GBP"
	},
	{
		id: "EURCHF",
		base: "EUR",
		quote: "CHF"
	},
	{
		id: "USDCAD",
		base: "USD",
		quote: "CAD"
	},
	{
		id: "USDCHF",
		base: "USD",
		quote: "CHF"
	},
	{
		id: "USDNGN",
		base: "USD",
		quote: "NGN"
	}
];
/** Full-mark gaps. A wider gap does not push a pillar past its weight. */
var SCALES = {
	real: 2,
	growth: 1.2,
	external: 4,
	employment: 2,
	inflation: 2
};
var WEIGHTS = {
	real: .5,
	growth: .3,
	external: .2,
	employment: 0,
	inflation: 0,
	dollar: 0,
	supply: 0,
	energy: 0
};
var DRIVER_LABEL = {
	real: "Real yield",
	growth: "Growth",
	external: "External balance",
	employment: "Employment",
	inflation: "Inflation",
	dollar: "Dollar",
	supply: "Rainfall",
	energy: "Crude oil"
};
/** StockCharts symbol. Gold and silver charts are $GOLD and $SILVER; $XAUUSD does not draw. */
var CHART_SYMBOL = {
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
	PALM: ""
};
function outlookWeights(now) {
	const year0 = now.getUTCFullYear();
	const weight1 = now.getUTCMonth() >= 6 ? .6 : .35;
	return {
		year0,
		year1: year0 + 1,
		weight0: 1 - weight1,
		weight1
	};
}
function blendYears(series, year0, year1, weight0, weight1) {
	const a = series[String(year0)] ?? null;
	const b = series[String(year1)] ?? null;
	if (a == null && b == null) return null;
	if (a == null) return b;
	if (b == null) return a;
	return weight0 * a + weight1 * b;
}
function clamp(n, lo, hi) {
	return Math.min(hi, Math.max(lo, n));
}
function biasLabel(bullish) {
	if (bullish >= 74) return "Strongly bullish";
	if (bullish >= 58) return "Bullish";
	if (bullish >= 53) return "Lean bullish";
	if (bullish <= 26) return "Strongly bearish";
	if (bullish <= 42) return "Bearish";
	if (bullish <= 47) return "Lean bearish";
	return "Balanced";
}
function toneFor(bullish) {
	if (bullish >= 53) return "bull";
	if (bullish <= 47) return "bear";
	return "neutral";
}
function formatGap(n) {
	const digits = Math.abs(n * 100 - Math.round(n * 100)) > .05 ? 3 : 2;
	const abs = Math.abs(n).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: digits
	});
	return n < 0 ? `−${abs}` : abs;
}
function clause(driver, base, quote) {
	if (Math.abs(driver.points) < .8) return null;
	const favor = driver.points >= 0 ? base : quote;
	switch (driver.id) {
		case "real": return `${favor} has the higher real policy rate.`;
		case "growth": return `The growth outlook favors ${favor}.`;
		case "external": return `${favor} has the stronger external balance.`;
		case "employment": return `The jobs market is tighter in ${ECONOMIES[favor].economy}.`;
		case "energy": return driver.points >= 0 ? "Lower oil leans against the naira." : "Higher oil supports the naira.";
		default: return null;
	}
}
function thesisFor(id, base, quote, bullish, drivers) {
	return [bullish >= 53 ? `Fundamentals lean toward a higher ${id}.` : bullish <= 47 ? `Fundamentals lean toward a lower ${id}.` : `${id} is close to balanced on these fundamentals.`, ...[...drivers].sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).map((driver) => clause(driver, base, quote)).filter((line) => Boolean(line)).slice(0, 2)].join(" ");
}
function buildOutlook(args) {
	const { year0, year1, weight0, weight1 } = outlookWeights(args.now);
	const byCode = new Map(args.economies.map((economy) => [economy.code, economy]));
	const currencies = ECONOMY_CODES.map((code) => {
		const raw = byCode.get(code);
		if (!raw) throw new Error(`Missing economy ${code}`);
		const inflation = blendYears(raw.inflationByYear, year0, year1, weight0, weight1);
		const growth = blendYears(raw.growthByYear, year0, year1, weight0, weight1);
		const currentAccount = blendYears(raw.currentAccountByYear, year0, year1, weight0, weight1);
		const unemployment = blendYears(raw.unemploymentByYear, year0, year1, weight0, weight1);
		if (inflation == null || growth == null || currentAccount == null) throw new Error(`Incomplete IMF outlook for ${code}`);
		return {
			code,
			policyRate: raw.policyRate,
			policyAsOf: raw.policyAsOf,
			inflation,
			realRate: raw.policyRate - inflation,
			growth,
			currentAccount,
			unemployment
		};
	});
	const snap = new Map(currencies.map((currency) => [currency.code, currency]));
	const pairs = PAIRS.map(({ id, base, quote }) => {
		const b = snap.get(base);
		const q = snap.get(quote);
		if (!b || !q) throw new Error(`Missing pair legs for ${id}`);
		const specs = [
			{
				id: "real",
				weight: id === "USDNGN" ? .4 : WEIGHTS.real,
				norm: clamp((b.realRate - q.realRate) / SCALES.real, -1, 1),
				detail: `${base} ${formatGap(b.realRate)} · ${quote} ${formatGap(q.realRate)}`
			},
			{
				id: "growth",
				weight: id === "USDNGN" ? .2 : WEIGHTS.growth,
				norm: clamp((b.growth - q.growth) / SCALES.growth, -1, 1),
				detail: `${base} ${formatGap(b.growth)}% · ${quote} ${formatGap(q.growth)}%`
			},
			{
				id: "external",
				weight: id === "USDNGN" ? .15 : WEIGHTS.external,
				norm: clamp((b.currentAccount - q.currentAccount) / SCALES.external, -1, 1),
				detail: `${base} ${formatGap(b.currentAccount)}% · ${quote} ${formatGap(q.currentAccount)}% of GDP`
			}
		];
		if (id === "USDNGN" && args.backdrop?.crudeChange != null) specs.push({
			id: "energy",
			weight: .25,
			norm: clamp(-args.backdrop.crudeChange / .2, -1, 1),
			detail: `Crude oil ${formatSignedPct(args.backdrop.crudeChange)} over three months`
		});
		const weightSum = specs.reduce((sum, spec) => sum + spec.weight, 0);
		const drivers = specs.map((spec) => {
			const weight = spec.weight / weightSum;
			return {
				id: spec.id,
				label: spec.id === "real" ? "Real rate" : DRIVER_LABEL[spec.id],
				weight,
				norm: spec.norm,
				points: weight * spec.norm * 50,
				detail: spec.detail
			};
		});
		const composite = drivers.reduce((sum, driver) => sum + driver.norm * driver.weight, 0);
		const bullish = clamp(Math.round(50 + 50 * composite), 0, 100);
		return {
			id,
			base,
			quote,
			spot: args.spots[id] ?? null,
			bullish,
			bearish: 100 - bullish,
			label: biasLabel(bullish),
			tone: toneFor(bullish),
			drivers,
			thesis: thesisFor(id, base, quote, bullish, drivers)
		};
	});
	const dollar = snap.get("USD");
	if (!dollar) throw new Error("Missing US snapshot");
	const assets = scoreDollarAssets(dollar, args.spots, args.backdrop);
	return {
		fetchedAt: args.now.toISOString(),
		fxDate: args.fxDate,
		year0,
		year1,
		weight0,
		weight1,
		currencies,
		pairs: [...pairs, ...assets],
		series: args.series ?? {},
		history: args.history ?? {
			ok: true,
			note: null
		}
	};
}
function formatSignedPct(change) {
	const points = change * 100;
	const abs = Math.abs(points).toFixed(1);
	return points < 0 ? `−${abs}%` : `+${abs}%`;
}
function rainNorm(window) {
	if (!window || window.normal <= 0) return null;
	return {
		norm: clamp((1 - window.recent / window.normal) / .5, -1, 1),
		detail: `Last 30 days ${formatGap(window.recent)} mm vs ${formatGap(window.normal)} mm`
	};
}
function scoreDollarAssets(usd, spots, backdrop) {
	const realYield = backdrop?.nominalYield != null ? backdrop.nominalYield - usd.inflation : usd.realRate;
	const realDetail = backdrop?.nominalYield != null ? `10-year yield ${formatGap(backdrop.nominalYield)}% minus inflation ${formatGap(usd.inflation)}%` : `US real policy rate ${formatGap(usd.realRate)}`;
	const real = {
		norm: clamp((0 - realYield) / SCALES.real, -1, 1),
		detail: realDetail
	};
	const dollar = backdrop?.dollarChange == null ? null : {
		norm: clamp(-backdrop.dollarChange / .04, -1, 1),
		detail: `Dollar index ${formatSignedPct(backdrop.dollarChange)} over three months`
	};
	const china = backdrop?.chinaGrowth;
	const growth = {
		norm: clamp(((china == null ? usd.growth : (usd.growth + china) / 2) - (china == null ? 2 : 3)) / SCALES.growth, -1, 1),
		detail: china == null ? `US growth ${formatGap(usd.growth)}% vs a 2% trend` : `US ${formatGap(usd.growth)}% · China ${formatGap(china)}%`
	};
	const cocoa = rainNorm(backdrop?.cocoaRain ?? null);
	const palm = rainNorm(backdrop?.palmRain ?? null);
	const crude = backdrop?.crudeChange == null ? null : {
		norm: clamp(backdrop.crudeChange / .2, -1, 1),
		detail: `Crude oil ${formatSignedPct(backdrop.crudeChange)} over three months`
	};
	return [
		{
			id: "BTCUSD",
			base: "BTC",
			pillars: [{
				id: "real",
				weight: .6,
				scored: real
			}, {
				id: "dollar",
				weight: .4,
				scored: dollar
			}]
		},
		{
			id: "XAUUSD",
			base: "XAU",
			pillars: [{
				id: "real",
				weight: .7,
				scored: real
			}, {
				id: "dollar",
				weight: .3,
				scored: dollar
			}]
		},
		{
			id: "XAGUSD",
			base: "XAG",
			pillars: [
				{
					id: "real",
					weight: .45,
					scored: real
				},
				{
					id: "dollar",
					weight: .25,
					scored: dollar
				},
				{
					id: "growth",
					weight: .3,
					scored: growth
				}
			]
		},
		{
			id: "COCOA",
			base: "COCOA",
			pillars: [{
				id: "supply",
				weight: 1,
				scored: cocoa
			}]
		},
		{
			id: "PALM",
			base: "PALM",
			pillars: [{
				id: "supply",
				weight: .7,
				scored: palm
			}, {
				id: "energy",
				weight: .3,
				scored: crude
			}]
		}
	].map(({ id, base, pillars }) => {
		const live = pillars.filter((pillar) => pillar.scored);
		const weightSum = live.reduce((sum, pillar) => sum + pillar.weight, 0) || 1;
		const drivers = live.map((pillar) => {
			const weight = pillar.weight / weightSum;
			const scored = pillar.scored;
			return {
				id: pillar.id,
				label: DRIVER_LABEL[pillar.id],
				weight,
				norm: scored.norm,
				points: weight * scored.norm * 50,
				detail: scored.detail
			};
		});
		const composite = drivers.reduce((sum, driver) => sum + driver.norm * driver.weight, 0);
		const bullish = drivers.length === 0 ? 50 : clamp(Math.round(50 + 50 * composite), 0, 100);
		const lean = drivers.length === 0 ? `${id} has no fresh input for this reading.` : bullish >= 53 ? `The measured backdrop leans toward a higher ${id}.` : bullish <= 47 ? `The measured backdrop leans toward a lower ${id}.` : `${id} is close to balanced on the measured backdrop.`;
		return {
			id,
			base,
			quote: "USD",
			spot: spots[id] ?? null,
			bullish,
			bearish: 100 - bullish,
			label: biasLabel(bullish),
			tone: toneFor(bullish),
			drivers,
			thesis: lean
		};
	});
}
function formatFlex(n) {
	return formatGap(n);
}
function formatSpot(n) {
	const digits = n >= 1e4 ? 0 : n >= 20 ? 2 : 4;
	return n.toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}
//#endregion
export { blendYears as a, formatSpot as c, PAIR_IDS as i, outlookWeights as l, ECONOMIES as n, buildOutlook as o, ECONOMY_CODES as r, formatFlex as s, CHART_SYMBOL as t };

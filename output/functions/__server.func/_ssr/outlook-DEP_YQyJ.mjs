import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { a as blendYears, l as outlookWeights, n as ECONOMIES, o as buildOutlook, r as ECONOMY_CODES } from "./model-CTWhUSgS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/outlook-DEP_YQyJ.js
var KEEP_DAYS = 200;
var STORED = ["USDNGN", "PALM"];
function emptyBook() {
	return {
		ok: false,
		series: {}
	};
}
function floorDay(now) {
	const cutoff = new Date(now);
	cutoff.setUTCDate(cutoff.getUTCDate() - KEEP_DAYS);
	return cutoff.toISOString().slice(0, 10);
}
function asCloses(rows) {
	const series = {};
	for (const row of rows) {
		const close = typeof row.close === "number" ? row.close : Number(row.close);
		if (!Number.isFinite(close) || close <= 0) continue;
		const id = row.instrument;
		const point = {
			date: String(row.day).slice(0, 10),
			close
		};
		const list = series[id] ?? [];
		list.push(point);
		series[id] = list;
	}
	for (const id of Object.keys(series)) series[id]?.sort((a, b) => a.date.localeCompare(b.date));
	return series;
}
/**
* Save today's prints and return stored daily closes.
* Persistence is Postgres (Neon when deployed, in-memory PGLite in preview).
* Never touches the local disk: Vercel functions cannot mkdir a project folder.
* Failures are returned, not thrown, so a store outage does not blank the desk.
*/
async function syncCloses(prints, now) {
	const day = now.toISOString().slice(0, 10);
	const floor = floorDay(now);
	try {
		const { getSql } = await import("./db-DIg1BU-6.mjs");
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
		return {
			ok: true,
			series: asCloses(await sql`
      select instrument, day::text as day, close
      from spot_closes
      where instrument in (${STORED[0]}, ${STORED[1]})
      order by day asc
    `)
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "history store failed";
		console.error("[spot-history]", message);
		return emptyBook();
	}
}
function mergeCloses(base, extra) {
	const byDate = /* @__PURE__ */ new Map();
	for (const point of base) byDate.set(point.date, point.close);
	for (const point of extra) byDate.set(point.date, point.close);
	return [...byDate.entries()].map(([date, close]) => ({
		date,
		close
	})).sort((a, b) => a.date.localeCompare(b.date));
}
function dailyCloses(text) {
	if (!text) return [];
	try {
		const result = JSON.parse(text).chart?.result?.[0];
		const times = result?.timestamp ?? [];
		const closes = result?.indicators?.quote?.[0]?.close ?? [];
		const points = [];
		for (let index = 0; index < times.length; index += 1) {
			const close = closes[index];
			const time = times[index];
			if (typeof close !== "number" || close <= 0 || typeof time !== "number") continue;
			points.push({
				date: (/* @__PURE__ */ new Date(time * 1e3)).toISOString().slice(0, 10),
				close
			});
		}
		return points;
	} catch {
		return [];
	}
}
var IMF = "https://www.imf.org/external/datamapper/api/v1";
var BIS = "https://stats.bis.org/api/v1/data/WS_CBPOL/D.US+XM+AU+GB+CH+CA?lastNObservations=1&format=csv";
var BTC_SPOT = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
var XAU_SPOT = "https://api.gold-api.com/price/XAU";
var XAG_SPOT = "https://api.gold-api.com/price/XAG";
var YIELD = "https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=5d";
var DOLLAR = "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=3mo";
var CRUDE = "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=3mo";
var COCOA_PX = "https://query1.finance.yahoo.com/v8/finance/chart/CC%3DF?interval=1m&range=1d";
var NGN_PX = "https://query1.finance.yahoo.com/v8/finance/chart/NGN%3DX?interval=1d&range=6mo";
var MPOB_RELEASE = "https://price.mpob.gov.my/pdf/monthly/release";
var CBN_MPR = "https://www.cbn.gov.ng/api/GetAllMoneyMarketIndicators";
var BOC_TARGET = "https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/";
var FX_LIVE = [
	["EURUSD", "EURUSD=X"],
	["AUDUSD", "AUDUSD=X"],
	["EURGBP", "EURGBP=X"],
	["EURCHF", "EURCHF=X"],
	["USDCAD", "USDCAD=X"],
	["USDCHF", "USDCHF=X"]
];
var TTL_MS = 6e4;
var cache = null;
function quoteUrl(symbol) {
	return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
}
function readSeries(text) {
	if (!text) return {
		last: null,
		change: null,
		time: null
	};
	try {
		const result = JSON.parse(text).chart?.result?.[0];
		const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter((value) => typeof value === "number" && Number.isFinite(value) && value > 0);
		const last = result?.meta?.regularMarketPrice;
		const end = typeof last === "number" && last > 0 ? last : closes.at(-1) ?? null;
		const first = closes[0];
		const time = result?.meta?.regularMarketTime;
		return {
			last: end,
			change: first && end ? end / first - 1 : null,
			time: typeof time === "number" ? time : null
		};
	} catch {
		return {
			last: null,
			change: null,
			time: null
		};
	}
}
function readPalmKernelRm(text) {
	const start = text.indexOf("Pen. Malaysia Palm Kernel");
	const end = text.indexOf("Crude Palm Kernel Oil");
	if (start < 0 || end < start) return null;
	const spot = ((text.slice(start, end).split("Pen. Malaysia Average").pop() ?? "").match(/[0-9,]+\.[0-9]+|NT/g) ?? []).slice(0, 4).find((token) => token !== "NT");
	if (!spot) return null;
	const rm = Number(spot.replace(/,/g, ""));
	return rm >= 1e3 && rm <= 4500 ? rm : null;
}
async function pdfText(bytes) {
	const { inflateSync, inflateRawSync } = await import("node:zlib");
	const raw = Buffer.from(bytes).toString("latin1");
	const chunks = [];
	for (const match of raw.matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
		const body = Buffer.from(match[1], "latin1");
		for (const inflate of [inflateSync, inflateRawSync]) try {
			chunks.push(inflate(body).toString("latin1"));
			break;
		} catch {}
	}
	const words = [];
	for (const block of chunks.join("\n").matchAll(/\[(.*?)\]\s*TJ/gs)) {
		let line = "";
		for (const bit of block[1].matchAll(/\((?:\\.|[^)])*\)/g)) line += bit[0].slice(1, -1).replace(/\\\(/g, "(").replace(/\\\)/g, ")");
		if (line.trim()) words.push(line.trim());
	}
	return words.join("\n");
}
function mpobMonths(now) {
	const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
	const months = [];
	for (let index = 0; index < 3; index += 1) {
		months.push({
			year: cursor.getUTCFullYear(),
			month: cursor.getUTCMonth() + 1
		});
		cursor.setUTCMonth(cursor.getUTCMonth() - 1);
	}
	return months;
}
/** MPOB Peninsular Malaysia palm kernel ex-mill (the nut), in USD per tonne. Not palm oil and not palm kernel oil. */
async function fetchPalmKernel(now) {
	try {
		let rm = null;
		for (const { year, month } of mpobMonths(now)) {
			const stamp = `${year}-${String(month).padStart(2, "0")}-01%2000:00:00`;
			const response = await fetch(`${MPOB_RELEASE}/${stamp}`, {
				headers: { "user-agent": "Mozilla/5.0" },
				signal: AbortSignal.timeout(18e3)
			});
			if (!response.ok) continue;
			const bytes = new Uint8Array(await response.arrayBuffer());
			if (bytes[0] !== 37) continue;
			rm = readPalmKernelRm(await pdfText(bytes));
			if (rm != null) break;
		}
		if (rm == null) return null;
		const ringgit = readSeries(await fetchText(quoteUrl("MYR=X"), "application/json")).last;
		if (ringgit == null || ringgit < 2 || ringgit > 8) return null;
		const usd = rm / ringgit;
		return usd > 200 && usd < 2e3 ? usd : null;
	} catch {
		return null;
	}
}
async function fetchLiveFx() {
	const rows = await Promise.all(FX_LIVE.map(async ([id, symbol]) => {
		try {
			const quote = readSeries(await fetchText(quoteUrl(symbol), "application/json"));
			return {
				id,
				price: quote.last,
				time: quote.time
			};
		} catch {
			return {
				id,
				price: null,
				time: null
			};
		}
	}));
	const spots = {};
	let newest = 0;
	for (const row of rows) {
		if (row.price != null) spots[row.id] = row.price;
		if (row.time != null && row.time > newest) newest = row.time;
	}
	return {
		spots,
		fxDate: newest > 0 ? (/* @__PURE__ */ new Date(newest * 1e3)).toISOString().slice(0, 10) : null
	};
}
function isoDay(date) {
	return date.toISOString().slice(0, 10);
}
function yearsAgo(date, years) {
	const next = new Date(date);
	next.setUTCFullYear(next.getUTCFullYear() - years);
	return isoDay(next);
}
async function rainTotal(lat, lon, start, end) {
	const text = await fetchText(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum`, "application/json");
	const days = (JSON.parse(text).daily?.precipitation_sum ?? []).filter((value) => typeof value === "number");
	if (days.length < 15) return null;
	return days.reduce((sum, value) => sum + value, 0);
}
async function rainWindow(points, now) {
	const end = new Date(now);
	end.setUTCDate(end.getUTCDate() - 1);
	const start = new Date(end);
	start.setUTCDate(start.getUTCDate() - 29);
	const recentStart = isoDay(start);
	const recentEnd = isoDay(end);
	const ready = (await Promise.all(points.map(async (point) => {
		const [recent, priorYear, twoYears] = await Promise.all([
			rainTotal(point.lat, point.lon, recentStart, recentEnd).catch(() => null),
			rainTotal(point.lat, point.lon, yearsAgo(start, 1), yearsAgo(end, 1)).catch(() => null),
			rainTotal(point.lat, point.lon, yearsAgo(start, 2), yearsAgo(end, 2)).catch(() => null)
		]);
		const prior = [priorYear, twoYears].filter((value) => value != null);
		if (recent == null || prior.length === 0) return null;
		return {
			recent,
			normal: prior.reduce((sum, value) => sum + value, 0) / prior.length
		};
	}))).filter((sample) => sample != null);
	if (ready.length === 0) return null;
	return {
		recent: ready.reduce((sum, sample) => sum + sample.recent, 0) / ready.length,
		normal: ready.reduce((sum, sample) => sum + sample.normal, 0) / ready.length
	};
}
function readAmount(text) {
	if (!text) return null;
	try {
		const payload = JSON.parse(text);
		const amount = payload.data?.amount != null ? Number(payload.data.amount) : payload.price;
		if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) return amount;
	} catch {
		return null;
	}
	return null;
}
function asNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
	return null;
}
function seriesFrom(payload, indicator, imfCode) {
	const row = payload.values?.[indicator]?.[imfCode];
	if (!row) throw new Error(`The IMF outlook feed has no ${indicator} series for ${imfCode}.`);
	const series = {};
	for (const [year, value] of Object.entries(row)) series[year] = asNumber(value);
	return series;
}
async function fetchText(url, accept) {
	let last = "the feed did not respond";
	for (let attempt = 0; attempt < 2; attempt += 1) try {
		const response = await fetch(url, {
			headers: {
				accept,
				"user-agent": attempt === 0 ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" : "curl/8.5.0"
			},
			signal: AbortSignal.timeout(18e3)
		});
		if (!response.ok) {
			last = `status ${response.status}`;
			continue;
		}
		return await response.text();
	} catch (error) {
		last = error instanceof Error ? error.message : "network error";
	}
	throw new Error(last);
}
function isoDaysBefore(iso, days) {
	const time = Date.parse(`${iso}T00:00:00Z`);
	if (!Number.isFinite(time)) return iso;
	return (/* @__PURE__ */ new Date(time - days * 864e5)).toISOString().slice(0, 10);
}
/** BIS reprints the previous overnight target for a few sessions after a decision. */
async function fetchCanadaTarget() {
	try {
		const html = await fetchText(BOC_TARGET, "text/html");
		const match = /data-date="(\d{4}-\d{2}-\d{2})"[\s\S]*?<td>\s*([0-9]+(?:\.[0-9]+)?)/.exec(html);
		if (!match) return null;
		const rate = Number(match[2]);
		if (!Number.isFinite(rate)) return null;
		return {
			date: match[1],
			rate
		};
	} catch {
		return null;
	}
}
function parseNairaPolicy(text) {
	const ready = JSON.parse(text).filter((row) => typeof row.tyear === "number" && typeof row.tmonth === "number" && Number(row.mpr) > 0);
	if (ready.length === 0) throw new Error("CBN policy-rate feed has no MPR.");
	ready.sort((a, b) => a.tyear * 12 + a.tmonth - (b.tyear * 12 + b.tmonth));
	const last = ready[ready.length - 1];
	const date = new Date(Date.UTC(last.tyear, last.tmonth, 0)).toISOString().slice(0, 10);
	return {
		rate: Number(last.mpr),
		date
	};
}
function parseBis(csv) {
	const out = /* @__PURE__ */ new Map();
	for (const line of csv.split(/\r?\n/)) {
		const area = /^D,([A-Z]{2}),/.exec(line);
		if (!area) continue;
		const last = [...line.matchAll(/,(\d{4}-\d{2}-\d{2}),(-?\d+(?:\.\d+)?),/g)].at(-1);
		if (!last) continue;
		out.set(area[1], {
			date: last[1],
			rate: Number(last[2])
		});
	}
	return out;
}
async function loadOutlook(now) {
	const [gdpText, cpiText, caText, lurText, bisText, canadaTarget, fxLive, btcText, xauText, xagText, yieldText, dollarText, crudeText, cocoaText, palmUsd, cocoaRain, palmRain, cbnText, ngnText] = await Promise.all([
		fetchText(`${IMF}/NGDP_RPCH`, "application/json").catch((error) => {
			throw new Error(`IMF growth feed unavailable (${error.message}).`);
		}),
		fetchText(`${IMF}/PCPIPCH`, "application/json").catch((error) => {
			throw new Error(`IMF inflation feed unavailable (${error.message}).`);
		}),
		fetchText(`${IMF}/BCA_NGDPD`, "application/json").catch((error) => {
			throw new Error(`IMF external-balance feed unavailable (${error.message}).`);
		}),
		fetchText(`${IMF}/LUR`, "application/json").catch((error) => {
			throw new Error(`IMF unemployment feed unavailable (${error.message}).`);
		}),
		fetchText(BIS, "text/csv").catch((error) => {
			throw new Error(`BIS policy-rate feed unavailable (${error.message}).`);
		}),
		fetchCanadaTarget(),
		fetchLiveFx(),
		fetchText(BTC_SPOT, "application/json").catch(() => ""),
		fetchText(XAU_SPOT, "application/json").catch(() => ""),
		fetchText(XAG_SPOT, "application/json").catch(() => ""),
		fetchText(YIELD, "application/json").catch(() => ""),
		fetchText(DOLLAR, "application/json").catch(() => ""),
		fetchText(CRUDE, "application/json").catch(() => ""),
		fetchText(COCOA_PX, "application/json").catch(() => ""),
		fetchPalmKernel(now),
		rainWindow([{
			lat: 5.79,
			lon: -6.61
		}, {
			lat: 6.69,
			lon: -1.62
		}], now).catch(() => null),
		rainWindow([{
			lat: 1.86,
			lon: 103
		}, {
			lat: .51,
			lon: 101.45
		}], now).catch(() => null),
		fetchText(CBN_MPR, "application/json").catch((error) => {
			throw new Error(`CBN policy-rate feed unavailable (${error.message}).`);
		}),
		fetchText(NGN_PX, "application/json").catch(() => "")
	]);
	const gdp = JSON.parse(gdpText);
	const cpi = JSON.parse(cpiText);
	const ca = JSON.parse(caText);
	const lur = JSON.parse(lurText);
	const rates = parseBis(bisText);
	const nairaPolicy = parseNairaPolicy(cbnText);
	const economies = ECONOMY_CODES.map((code) => {
		const meta = ECONOMIES[code];
		let policyRate;
		let policyAsOf;
		if (code === "NGN") {
			policyRate = nairaPolicy.rate;
			policyAsOf = nairaPolicy.date;
		} else {
			const policy = rates.get(meta.bis);
			if (!policy || !Number.isFinite(policy.rate)) throw new Error(`BIS has no current policy rate for ${code}.`);
			policyRate = policy.rate;
			policyAsOf = policy.date;
			if (code === "CAD" && canadaTarget && (canadaTarget.date >= policy.date || canadaTarget.rate !== policy.rate && canadaTarget.date >= isoDaysBefore(policy.date, 12))) {
				policyRate = canadaTarget.rate;
				policyAsOf = canadaTarget.date;
			}
		}
		let unemploymentByYear = {};
		try {
			unemploymentByYear = seriesFrom(lur, "LUR", meta.imf);
		} catch {
			unemploymentByYear = {};
		}
		return {
			code,
			policyRate,
			policyAsOf,
			growthByYear: seriesFrom(gdp, "NGDP_RPCH", meta.imf),
			inflationByYear: seriesFrom(cpi, "PCPIPCH", meta.imf),
			currentAccountByYear: seriesFrom(ca, "BCA_NGDPD", meta.imf),
			unemploymentByYear
		};
	});
	const spots = { ...fxLive.spots };
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
	const prints = [];
	if (spots.USDNGN != null) prints.push({
		id: "USDNGN",
		price: spots.USDNGN
	});
	if (spots.PALM != null) prints.push({
		id: "PALM",
		price: spots.PALM
	});
	const stored = await syncCloses(prints, now);
	const history = stored.ok ? {
		ok: true,
		note: null
	} : {
		ok: false,
		note: "Daily closes were not saved. The price-history database did not respond, so the palm kernel line is left blank. USD/NGN still uses the Yahoo six-month series when that feed answers. No prices are filled in."
	};
	const weights = outlookWeights(now);
	let chinaGrowth = null;
	try {
		chinaGrowth = blendYears(seriesFrom(gdp, "NGDP_RPCH", "CHN"), weights.year0, weights.year1, weights.weight0, weights.weight1);
	} catch {
		chinaGrowth = null;
	}
	const yieldSeries = readSeries(yieldText);
	const dollarSeries = readSeries(dollarText);
	const crudeSeries = readSeries(crudeText);
	const backdrop = {
		nominalYield: yieldSeries.last,
		dollarChange: dollarSeries.change,
		chinaGrowth,
		cocoaRain,
		palmRain,
		crudeChange: crudeSeries.change
	};
	return buildOutlook({
		now,
		economies,
		spots,
		fxDate,
		backdrop,
		series: {
			USDNGN: mergeCloses(dailyCloses(ngnText), stored.series.USDNGN ?? []),
			PALM: palmUsd == null ? [] : (stored.series.PALM ?? []).filter((point) => point.date >= "2026-11-03")
		},
		history
	});
}
var getOutlook_createServerFn_handler = createServerRpc({
	id: "8c78ecd6b53e87c4ddd661ea47504144eb8367a3fab6a920447b04562f51de92",
	name: "getOutlook",
	filename: "src/lib/fundamentals/outlook.ts"
}, (opts) => getOutlook.__executeServer(opts));
var getOutlook = createServerFn({ method: "GET" }).validator((input) => {
	return { fresh: typeof input === "object" && input !== null && "fresh" in input && input.fresh === true };
}).handler(getOutlook_createServerFn_handler, async ({ data }) => {
	if (!data.fresh && cache && Date.now() - cache.at < TTL_MS) return {
		ok: true,
		outlook: cache.outlook
	};
	try {
		const outlook = await loadOutlook(/* @__PURE__ */ new Date());
		cache = {
			at: Date.now(),
			outlook
		};
		return {
			ok: true,
			outlook
		};
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : "The macro feeds did not respond."
		};
	}
});
//#endregion
export { getOutlook_createServerFn_handler };

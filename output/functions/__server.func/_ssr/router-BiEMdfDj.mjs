import { o as __toESM } from "../_runtime.mjs";
import { U as isRedirect, _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, q as require_react, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { c as formatSpot, i as PAIR_IDS, s as formatFlex, t as CHART_SYMBOL } from "./model-CTWhUSgS.mjs";
import { n as RefreshCw, t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BiEMdfDj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-DdPGNJf5.css";
var APP_NAME = "Kimani Column";
var Route$2 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Independent market research."
			},
			{
				name: "theme-color",
				content: "#ffffff"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,620&family=Public+Sans:wght@400;500;600&display=swap"
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-paper text-ink antialiased",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/** MPOB Peninsular Malaysia palm kernel ex-mill (the nut), in USD per tonne. Not palm oil and not palm kernel oil. */
/** BIS reprints the previous overnight target for a few sessions after a decision. */
var getOutlook = createServerFn({ method: "GET" }).validator((input) => {
	return { fresh: typeof input === "object" && input !== null && "fresh" in input && input.fresh === true };
}).handler(createSsrRpc("8c78ecd6b53e87c4ddd661ea47504144eb8367a3fab6a920447b04562f51de92"));
var getPairNews = createServerFn({ method: "GET" }).validator((input) => {
	return { fresh: typeof input === "object" && input !== null && "fresh" in input && input.fresh === true };
}).handler(createSsrRpc("362e2c1c92519d364b7643dc46506a3adbd77ae26e2ab2a53be544ae70cfaa19"));
var SORTS = [
	{
		id: "desk",
		label: "Desk order"
	},
	{
		id: "bull",
		label: "Most bullish"
	},
	{
		id: "bear",
		label: "Most bearish"
	}
];
function formatStamp(iso) {
	return `${new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		timeZone: "UTC"
	}).format(new Date(iso))} UTC`;
}
function formatDay(isoDate) {
	const [year, month, day] = isoDate.split("-").map(Number);
	if (!year || !month || !day) return isoDate;
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC"
	}).format(new Date(Date.UTC(year, month - 1, day)));
}
function toneText(tone) {
	if (tone === "bear") return "text-paper/80";
	return "text-paper";
}
function toneBar(tone) {
	if (tone === "bear") return "bg-paper/70";
	return "bg-paper";
}
function sortPairs(pairs, mode) {
	const next = [...pairs];
	if (mode === "bull") next.sort((a, b) => b.bullish - a.bullish || a.id.localeCompare(b.id));
	if (mode === "bear") next.sort((a, b) => a.bullish - b.bullish || a.id.localeCompare(b.id));
	return next;
}
function BiasMeter({ pair }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "meter",
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": pair.bullish,
		"aria-label": `${pair.id} fundamental bias, ${pair.bullish} percent bullish`,
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-2 h-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-3.5 right-0 left-0 h-1 rounded-full bg-paper/35" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-2 left-1/2 h-4 w-px bg-paper" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `absolute top-1 size-4 -translate-x-1/2 rounded-full border-2 border-ink ${toneBar(pair.tone)}`,
					style: { left: `${pair.bullish}%` }
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex justify-between text-xs tracking-wide text-paper/75 uppercase",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Bearish" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "50" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Bullish" })
			]
		})]
	});
}
var CONVERTIBLE = /* @__PURE__ */ new Set([
	"BTCUSD",
	"XAUUSD",
	"XAGUSD",
	"COCOA",
	"PALM"
]);
function LineChart({ points, stored }) {
	const width = 640;
	const height = 220;
	const pad = 18;
	const closes = points.map((point) => point.close);
	const min = closes.length ? Math.min(...closes) : 0;
	const max = closes.length ? Math.max(...closes) : 1;
	const span = max - min || 1;
	const coords = points.map((point, index) => {
		return {
			x: points.length === 1 ? width / 2 : pad + index / (points.length - 1) * 604,
			y: max === min ? height / 2 : pad + (1 - (point.close - min) / span) * 184
		};
	});
	const start = points[0]?.date ?? "";
	const end = points[points.length - 1]?.date ?? "";
	const caption = points.length > 20 ? "Six-month daily line" : points.length > 0 ? "Daily line from the reference spot" : "Daily line unavailable";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "mt-4 overflow-hidden rounded-card bg-paper text-ink",
		children: [points.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-3 py-6 text-sm",
			children: stored ? "No daily closes collected yet." : "No stored daily closes. The history database did not answer, so this line is left blank."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${width} ${height}`,
			className: "block h-auto w-full",
			role: "img",
			"aria-label": caption,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2.5",
				strokeLinejoin: "round",
				strokeLinecap: "round",
				points: coords.map((point) => `${point.x},${point.y}`).join(" ")
			}), coords.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: coords[coords.length - 1].x,
				cy: coords[coords.length - 1].y,
				r: "3.5",
				fill: "currentColor"
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
			className: "border-t border-line px-3 py-2 text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-medium",
				children: caption
			}), start ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "mt-0.5 block text-ink/70",
				children: [
					start,
					" – ",
					end
				]
			}) : null]
		})]
	});
}
function PairChart({ pair, rev, points, stored }) {
	const [failed, setFailed] = (0, import_react.useState)(false);
	const symbol = CHART_SYMBOL[pair.id];
	const src = rev > 0 ? `/api/charts/${pair.id}?v=${rev}` : `/api/charts/${pair.id}`;
	const page = symbol ? `https://stockcharts.com/sc3/ui/?s=${encodeURIComponent(`$${symbol}`)}` : "";
	(0, import_react.useEffect)(() => {
		setFailed(false);
	}, [src]);
	if (!symbol) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LineChart, {
		points,
		stored
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "mt-4 overflow-hidden rounded-card bg-paper text-ink",
		children: [failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-3 py-6 text-sm",
			children: "The StockCharts chart did not load."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: `${pair.base}/${pair.quote} six-month daily chart from StockCharts`,
			className: "block h-auto w-full bg-paper",
			onError: () => setFailed(true)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "border-t border-line px-3 py-2 text-xs",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: page,
				className: "font-medium underline decoration-line underline-offset-4",
				target: "_blank",
				rel: "noreferrer",
				children: "Six-month daily chart on StockCharts"
			})
		})]
	});
}
function PairReports({ reports }) {
	if (reports.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-4 text-sm text-paper/80",
		children: "No significant report for this pair in the last few days."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-xs tracking-wide text-paper/75 uppercase",
			children: "Latest reports"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 divide-y divide-paper/25 border-y border-paper/25",
			children: reports.map((report) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: report.url,
				target: "_blank",
				rel: "noreferrer",
				className: "block py-3 text-paper",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-medium underline decoration-paper underline-offset-4",
					children: report.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mt-1 block text-xs font-normal text-paper/75",
					children: [
						report.source,
						" · ",
						formatStamp(report.publishedAt)
					]
				})]
			}) }, report.url))
		})]
	});
}
function assetNote(id) {
	if (id === "BTCUSD") return "Real yield and the dollar only. ETF flows and leverage are left out.";
	if (id === "XAUUSD") return "Real yield and the dollar. A higher real yield leans bearish.";
	if (id === "XAGUSD") return "Gold's macro drivers, plus US and China growth.";
	if (id === "COCOA") return "West African rainfall versus the prior two years. Disease and farmgate policy are not scored.";
	return "Malaysia and Indonesia rainfall, plus crude oil. Kernel supply follows the fruit.";
}
function PairCard({ pair, outlook, reports, open, chartRev, onToggle }) {
	const [naira, setNaira] = (0, import_react.useState)(false);
	const base = outlook.currencies.find((currency) => currency.code === pair.base);
	const quote = outlook.currencies.find((currency) => currency.code === pair.quote);
	const ngnRate = outlook.pairs.find((item) => item.id === "USDNGN")?.spot ?? null;
	const canConvert = CONVERTIBLE.has(pair.id) && pair.spot != null && ngnRate != null;
	const shown = canConvert && naira ? pair.spot * ngnRate : pair.spot;
	const caption = naira ? "Naira" : pair.id === "PALM" ? "Palm kernel" : pair.id === "COCOA" ? "Cocoa" : "Reference spot";
	const rows = base && quote ? [
		[
			"Policy rate",
			formatFlex(base.policyRate),
			formatFlex(quote.policyRate)
		],
		[
			"Rate as of",
			formatDay(base.policyAsOf),
			formatDay(quote.policyAsOf)
		],
		[
			"Inflation outlook",
			`${formatFlex(base.inflation)}%`,
			`${formatFlex(quote.inflation)}%`
		],
		[
			"Real policy rate",
			formatFlex(base.realRate),
			formatFlex(quote.realRate)
		],
		[
			"Growth outlook",
			`${formatFlex(base.growth)}%`,
			`${formatFlex(quote.growth)}%`
		],
		[
			"Current account",
			`${formatFlex(base.currentAccount)}%`,
			`${formatFlex(quote.currentAccount)}%`
		]
	] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex flex-col overflow-hidden rounded-card border-2 border-ink bg-ink text-paper",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-1 ${toneBar(pair.tone)}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-serif text-3xl font-medium tracking-tight",
						children: [
							pair.base,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-paper/70",
								children: "/"
							}),
							pair.quote
						]
					}), canConvert ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setNaira((current) => !current),
						"aria-pressed": naira,
						className: "text-right text-sm tabular-nums text-paper/75",
						children: [shown == null ? "Spot unavailable" : formatSpot(shown), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-xs tracking-wide uppercase underline decoration-paper/40 underline-offset-4",
							children: caption
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-right text-sm tabular-nums text-paper/75",
						children: [shown == null ? "Spot unavailable" : formatSpot(shown), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 block text-xs tracking-wide uppercase",
							children: caption
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `mt-3 font-serif text-2xl ${toneText(pair.tone)}`,
					children: pair.label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm tabular-nums",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-semibold",
						children: [pair.bullish, "% bullish"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-paper/75",
						children: [
							" · ",
							pair.bearish,
							"% bearish"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BiasMeter, { pair }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PairChart, {
					pair,
					rev: chartRev,
					points: outlook.series[pair.id] ?? [],
					stored: outlook.history.ok
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PairReports, { reports }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-4 min-h-11 self-start text-sm font-medium text-paper underline decoration-paper/50 underline-offset-4",
					"aria-expanded": open,
					onClick: onToggle,
					children: open ? "Hide the inputs" : "Show the inputs"
				}),
				open && rows.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-2 pb-1 font-medium",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-right",
									children: pair.base
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-right",
									children: pair.quote
								})
							]
						}),
						rows.map(([label, left, right]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-2 border-t border-paper/25 py-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-paper/75",
									children: label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-right tabular-nums",
									children: left
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-right tabular-nums",
									children: right
								})
							]
						}, label)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-paper/75",
							children: pair.id === "USDNGN" ? "Rates, growth, the external balance, and crude oil. Reserves, remittances, and debt service are not scored." : "Rates, growth, and the external balance. Jobs are left out. Inflation sits inside the real rate."
						})
					]
				}) : open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-sm",
					children: [pair.drivers.map((driver) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-paper/25 py-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: driver.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tabular-nums text-paper/75",
							children: driver.detail
						})]
					}, driver.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-paper/75",
						children: assetNote(pair.id)
					})]
				}) : null
			]
		})]
	});
}
function countLabel(outlook) {
	const bull = outlook.pairs.filter((pair) => pair.tone === "bull").length;
	const bear = outlook.pairs.filter((pair) => pair.tone === "bear").length;
	return `${bull} bullish · ${outlook.pairs.length - bull - bear} balanced · ${bear} bearish`;
}
var REFRESH_MS = 6e4;
function OutlookDesk({ initial, initialNews }) {
	const refresh = useServerFn(getOutlook);
	const refreshNews = useServerFn(getPairNews);
	const [result, setResult] = (0, import_react.useState)(initial);
	const [news, setNews] = (0, import_react.useState)(initialNews);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [sort, setSort] = (0, import_react.useState)("desk");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [chartRev, setChartRev] = (0, import_react.useState)(0);
	const busyRef = (0, import_react.useRef)(false);
	const resultRef = (0, import_react.useRef)(result);
	const newsRef = (0, import_react.useRef)(news);
	const lastPull = (0, import_react.useRef)(Date.now());
	resultRef.current = result;
	newsRef.current = news;
	async function pull(manual) {
		if (busyRef.current) return;
		if (!manual && Date.now() - lastPull.current < 55e3) return;
		busyRef.current = true;
		if (manual) {
			setBusy(true);
			setNotice(null);
		}
		try {
			const [next, nextNews] = await Promise.all([refresh({ data: { fresh: true } }), refreshNews({ data: { fresh: true } })]);
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
	const pullRef = (0, import_react.useRef)(pull);
	pullRef.current = pull;
	(0, import_react.useEffect)(() => {
		const tick = () => {
			pullRef.current(false);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-paper",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 bg-ink" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-line bg-paper",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:items-end lg:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-2xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-serif text-4xl font-medium tracking-tight sm:text-5xl",
							children: "Kimani Column"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 max-w-xl text-base text-muted",
							children: "Independent market research*"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-start gap-3 lg:items-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void pull(true),
							disabled: busy,
							className: "inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-paper disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								className: busy ? "size-4 animate-spin" : "size-4",
								"aria-hidden": "true"
							}), busy ? "Updating" : "Update readings"]
						}), outlook ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-ink",
									children: countLabel(outlook)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-1 block tabular-nums",
									children: ["Updated ", formatStamp(outlook.fetchedAt)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 block",
									children: "Refreshes every minute"
								})
							]
						}) : null]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8",
				children: [
					notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 rounded-card border border-ink bg-ink px-4 py-3 text-sm text-paper",
						role: "status",
						children: notice
					}) : null,
					outlook && !news.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-4 text-sm text-muted",
						children: ["Reports did not load. The score is unchanged. ", news.error]
					}) : null,
					outlook && !outlook.history.ok && outlook.history.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-sm text-muted",
						children: outlook.history.note
					}) : null,
					!outlook ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-card border-2 border-ink bg-ink p-6 text-paper",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-serif text-2xl",
								children: "The desk could not load a reading"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-xl text-sm text-paper/80",
								children: result.ok ? "" : result.error
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-paper/80",
								children: "Policy rates come from the BIS and the outlook from the IMF. Try again in a moment."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-5 flex flex-wrap gap-2",
						role: "group",
						"aria-label": "Sort pairs",
						children: SORTS.map((item) => {
							const active = sort === item.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": active,
								onClick: () => setSort(item.id),
								className: `min-h-11 rounded-full px-4 text-sm font-medium ${active ? "bg-ink text-paper" : "bg-paper-2 text-ink"}`,
								children: item.label
							}, item.id);
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
						children: pairs.map((pair) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PairCard, {
							pair,
							outlook,
							reports: news.ok ? news.news.pairs[pair.id] : [],
							chartRev,
							open: openId === pair.id,
							onToggle: () => setOpenId((current) => current === pair.id ? null : pair.id)
						}, pair.id))
					})] })
				]
			})
		]
	});
}
function DeskPending() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-paper",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 bg-ink" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-6xl px-4 py-10 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-serif text-4xl font-medium",
					children: "Kimani Column"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-base text-muted",
					children: "Independent market research*"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Pulling policy rates and the IMF outlook…"
				})
			]
		})]
	});
}
var $$splitComponentImporter = () => import("./routes-CZK2DeKw.mjs");
var Route$1 = createFileRoute("/")({
	loader: () => Promise.all([getOutlook({ data: { fresh: false } }), getPairNews({ data: { fresh: false } })]),
	pendingComponent: DeskPending,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var TTL_MS = 6e4;
var MIN_BYTES = 8e3;
var PACE_MS = 1100;
var BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var cache = /* @__PURE__ */ new Map();
var pace = Promise.resolve();
function isPairId(value) {
	return PAIR_IDS.includes(value);
}
function chartUrl(pair) {
	const symbol = CHART_SYMBOL[pair];
	if (!symbol) return null;
	return `https://stockcharts.com/c-sc/sc?s=%24${symbol}&p=D&yr=0&mn=6&dy=0&id=p${symbol}`;
}
function enqueue(job) {
	const run = pace.then(job, job);
	pace = run.then(() => new Promise((resolve) => setTimeout(resolve, PACE_MS)), () => new Promise((resolve) => setTimeout(resolve, PACE_MS)));
	return run;
}
async function fetchChart(pair) {
	const url = chartUrl(pair);
	if (!url) throw new Error(`No StockCharts symbol for ${pair}.`);
	const response = await fetch(url, {
		headers: {
			Accept: "image/png,image/*,*/*",
			"User-Agent": BROWSER,
			Referer: "https://stockcharts.com/"
		},
		signal: AbortSignal.timeout(2e4)
	});
	if (!response.ok) throw new Error(`StockCharts returned ${response.status} for ${pair}.`);
	if (!(response.headers.get("content-type") ?? "").includes("image/png")) throw new Error(`StockCharts did not return a chart for ${pair}.`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	if (bytes.byteLength < MIN_BYTES) throw new Error(`StockCharts returned an empty chart for ${pair}.`);
	return bytes;
}
async function loadChart(pair) {
	const hit = cache.get(pair);
	if (hit && Date.now() - hit.at < TTL_MS) return hit.bytes;
	const bytes = await enqueue(() => fetchChart(pair));
	cache.set(pair, {
		at: Date.now(),
		bytes
	});
	return bytes;
}
var Route = createFileRoute("/api/charts/$pair")({ server: { handlers: { GET: async ({ params }) => {
	const pair = params.pair.toUpperCase();
	if (!isPairId(pair)) return new Response("Unknown pair", { status: 404 });
	if (!chartUrl(pair)) return new Response("No chart for this market", { status: 404 });
	try {
		const bytes = await loadChart(pair);
		const body = new Uint8Array(bytes.byteLength);
		body.set(bytes);
		return new Response(body.buffer, { headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=60"
		} });
	} catch {
		return new Response("Chart unavailable", { status: 502 });
	}
} } } });
var rootRouteChildren = {
	IndexRoute: Route$1.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$2
	}),
	ApiChartsPairRoute: Route.update({
		id: "/api/charts/$pair",
		path: "/api/charts/$pair",
		getParentRoute: () => Route$2
	})
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent,
		scrollRestoration: true
	});
}
//#endregion
export { Route$1 as n, OutlookDesk as r, router_exports as t };

# quantgist-js

[![npm version](https://img.shields.io/npm/v/quantgist-js.svg)](https://www.npmjs.com/package/quantgist-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official TypeScript SDK for the [QuantGist](https://quantgist.com) macro economic event API — zero runtime dependencies, dual ESM + CJS, browser-compatible.

## Installation

```bash
npm install quantgist-js
# or
pnpm add quantgist-js
```

## 30-second quickstart

```ts
import { QuantGistClient } from "quantgist-js";

const client = new QuantGistClient({ apiKey: "qg_live_..." });

// Macro events
const { data, meta } = await client.getEvents({ impact: "high" });
for (const event of data) {
  console.log(`${event.release_time} | ${event.country} | ${event.title}`);
}

// Upcoming earnings
const earnings = await client.getEarningsUpcoming(10);
for (const e of earnings.data) {
  console.log(`${e.report_date} | ${e.ticker} | est EPS ${e.eps_estimate}`);
}

// Markets overview
const markets = await client.getMarketsOverview();
for (const q of markets.data) {
  console.log(`${q.symbol}: ${q.close} (${q.change_pct?.toFixed(2)}%)`);
}

// Changelog (no auth required)
const { data: log } = await client.getChangelog();
console.log(log[0].version, log[0].summary);
```

Get your free API key at **[quantgist.com/dashboard](https://quantgist.com/dashboard)**.

## Macro Shortcuts

The `/v1/macro/*` endpoints provide trader-friendly aliases for common macro events:

```javascript
const API_KEY = 'your_api_key';
const BASE = 'https://api.quantgist.com/v1';
const headers = { 'X-API-Key': API_KEY };

// Get the latest released NFP value
const nfp = await fetch(`${BASE}/macro/latest?event=NFP`, { headers }).then(r => r.json());
console.log(`NFP: ${nfp.actual} (forecast: ${nfp.forecast})`);

// Get next CPI release
const cpi = await fetch(`${BASE}/macro/upcoming?event=CPI`, { headers }).then(r => r.json());
console.log(`Next CPI: ${cpi.release_time}`);

// Get upcoming macro calendar (14 days)
const calendar = await fetch(`${BASE}/macro/calendar?events=CPI,NFP,FOMC&days=14`, { headers }).then(r => r.json());
calendar.forEach(group => console.log(`${group.event}: ${group.next_release}`));
```

Supported aliases: `NFP`, `CPI`, `PCE`, `FOMC`, `GDP`, `UNEMPLOYMENT`, `RETAIL_SALES`, `PPI`, `ISM`, `ECB`, `HICP`

---

## Browser / Next.js usage

The SDK uses only the native `fetch` API — no Node.js-specific modules. It works in any modern browser, Next.js App Router client components, and Cloudflare Workers.

In browser environments you **must** pass `apiKey` explicitly (there is no `process.env` in the browser):

```ts
// Next.js client component
const client = new QuantGistClient({
  apiKey: process.env.NEXT_PUBLIC_QUANTGIST_API_KEY!,
});
```

In Node 20+ you can set the `QUANTGIST_API_KEY` environment variable and omit `apiKey` from the constructor:

```ts
// Node — reads QUANTGIST_API_KEY automatically
const client = new QuantGistClient();
```

## API reference

### `new QuantGistClient(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `process.env.QUANTGIST_API_KEY` | Your QuantGist API key. Required in browser environments. |
| `baseUrl` | `string` | `https://api.quantgist.com/v1` | Override the API base URL (useful for testing). |
| `timeout` | `number` | `30000` | Request timeout in milliseconds. |

Throws `AuthenticationError` if no API key is found.

---

### Macro events

| Method | Returns | Description |
|--------|---------|-------------|
| `getEvents(params?)` | `Promise<EventsResponse>` | Filtered, paginated macro event list. |
| `getEvent(id)` | `Promise<Event>` | Single event by ID. |

`getEvents` params: `from`, `to`, `country`, `currency`, `impact`, `symbol`, `limit`, `page`.

---

### Earnings

| Method | Returns | Description |
|--------|---------|-------------|
| `getEarnings(params?)` | `Promise<EarningsResponse>` | Filtered, cursor-paginated earnings list. |
| `getEarningsUpcoming(limit?)` | `Promise<EarningsResponse>` | Next N upcoming reports. |
| `getEarningsForTicker(ticker, params?)` | `Promise<EarningsResponse>` | Earnings history for one ticker. |
| `getEarningsSummary(ticker)` | `Promise<EarningsSummary>` | Beat/miss/in-line counts. |
| `getEarningsHistory(ticker, params?)` | `Promise<EarningsResponse>` | Paginated history — **Pro+ required**. |
| `getEarningsSurprises(limit?)` | `Promise<EarningsSurprise[]>` | Largest cross-market EPS surprises. |
| `getEarningsMovers(limit?)` | `Promise<EarningsMover[]>` | Events ranked by price/volume impact. |
| `getEarningsWeekCalendar()` | `Promise<EarningsWeekCalendar>` | Week-ahead calendar grouped by day. |
| `getEarningsSeasonSummary()` | `Promise<EarningsSeasonSummary>` | Index-level aggregate for current season. |

`getEarnings` params: `ticker`, `from`, `to`, `sector`, `beat_miss`, `cursor`, `limit`.

Key fields on `EarningsEvent`:

```ts
interface EarningsEvent {
  ticker: string;
  company_name: string;
  report_date: string;          // ISO date
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null;
  revenue_actual: number | null;
  surprise_pct: number | null;
  beat_miss: "beat" | "miss" | "in-line" | null;
  sec_filing_url: string | null;        // SEC EDGAR 8-K URL
  sec_accession_number: string | null;  // e.g. "0000320193-26-000001"
  sec_filed_at: string | null;          // ISO date filed with SEC
  field_sources: Record<string, string>; // provenance per field
}
```

---

### Markets

| Method | Returns | Description |
|--------|---------|-------------|
| `getMarketsOverview()` | `Promise<MarketsOverviewResponse>` | Major indices overview (EOD Stooq). |
| `getMarketsSectors()` | `Promise<MarketsOverviewResponse>` | Sector ETF quotes. |
| `getMarketsCurrencies()` | `Promise<MarketsOverviewResponse>` | Currency pair quotes. |
| `getMarketsCommodities()` | `Promise<MarketsOverviewResponse>` | Commodity quotes. |
| `getMarketQuote(symbol)` | `Promise<MarketQuote>` | Single symbol EOD quote. |

---

### Changelog

| Method | Returns | Description |
|--------|---------|-------------|
| `getChangelog()` | `Promise<ChangelogResponse>` | Public API changelog — no elevated plan required. |

## Error handling

All errors extend `QuantGistError` which carries a `statusCode` property.

```ts
import {
  QuantGistClient,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  PlanUpgradeRequired,
  QuantGistError,
} from "quantgist-js";

try {
  const { data } = await client.getEvents({ impact: "high" });
} catch (err) {
  if (err instanceof AuthenticationError) {
    // 401 — invalid or missing API key
    console.error("Check your API key");
  } else if (err instanceof RateLimitError) {
    // 429 — slow down requests
    console.error("Rate limit hit, retry later");
  } else if (err instanceof NotFoundError) {
    // 404
    console.error("Event not found");
  } else if (err instanceof PlanUpgradeRequired) {
    // 402 — feature requires a paid plan
    console.error("Upgrade at quantgist.com/pricing");
  } else if (err instanceof QuantGistError) {
    // Other API errors
    console.error(`API error ${err.statusCode}: ${err.message}`);
  }
}
```

## Links

- Full API docs: [quantgist.com/docs](https://quantgist.com/docs)
- Get an API key: [quantgist.com/dashboard](https://quantgist.com/dashboard)
- Pricing: [quantgist.com/pricing](https://quantgist.com/pricing)
- Python SDK: [quantgist-python](https://pypi.org/project/quantgist-py/)

## License

MIT — see [LICENSE](LICENSE).

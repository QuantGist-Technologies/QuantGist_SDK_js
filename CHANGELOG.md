# Changelog

All notable changes to `quantgist-js` are documented in this file.

## [0.3.0] - 2026-05-17

### Added
- Ported the canonical SDK from the `TradingnewsAPI-QuantGist` monorepo. The
  client is now resource-based: `client.events`, `client.calendar`,
  `client.intelligence`, `client.news`, `client.notifications`,
  `client.sentiment`, `client.symbols`, `client.usage`, `client.watchlists`,
  `client.webhooks`.
- New `SentimentResource` (`/v1/sentiment/summary`, `/v1/sentiment/events`).
- New `WebhooksResource` covering CRUD + deliveries + test dispatch +
  white-label branding (`/v1/webhooks/branding`).
- New `NotificationsResource` for Discord / Telegram / email channel CRUD
  and synthetic-test dispatch (`/v1/notifications/channels`).
- New `IntelligenceResource`, `WatchlistsResource`, `NewsResource`, and
  expanded `CalendarResource`/`SymbolsResource`/`UsageResource` matching the
  current `api.quantgist.com/v1` surface.
- `BaseClient` interface for resource classes; `buildQuery()` utility.
- `Impact` type alias retained as a backwards-compatible synonym for
  `ImpactLevel`.

### Changed
- `QuantGistClient` constructor now takes `{ apiKey, baseUrl? }` and throws
  `AuthenticationError` when `apiKey` is missing.
- `QuantGistError` exposes `status` directly (with a `statusCode` getter for
  back-compat).
- `RateLimitError` carries an optional `retryAfter` (seconds) parsed from
  the `Retry-After` header.

### Deprecated (retained for backwards compatibility)
- All `/v1/earnings/*` wrapper methods on `QuantGistClient` —
  `getEarnings`, `getEarningsUpcoming`, `getEarningsForTicker`,
  `getEarningsSummary`, `getEarningsHistory`, `getEarningsSurprises`,
  `getEarningsMovers`, `getEarningsWeekCalendar`,
  `getEarningsSeasonSummary`. Each emits `console.warn` and either forwards
  to the closest real endpoint (`/v1/calendar*`, `/v1/symbols/{symbol}/events`)
  or throws `NotFoundError` when no equivalent exists. Migrate to
  `client.calendar.*` / `client.symbols.events()`.
- `getMarketsOverview`, `getMarketsSectors`, `getMarketsCurrencies`,
  `getMarketsCommodities`, `getMarketQuote`, `getChangelog` — kept as thin
  pass-throughs over `request()`.

## [0.2.1]

- Previous monorepo-era release. See git history for details.

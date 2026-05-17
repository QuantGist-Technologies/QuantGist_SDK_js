import { AuthenticationError, NotFoundError, PlanUpgradeRequired, QuantGistError, RateLimitError } from './errors';
import { EventsResource } from './resources/events';
import { CalendarResource } from './resources/calendar';
import { IntelligenceResource } from './resources/intelligence';
import { NewsResource } from './resources/news';
import { NotificationsResource } from './resources/notifications';
import { SentimentResource } from './resources/sentiment';
import { SymbolsResource } from './resources/symbols';
import { UsageResource } from './resources/usage';
import { WatchlistsResource } from './resources/watchlists';
import { WebhooksResource } from './resources/webhooks';
import type {
  ChangelogResponse,
  EarningsMover,
  EarningsResponse,
  EarningsSeasonSummary,
  EarningsSummary,
  EarningsSurprise,
  EarningsWeekCalendar,
  GetEarningsParams,
  MarketQuote,
  MarketsOverviewResponse,
} from './types';

const DEFAULT_BASE_URL = 'https://api.quantgist.com/v1';

export interface QuantGistClientOptions {
  /** Your QuantGist API key (e.g. qg_live_...) */
  apiKey: string;
  /** Override the default base URL (useful for testing). */
  baseUrl?: string;
}

/**
 * Internal interface used by resource classes so they can call `request`
 * without importing the full concrete client (avoids circular deps).
 */
export interface BaseClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

/** Compute Monday (00:00) and Sunday (23:59) of the current UTC week. */
function currentWeekRangeUTC(): { from: string; to: string } {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sun ... 6 = Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday),
  );
  const sunday = new Date(
    Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6),
  );
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  };
}

export class QuantGistClient implements BaseClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  readonly events: EventsResource;
  readonly calendar: CalendarResource;
  readonly intelligence: IntelligenceResource;
  readonly news: NewsResource;
  readonly notifications: NotificationsResource;
  readonly sentiment: SentimentResource;
  readonly symbols: SymbolsResource;
  readonly usage: UsageResource;
  readonly watchlists: WatchlistsResource;
  readonly webhooks: WebhooksResource;

  constructor(options: QuantGistClientOptions) {
    if (!options.apiKey) {
      throw new AuthenticationError('apiKey is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');

    this.events = new EventsResource(this);
    this.calendar = new CalendarResource(this);
    this.intelligence = new IntelligenceResource(this);
    this.news = new NewsResource(this);
    this.notifications = new NotificationsResource(this);
    this.sentiment = new SentimentResource(this);
    this.symbols = new SymbolsResource(this);
    this.usage = new UsageResource(this);
    this.watchlists = new WatchlistsResource(this);
    this.webhooks = new WebhooksResource(this);
  }

  /**
   * Low-level fetch wrapper used by all resource classes.
   * Throws typed errors for 401, 402, 404, 429, and other non-2xx responses.
   */
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        'X-API-Key': this.apiKey,
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    // Attempt to extract a message from the response body.
    let message: string | undefined;
    try {
      const body = (await response.json()) as { message?: string; detail?: string };
      message = body.message ?? body.detail;
    } catch {
      // ignore parse errors
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 402:
        throw new PlanUpgradeRequired(message);
      case 404:
        throw new NotFoundError(message);
      case 429: {
        const retryHeader = response.headers.get('Retry-After');
        const retryAfter = retryHeader ? parseInt(retryHeader, 10) : undefined;
        throw new RateLimitError(message, Number.isNaN(retryAfter ?? NaN) ? undefined : retryAfter);
      }
      default:
        throw new QuantGistError(
          message ?? `Request failed with status ${response.status}`,
          response.status,
        );
    }
  }

  // ===========================================================================
  // DEPRECATED: /v1/earnings/* aliases
  //
  // The `/v1/earnings/*` resource was removed from the QuantGist backend.
  // The methods below are kept as deprecated, console.warn-emitting wrappers
  // so existing consumers do not crash. Each forwards to the closest real
  // endpoint (`/v1/calendar*` for date-range queries, `/v1/symbols/{symbol}/
  // events` for ticker-scoped queries). Methods with no exact backend
  // equivalent (surprises, movers, summary, season-summary) throw
  // `NotFoundError`. Migrate to `client.calendar.*` / `client.symbols.events()`.
  // ===========================================================================

  /**
   * @deprecated `/v1/earnings` was removed. Use `client.calendar.today()`,
   * `client.calendar.range()`, or `client.symbols.events()` instead. This
   * wrapper forwards to `GET /v1/calendar` with the `event_type=earnings`
   * filter (or `GET /v1/symbols/{ticker}/events` when `ticker` is set);
   * the response shape is the standard paginated calendar response, not
   * the legacy `EarningsResponse` — the cast is best-effort.
   */
  async getEarnings(params: GetEarningsParams = {}): Promise<EarningsResponse> {
    console.warn(
      '[quantgist-js] getEarnings() is deprecated: /v1/earnings was removed. ' +
        'Use client.calendar.* or client.symbols.events() instead.',
    );
    if (params.ticker) {
      const query = new URLSearchParams();
      if (params.limit != null) query.set('per_page', String(params.limit));
      const qs = query.toString() ? `?${query}` : '';
      return this.request<EarningsResponse>(
        `/symbols/${encodeURIComponent(params.ticker.toUpperCase())}/events${qs}`,
      );
    }
    const query = new URLSearchParams();
    query.set('event_type', 'earnings');
    if (params.from) query.set('date_from', params.from);
    if (params.to) query.set('date_to', params.to);
    if (params.limit != null) query.set('per_page', String(params.limit));
    return this.request<EarningsResponse>(`/calendar?${query}`);
  }

  /**
   * @deprecated `/v1/earnings/upcoming` was removed. Forwards to
   * `GET /v1/calendar/upcoming` (all calendar event types — not just
   * earnings). Migrate to `client.calendar.upcoming()`.
   */
  async getEarningsUpcoming(limit = 20): Promise<EarningsResponse> {
    console.warn(
      '[quantgist-js] getEarningsUpcoming() is deprecated: /v1/earnings/upcoming ' +
        'was removed. Use client.calendar.upcoming() instead.',
    );
    return this.request<EarningsResponse>(`/calendar/upcoming?limit=${limit}`);
  }

  /**
   * @deprecated `/v1/earnings/{ticker}` was removed. Forwards to
   * `GET /v1/symbols/{ticker}/events`. Migrate to `client.symbols.events()`.
   */
  async getEarningsForTicker(
    ticker: string,
    params: { cursor?: string; limit?: number } = {},
  ): Promise<EarningsResponse> {
    console.warn(
      '[quantgist-js] getEarningsForTicker() is deprecated: /v1/earnings/{ticker} ' +
        'was removed. Use client.symbols.events() instead.',
    );
    const query = new URLSearchParams();
    if (params.limit != null) query.set('per_page', String(params.limit));
    const qs = query.toString() ? `?${query}` : '';
    return this.request<EarningsResponse>(
      `/symbols/${encodeURIComponent(ticker.toUpperCase())}/events${qs}`,
    );
  }

  /**
   * @deprecated `/v1/earnings/{ticker}/summary` has no backend equivalent
   * — beat/miss aggregation is no longer provided. Throws `NotFoundError`.
   */
  async getEarningsSummary(_ticker: string): Promise<EarningsSummary> {
    console.warn(
      '[quantgist-js] getEarningsSummary() is deprecated and has no backend ' +
        'equivalent in the current v1 API.',
    );
    throw new NotFoundError(
      'getEarningsSummary is no longer supported; /v1/earnings/{ticker}/summary was removed.',
    );
  }

  /**
   * @deprecated `/v1/earnings/{ticker}/history` has no backend equivalent.
   * Use `client.symbols.events()` for recent events tagged with the symbol.
   */
  async getEarningsHistory(
    ticker: string,
    params: { cursor?: string; limit?: number } = {},
  ): Promise<EarningsResponse> {
    console.warn(
      '[quantgist-js] getEarningsHistory() is deprecated: /v1/earnings/{ticker}/history ' +
        'was removed. Use client.symbols.events() instead.',
    );
    const query = new URLSearchParams();
    if (params.limit != null) query.set('per_page', String(params.limit));
    // Widen look-back window to plan maximum (720h ~ 30d)
    query.set('hours', '720');
    return this.request<EarningsResponse>(
      `/symbols/${encodeURIComponent(ticker.toUpperCase())}/events?${query}`,
    );
  }

  /**
   * @deprecated `/v1/earnings/surprises` has no backend equivalent.
   * Throws `NotFoundError`.
   */
  async getEarningsSurprises(_limit = 20): Promise<EarningsSurprise[]> {
    console.warn(
      '[quantgist-js] getEarningsSurprises() is deprecated and has no backend equivalent.',
    );
    throw new NotFoundError(
      'getEarningsSurprises is no longer supported; /v1/earnings/surprises was removed.',
    );
  }

  /**
   * @deprecated `/v1/earnings/movers` has no backend equivalent.
   * Throws `NotFoundError`.
   */
  async getEarningsMovers(_limit = 20): Promise<EarningsMover[]> {
    console.warn(
      '[quantgist-js] getEarningsMovers() is deprecated and has no backend equivalent.',
    );
    throw new NotFoundError(
      'getEarningsMovers is no longer supported; /v1/earnings/movers was removed.',
    );
  }

  /**
   * @deprecated `/v1/earnings/calendar/week` was removed. Forwards to
   * `GET /v1/calendar?date_from=...&date_to=...` for the current Mon–Sun
   * (UTC) window. Returns the raw paginated response coerced to the legacy
   * `EarningsWeekCalendar` shape on a best-effort basis. Migrate to
   * `client.calendar.range()`.
   */
  async getEarningsWeekCalendar(): Promise<EarningsWeekCalendar> {
    console.warn(
      '[quantgist-js] getEarningsWeekCalendar() is deprecated: ' +
        '/v1/earnings/calendar/week was removed. Use client.calendar.range() instead.',
    );
    const { from, to } = currentWeekRangeUTC();
    const resp = await this.request<unknown>(
      `/calendar?date_from=${from}&date_to=${to}&per_page=100`,
    );
    return (resp as { data: EarningsWeekCalendar }).data ?? (resp as EarningsWeekCalendar);
  }

  /**
   * @deprecated `/v1/earnings/season/summary` has no backend equivalent.
   * Throws `NotFoundError`.
   */
  async getEarningsSeasonSummary(): Promise<EarningsSeasonSummary> {
    console.warn(
      '[quantgist-js] getEarningsSeasonSummary() is deprecated and has no backend equivalent.',
    );
    throw new NotFoundError(
      'getEarningsSeasonSummary is no longer supported; /v1/earnings/season/summary was removed.',
    );
  }

  // ===========================================================================
  // DEPRECATED: /v1/markets/* and /v1/changelog convenience wrappers
  //
  // These were one-off helpers from the older client and are not part of the
  // resource-based API. Kept as thin pass-throughs so existing consumers do
  // not break. Prefer `client.request<T>(path)` for ad-hoc endpoints.
  // ===========================================================================

  /** @deprecated Use `client.request('/markets/overview')` instead. */
  async getMarketsOverview(): Promise<MarketsOverviewResponse> {
    return this.request<MarketsOverviewResponse>('/markets/overview');
  }

  /** @deprecated Use `client.request('/markets/sectors')` instead. */
  async getMarketsSectors(): Promise<MarketsOverviewResponse> {
    return this.request<MarketsOverviewResponse>('/markets/sectors');
  }

  /** @deprecated Use `client.request('/markets/currencies')` instead. */
  async getMarketsCurrencies(): Promise<MarketsOverviewResponse> {
    return this.request<MarketsOverviewResponse>('/markets/currencies');
  }

  /** @deprecated Use `client.request('/markets/commodities')` instead. */
  async getMarketsCommodities(): Promise<MarketsOverviewResponse> {
    return this.request<MarketsOverviewResponse>('/markets/commodities');
  }

  /** @deprecated Use `client.request('/markets/{symbol}')` instead. */
  async getMarketQuote(symbol: string): Promise<MarketQuote> {
    const resp = await this.request<{ data: MarketQuote } | MarketQuote>(
      `/markets/${encodeURIComponent(symbol)}`,
    );
    return (resp as { data: MarketQuote }).data ?? (resp as MarketQuote);
  }

  /** @deprecated Use `client.request('/changelog')` instead. */
  async getChangelog(): Promise<ChangelogResponse> {
    return this.request<ChangelogResponse>('/changelog');
  }
}

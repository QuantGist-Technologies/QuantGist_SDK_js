import { AuthenticationError, NotFoundError, PlanUpgradeRequired, QuantGistError, RateLimitError } from './errors';
import { EventsResource } from './resources/events';
import { CalendarResource } from './resources/calendar';
import { IntelligenceResource } from './resources/intelligence';
import { NewsResource } from './resources/news';
import { NotificationsResource } from './resources/notifications';
import { SentimentResource } from './resources/sentiment';
import { SymbolsResource } from './resources/symbols';
import { UsageResource } from './resources/usage';
import { V2Resource } from './resources/v2';
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
const DEFAULT_V2_BASE_URL = 'https://api.quantgist.com/v2';

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
  /** v2 official-source, revision-aware API (Pro+ plan required). */
  readonly v2: V2Resource;
  readonly watchlists: WatchlistsResource;
  readonly webhooks: WebhooksResource;

  constructor(options: QuantGistClientOptions) {
    if (!options.apiKey) {
      throw new AuthenticationError('apiKey is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    // Derive v2 base URL from base_url (replace /v1 suffix) or use default.
    const v2BaseUrl = this.baseUrl.includes('/v1')
      ? this.baseUrl.replace('/v1', '/v2')
      : DEFAULT_V2_BASE_URL;

    this.events = new EventsResource(this);
    this.calendar = new CalendarResource(this);
    this.intelligence = new IntelligenceResource(this);
    this.news = new NewsResource(this);
    this.notifications = new NotificationsResource(this);
    this.sentiment = new SentimentResource(this);
    this.symbols = new SymbolsResource(this);
    this.usage = new UsageResource(this);
    this.v2 = new V2Resource(this.apiKey, v2BaseUrl);
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
  // /v1/earnings/* compatibility wrappers
  //
  // The backend currently exposes `/v1/earnings/*`. These methods are kept as
  // pass-through convenience wrappers for older SDK consumers. Prefer direct
  // resource methods or `client.request<T>(path)` for new endpoint coverage.
  // ===========================================================================

  async getEarnings(params: GetEarningsParams = {}): Promise<EarningsResponse> {
    const query = new URLSearchParams();
    if (params.ticker) query.set('ticker', params.ticker.toUpperCase());
    if (params.from || params.date_from) query.set('date_from', params.from ?? params.date_from!);
    if (params.to || params.date_to) query.set('date_to', params.to ?? params.date_to!);
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit != null || params.per_page != null) query.set('limit', String(params.limit ?? params.per_page));
    const qs = query.toString() ? `?${query}` : '';
    return this.request<EarningsResponse>(`/earnings${qs}`);
  }

  async getEarningsUpcoming(limit = 20): Promise<EarningsResponse> {
    return this.request<EarningsResponse>(`/earnings/upcoming?limit=${limit}`);
  }

  async getEarningsForTicker(
    ticker: string,
    params: { cursor?: string; limit?: number; per_page?: number } = {},
  ): Promise<EarningsResponse> {
    const query = new URLSearchParams();
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit != null || params.per_page != null) query.set('limit', String(params.limit ?? params.per_page));
    const qs = query.toString() ? `?${query}` : '';
    return this.request<EarningsResponse>(`/earnings/${encodeURIComponent(ticker.toUpperCase())}${qs}`);
  }

  async getEarningsSummary(ticker: string): Promise<EarningsSummary> {
    const resp = await this.request<{ data: EarningsSummary } | EarningsSummary>(
      `/earnings/${encodeURIComponent(ticker.toUpperCase())}/summary`,
    );
    return (resp as { data: EarningsSummary }).data ?? (resp as EarningsSummary);
  }

  async getEarningsHistory(
    ticker: string,
    params: { cursor?: string; limit?: number; per_page?: number } = {},
  ): Promise<EarningsResponse> {
    const query = new URLSearchParams();
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit != null || params.per_page != null) query.set('limit', String(params.limit ?? params.per_page));
    const qs = query.toString() ? `?${query}` : '';
    return this.request<EarningsResponse>(`/earnings/${encodeURIComponent(ticker.toUpperCase())}/history${qs}`);
  }

  async getEarningsSurprises(limit = 20): Promise<EarningsSurprise[]> {
    return this.request<EarningsSurprise[]>(`/earnings/surprises?limit=${limit}`);
  }

  async getEarningsMovers(limit = 20): Promise<EarningsMover[]> {
    return this.request<EarningsMover[]>(`/earnings/movers?limit=${limit}`);
  }

  async getEarningsWeekCalendar(): Promise<EarningsWeekCalendar> {
    return this.request<EarningsWeekCalendar>('/earnings/calendar/week');
  }

  async getEarningsSeasonSummary(): Promise<EarningsSeasonSummary> {
    const resp = await this.request<{ data: EarningsSeasonSummary } | EarningsSeasonSummary>(
      '/earnings/season/summary',
    );
    return (resp as { data: EarningsSeasonSummary }).data ?? (resp as EarningsSeasonSummary);
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

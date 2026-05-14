import {
  AuthenticationError,
  NotFoundError,
  PlanUpgradeRequired,
  QuantGistError,
  RateLimitError,
} from "./errors.js";
import type {
  ChangelogResponse,
  EarningsMover,
  EarningsResponse,
  EarningsSeasonSummary,
  EarningsSummary,
  EarningsSurprise,
  EarningsWeekCalendar,
  Event,
  EventsResponse,
  GetEarningsParams,
  GetEventsParams,
  MarketQuote,
  MarketsOverviewResponse,
  QuantGistClientOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.quantgist.com/v1";
const SDK_VERSION = "0.2.0";

export class QuantGistClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: QuantGistClientOptions = {}) {
    this.apiKey =
      options.apiKey ?? process.env["QUANTGIST_API_KEY"] ?? "";
    if (!this.apiKey) {
      throw new AuthenticationError(
        "API key required. Pass apiKey option or set QUANTGIST_API_KEY env var.",
      );
    }
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = options.timeout ?? 30_000;
  }

  // -------------------------------------------------------------------------
  // Macro events
  // -------------------------------------------------------------------------

  async getEvents(params: GetEventsParams = {}): Promise<EventsResponse> {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.country) query.set("country", params.country);
    if (params.currency) query.set("currency", params.currency);
    if (params.impact) query.set("impact", params.impact);
    if (params.symbol) query.set("symbol", params.symbol);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.page != null) query.set("page", String(params.page));

    return this.get<EventsResponse>(`/events?${query}`);
  }

  async getEvent(eventId: string): Promise<Event> {
    const resp = await this.get<{ data: Event }>(`/events/${eventId}`);
    return resp.data;
  }

  // -------------------------------------------------------------------------
  // Earnings
  // -------------------------------------------------------------------------

  /** Fetch a filtered, cursor-paginated list of earnings events. */
  async getEarnings(params: GetEarningsParams = {}): Promise<EarningsResponse> {
    const query = new URLSearchParams();
    if (params.ticker) query.set("ticker", params.ticker);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.sector) query.set("sector", params.sector);
    if (params.beat_miss) query.set("beat_miss", params.beat_miss);
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit != null) query.set("limit", String(params.limit));
    return this.get<EarningsResponse>(`/earnings?${query}`);
  }

  /** Return the next N upcoming earnings reports ordered by report date. */
  async getEarningsUpcoming(limit = 20): Promise<EarningsResponse> {
    return this.get<EarningsResponse>(`/earnings/upcoming?limit=${limit}`);
  }

  /** Return earnings history for a single ticker. */
  async getEarningsForTicker(
    ticker: string,
    params: { cursor?: string; limit?: number } = {},
  ): Promise<EarningsResponse> {
    const query = new URLSearchParams();
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit != null) query.set("limit", String(params.limit));
    const qs = query.toString() ? `?${query}` : "";
    return this.get<EarningsResponse>(`/earnings/${encodeURIComponent(ticker.toUpperCase())}${qs}`);
  }

  /** Return beat/miss/in-line summary counts for a ticker. */
  async getEarningsSummary(ticker: string): Promise<EarningsSummary> {
    const resp = await this.get<{ data: EarningsSummary } | EarningsSummary>(
      `/earnings/${encodeURIComponent(ticker.toUpperCase())}/summary`,
    );
    return (resp as { data: EarningsSummary }).data ?? resp as EarningsSummary;
  }

  /**
   * Return paginated earnings history for a ticker.
   * Requires Pro plan or higher — throws `PlanUpgradeRequired` otherwise.
   */
  async getEarningsHistory(
    ticker: string,
    params: { cursor?: string; limit?: number } = {},
  ): Promise<EarningsResponse> {
    const query = new URLSearchParams();
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit != null) query.set("limit", String(params.limit));
    const qs = query.toString() ? `?${query}` : "";
    return this.get<EarningsResponse>(`/earnings/${encodeURIComponent(ticker.toUpperCase())}/history${qs}`);
  }

  /** Return the largest cross-market EPS surprises. */
  async getEarningsSurprises(limit = 20): Promise<EarningsSurprise[]> {
    const resp = await this.get<{ data: EarningsSurprise[] } | EarningsSurprise[]>(
      `/earnings/surprises?limit=${limit}`,
    );
    return Array.isArray(resp) ? resp : (resp as { data: EarningsSurprise[] }).data;
  }

  /** Return earnings events ranked by price/volume market impact. */
  async getEarningsMovers(limit = 20): Promise<EarningsMover[]> {
    const resp = await this.get<{ data: EarningsMover[] } | EarningsMover[]>(
      `/earnings/movers?limit=${limit}`,
    );
    return Array.isArray(resp) ? resp : (resp as { data: EarningsMover[] }).data;
  }

  /** Return the week-ahead earnings calendar grouped by day. */
  async getEarningsWeekCalendar(): Promise<EarningsWeekCalendar> {
    const resp = await this.get<{ data: EarningsWeekCalendar } | EarningsWeekCalendar>(
      "/earnings/calendar/week",
    );
    return (resp as { data: EarningsWeekCalendar }).data ?? resp as EarningsWeekCalendar;
  }

  /** Return the index-level aggregate for the current earnings season. */
  async getEarningsSeasonSummary(): Promise<EarningsSeasonSummary> {
    const resp = await this.get<{ data: EarningsSeasonSummary } | EarningsSeasonSummary>(
      "/earnings/season/summary",
    );
    return (resp as { data: EarningsSeasonSummary }).data ?? resp as EarningsSeasonSummary;
  }

  // -------------------------------------------------------------------------
  // Markets (EOD Stooq data)
  // -------------------------------------------------------------------------

  /** Return an overview of major market indices and instruments. */
  async getMarketsOverview(): Promise<MarketsOverviewResponse> {
    return this.get<MarketsOverviewResponse>("/markets/overview");
  }

  /** Return EOD quotes for major sector ETFs. */
  async getMarketsSectors(): Promise<MarketsOverviewResponse> {
    return this.get<MarketsOverviewResponse>("/markets/sectors");
  }

  /** Return EOD quotes for major currency pairs. */
  async getMarketsCurrencies(): Promise<MarketsOverviewResponse> {
    return this.get<MarketsOverviewResponse>("/markets/currencies");
  }

  /** Return EOD quotes for major commodities. */
  async getMarketsCommodities(): Promise<MarketsOverviewResponse> {
    return this.get<MarketsOverviewResponse>("/markets/commodities");
  }

  /** Return the latest EOD quote for a single symbol. */
  async getMarketQuote(symbol: string): Promise<MarketQuote> {
    const resp = await this.get<{ data: MarketQuote } | MarketQuote>(
      `/markets/${encodeURIComponent(symbol)}`,
    );
    return (resp as { data: MarketQuote }).data ?? resp as MarketQuote;
  }

  // -------------------------------------------------------------------------
  // Changelog (no auth required)
  // -------------------------------------------------------------------------

  /** Return the public API changelog. No elevated plan required. */
  async getChangelog(): Promise<ChangelogResponse> {
    return this.get<ChangelogResponse>("/changelog");
  }

  // -------------------------------------------------------------------------
  // HTTP helpers
  // -------------------------------------------------------------------------

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          "X-API-Key": this.apiKey,
          "User-Agent": `quantgist-js/${SDK_VERSION}`,
        },
        signal: controller.signal,
      });
      return this.handleResponse<T>(response);
    } finally {
      clearTimeout(timer);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) return response.json() as Promise<T>;
    const body = await response.json().catch(() => ({}));
    const detail: string = body?.detail ?? body?.error ?? "Unknown error";
    switch (response.status) {
      case 401: throw new AuthenticationError(detail);
      case 429: throw new RateLimitError(detail);
      case 404: throw new NotFoundError(detail);
      case 402: throw new PlanUpgradeRequired(detail);
      default: throw new QuantGistError(detail, response.status);
    }
  }
}

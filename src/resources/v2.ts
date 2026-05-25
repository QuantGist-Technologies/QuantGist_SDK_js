/**
 * v2 API resource — official-source, revision-aware, backtest-safe.
 *
 * Endpoints
 * ---------
 * GET /v2/events            — filterable list; `?as_of=` for revision-aware reads
 * GET /v2/events/{id}       — single event; `?include_vintages=true` for full history
 * GET /v2/events/{id}/vintages — raw revision history
 * GET /v2/canonical-events  — discovery: what can I query?
 * GET /v2/backtest          — convenience shortcut with all four safety flags forced on
 *
 * The v2 namespace guarantees:
 * - Every `actual` value comes from an official source (BLS, BEA, ECB,
 *   Eurostat, ONS, FRED/ALFRED, Fed calendar).
 * - `?as_of=YYYY-MM-DD` returns the first-print value published on or before
 *   that date — suitable for point-in-time backtesting.
 * - `/v2/backtest` forces `released_only`, `actual_required`, `official_only`,
 *   and `first_print_only` simultaneously.
 *
 * @example
 * ```ts
 * const client = new QuantGistClient({ apiKey: 'qg_live_...' });
 *
 * // All verified US CPI releases for 2024
 * const cpi = await client.v2.events({
 *   canonicalId: 'US_CPI_YOY',
 *   fromDate: '2024-01-01',
 *   toDate: '2024-12-31',
 * });
 *
 * // First-print CPI value as of 2024-06-15 (before any revisions)
 * const firstPrint = await client.v2.backtest({
 *   canonicalId: 'US_CPI_YOY',
 *   asOf: '2024-06-15',
 * });
 * console.log(firstPrint.backtest_mode); // true
 * ```
 */

import { buildQuery } from '../utils';

/** Parameters for GET /v2/events */
export interface V2EventsParams {
  /** Canonical event ID, e.g. "US_CPI_YOY", "US_NFP", "EU_ECB_RATE_DFR". */
  canonicalId?: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "US", "GB". */
  country?: string;
  /** ISO 4217 currency code, e.g. "USD", "EUR". */
  currency?: string;
  /** "high" | "medium" | "low" */
  impact?: string;
  /** ISO 8601 — release_time >= fromDate */
  fromDate?: string;
  /** ISO 8601 — release_time <= toDate */
  toDate?: string;
  /**
   * Revision-aware cutoff.  Returns the first-print value published on or
   * before this date (ISO 8601).
   */
  asOf?: string;
  /**
   * Filter by verification status.
   * Default: "verified" (conflicting / unverified rows hidden).
   * Pass "any" to see all rows regardless of verification.
   */
  verificationStatus?: string;
  /** Maximum source rank to include (1 = official agencies only). */
  sourceRankMax?: number;
  /** Exclude future events (release_time <= NOW()). */
  releasedOnly?: boolean;
  /** Exclude rows where actual IS NULL. */
  actualRequired?: boolean;
  /** Restrict to official-source adapters only. */
  officialOnly?: boolean;
  /** Return vintage revision_seq=0 instead of the latest revised value. */
  firstPrintOnly?: boolean;
  /** Results per page (max 500). */
  perPage?: number;
  /** Opaque pagination cursor. */
  cursor?: string;
}

/** Parameters for GET /v2/backtest (subset — four safety flags are always on) */
export interface V2BacktestParams {
  canonicalId?: string;
  country?: string;
  currency?: string;
  impact?: string;
  fromDate?: string;
  toDate?: string;
  /** Revision-aware cutoff date. */
  asOf?: string;
  perPage?: number;
  cursor?: string;
}

/** A single v2 event row in the wire shape returned by the API. */
export interface V2Event {
  id: string;
  source: string;
  event_type: string;
  release_time: string | null;
  country: string | null;
  currency: string | null;
  title: string | null;
  impact: string | null;
  canonical_id: string | null;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  verification_status: string;
  conflict_status: unknown | null;
  [key: string]: unknown;
}

/** Paginated list response from /v2/events or /v2/backtest */
export interface V2EventListResponse {
  data: V2Event[];
  meta: {
    total: number;
    per_page: number;
    cursor_next: string | null;
    [key: string]: unknown;
  };
  backtest_mode: boolean;
}

/** Single-event response from GET /v2/events/{id} */
export interface V2EventDetailResponse {
  data: V2Event & { vintages?: V2Vintage[] };
}

/** A single vintage entry from GET /v2/events/{id}/vintages */
export interface V2Vintage {
  id: string;
  event_id: string;
  vintage_date: string;
  actual: string | null;
  revision_seq: number;
  source_url: string | null;
  retrieved_at: string;
}

/** Response from GET /v2/events/{id}/vintages */
export interface V2VintageListResponse {
  data: V2Vintage[];
}

/** A canonical event entry from GET /v2/canonical-events */
export interface CanonicalEvent {
  canonical_id: string;
  title: string;
  description: string | null;
  country: string;
  currency: string;
  impact: string;
  sources: Record<string, string>;
}

/** Response from GET /v2/canonical-events */
export interface CanonicalEventsResponse {
  data: CanonicalEvent[];
  meta: { total: number };
}

// ---------------------------------------------------------------------------
// Internal helper: converts camelCase param keys used in this resource's
// public interface back to the snake_case query params the API expects.
// ---------------------------------------------------------------------------

function normaliseParams(
  p: Record<string, unknown>,
): Record<string, unknown> {
  const map: Record<string, string> = {
    canonicalId: 'canonical_id',
    fromDate: 'from_date',
    toDate: 'to_date',
    asOf: 'as_of',
    verificationStatus: 'verification_status',
    sourceRankMax: 'source_rank_max',
    releasedOnly: 'released_only',
    actualRequired: 'actual_required',
    officialOnly: 'official_only',
    firstPrintOnly: 'first_print_only',
    perPage: 'per_page',
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined && v !== null) {
      out[map[k] ?? k] = v;
    }
  }
  return out;
}

/**
 * v2 API resource.
 *
 * Access via `client.v2.*` — do not instantiate directly.
 *
 * The resource holds both the v1 client (for auth headers) and a
 * v2-specific base URL so it can issue requests to `/v2/…` paths.
 */
export class V2Resource {
  /** @internal */
  private readonly apiKey: string;
  /** @internal */
  private readonly v2BaseUrl: string;

  constructor(apiKey: string, v2BaseUrl: string) {
    this.apiKey = apiKey;
    this.v2BaseUrl = v2BaseUrl.replace(/\/$/, '');
  }

  /** @internal */
  private async fetch<T>(path: string): Promise<T> {
    const url = `${this.v2BaseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        'X-API-Key': this.apiKey,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      let message: string | undefined;
      try {
        const body = (await response.json()) as { message?: string; detail?: string };
        message = body.message ?? body.detail;
      } catch {
        // ignore
      }
      throw new Error(message ?? `v2 request failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  // --------------------------------------------------------------------------
  // GET /v2/events
  // --------------------------------------------------------------------------

  /**
   * List official-source events with optional filters.
   *
   * @example
   * ```ts
   * const result = await client.v2.events({
   *   canonicalId: 'US_NFP',
   *   fromDate: '2024-01-01',
   *   toDate: '2024-12-31',
   * });
   * console.log(result.data[0].actual); // "256000"
   * ```
   */
  async events(params?: V2EventsParams): Promise<V2EventListResponse> {
    const normalised = normaliseParams((params ?? {}) as Record<string, unknown>);
    const query = buildQuery(normalised);
    return this.fetch<V2EventListResponse>(`/events${query}`);
  }

  // --------------------------------------------------------------------------
  // GET /v2/events/{id}
  // --------------------------------------------------------------------------

  /**
   * Retrieve a single event by ID.
   *
   * @param eventId   UUID of the event.
   * @param includeVintages  When `true`, embeds the full revision history.
   */
  async getEvent(
    eventId: string,
    options?: { includeVintages?: boolean },
  ): Promise<V2EventDetailResponse> {
    const query =
      options?.includeVintages ? '?include_vintages=true' : '';
    return this.fetch<V2EventDetailResponse>(
      `/events/${encodeURIComponent(eventId)}${query}`,
    );
  }

  // --------------------------------------------------------------------------
  // GET /v2/events/{id}/vintages
  // --------------------------------------------------------------------------

  /**
   * Return the full revision history for an event.
   *
   * Each entry has `revision_seq` (0 = first print), `vintage_date`,
   * `actual`, and `source_url`.
   */
  async vintages(eventId: string): Promise<V2VintageListResponse> {
    return this.fetch<V2VintageListResponse>(
      `/events/${encodeURIComponent(eventId)}/vintages`,
    );
  }

  // --------------------------------------------------------------------------
  // GET /v2/canonical-events
  // --------------------------------------------------------------------------

  /**
   * Discovery endpoint — returns all canonical event IDs and their
   * per-source series mappings.
   *
   * Use this to find valid `canonicalId` values for :meth:`events` and
   * :meth:`backtest`.
   */
  async canonicalEvents(params?: {
    country?: string;
    currency?: string;
    impact?: string;
  }): Promise<CanonicalEventsResponse> {
    const query = buildQuery(
      (params ?? {}) as Record<string, unknown>,
    );
    return this.fetch<CanonicalEventsResponse>(`/canonical-events${query}`);
  }

  // --------------------------------------------------------------------------
  // GET /v2/backtest
  // --------------------------------------------------------------------------

  /**
   * Backtest-safe event query.
   *
   * Equivalent to calling `events()` with:
   * `releasedOnly=true`, `actualRequired=true`, `officialOnly=true`,
   * `firstPrintOnly=true`, `verificationStatus="verified"`.
   *
   * The response always contains `backtest_mode: true`.
   *
   * @example
   * ```ts
   * // First-print US CPI value as of 2024-06-15
   * const result = await client.v2.backtest({
   *   canonicalId: 'US_CPI_YOY',
   *   asOf: '2024-06-15',
   * });
   * console.log(result.backtest_mode); // true
   * for (const row of result.data) {
   *   console.log(row.release_time, row.actual);
   * }
   * ```
   */
  async backtest(params?: V2BacktestParams): Promise<V2EventListResponse> {
    const normalised = normaliseParams((params ?? {}) as Record<string, unknown>);
    const query = buildQuery(normalised);
    return this.fetch<V2EventListResponse>(`/backtest${query}`);
  }

  // --------------------------------------------------------------------------
  // GET /v2/health
  // --------------------------------------------------------------------------

  /** Check v2 namespace availability. */
  async health(): Promise<{ status: string; namespace: string }> {
    return this.fetch<{ status: string; namespace: string }>('/health');
  }
}

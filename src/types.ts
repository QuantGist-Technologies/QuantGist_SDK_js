// ---------------------------------------------------------------------------
// Shared / utility
// ---------------------------------------------------------------------------

export type Impact = "low" | "medium" | "high";

export interface QuantGistClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Macro events
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  title: string;
  country: string;
  currency: string;
  release_time: string; // ISO 8601 UTC
  impact: Impact;
  forecast: number | null;
  previous: number | null;
  actual: number | null;
  surprise_score: number | null;
  affected_symbols: string[];
  source: string;
}

export interface ResponseMeta {
  total: number;
  page: number;
  per_page: number;
  rate_limit_remaining?: number;
}

export interface EventsResponse {
  data: Event[];
  meta: ResponseMeta;
}

export interface GetEventsParams {
  from?: string;
  to?: string;
  country?: string;
  currency?: string;
  impact?: Impact;
  symbol?: string;
  limit?: number;
  page?: number;
}

// ---------------------------------------------------------------------------
// Earnings
// ---------------------------------------------------------------------------

export type BeatMiss = "beat" | "miss" | "in-line";
export type ReportTime = "before_open" | "after_close" | "during_market";

export interface EarningsEvent {
  id: string;
  ticker: string;
  company_name: string;
  report_date: string; // ISO date (YYYY-MM-DD)
  fiscal_quarter: string | null;
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null;
  revenue_actual: number | null;
  surprise_pct: number | null;
  beat_miss: BeatMiss | null;
  market_cap: number | null;
  sector: string | null;
  report_time: ReportTime | null;
  /** URL to the SEC EDGAR 8-K filing. */
  sec_filing_url: string | null;
  /** SEC accession number, e.g. "0000320193-26-000001". */
  sec_accession_number: string | null;
  /** Date filed with the SEC (ISO date). */
  sec_filed_at: string | null;
  /** Provenance map per field, e.g. { eps_actual: "fmp", sec_filing_url: "sec_edgar" }. */
  field_sources: Record<string, string>;
}

export interface EarningsCursorMeta {
  next_cursor: string | null;
  has_more: boolean;
  total?: number;
  rate_limit_remaining?: number;
}

export interface EarningsResponse {
  data: EarningsEvent[];
  meta: EarningsCursorMeta;
}

export interface GetEarningsParams {
  ticker?: string;
  from?: string;
  to?: string;
  sector?: string;
  beat_miss?: BeatMiss;
  cursor?: string;
  limit?: number;
}

export interface EarningsSummary {
  ticker: string;
  company_name: string | null;
  beat: number;
  miss: number;
  in_line: number;
  total: number;
  beat_rate: number | null;
}

export interface EarningsSurprise {
  ticker: string;
  company_name: string | null;
  report_date: string;
  surprise_pct: number;
  beat_miss: BeatMiss | null;
  sector: string | null;
}

export interface EarningsMover {
  ticker: string;
  company_name: string | null;
  report_date: string;
  price_change_pct: number | null;
  volume_ratio: number | null;
  beat_miss: BeatMiss | null;
  market_cap: number | null;
}

export interface EarningsWeekDay {
  date: string; // ISO date
  events: EarningsEvent[];
}

export interface EarningsWeekCalendar {
  week_start: string;
  week_end: string;
  days: EarningsWeekDay[];
}

export interface EarningsSeasonSummary {
  season_label: string | null;
  as_of: string | null;
  total_reported: number;
  beat_count: number;
  miss_count: number;
  in_line_count: number;
  beat_rate: number | null;
  average_surprise_pct: number | null;
  index: string | null;
}

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------

export interface MarketQuote {
  symbol: string;
  name: string | null;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  change_pct: number | null;
  as_of: string | null; // ISO date
}

export interface MarketsOverviewResponse {
  data: MarketQuote[];
}

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

export interface ChangelogEntry {
  version: string;
  date: string; // ISO date
  summary: string;
  breaking: boolean;
  changes: string[];
}

export interface ChangelogResponse {
  data: ChangelogEntry[];
}

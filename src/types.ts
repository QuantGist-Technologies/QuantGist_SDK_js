// ---------------------------------------------------------------------------
// Shared / utility
// ---------------------------------------------------------------------------

export type ImpactLevel = 'low' | 'medium' | 'high';
export type SortOrder = 'asc' | 'desc';
export type SentimentLabel = 'positive' | 'negative' | 'neutral';
export type HistoricalFormat = 'json' | 'ndjson';

/** Legacy alias kept for backwards compatibility with older SDK consumers. */
export type Impact = ImpactLevel;

// ---------------------------------------------------------------------------
// Macro events (modern canonical shape)
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  title: string;
  event_type: string;
  currency: string;
  symbols: string[];
  impact: ImpactLevel;
  actual_value: number | null;
  forecast_value: number | null;
  previous_value: number | null;
  release_time: string;
  source: string;
  sentiment_score: number | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  currency: string;
  impact: ImpactLevel;
  release_time: string;
  actual_value: number | null;
  forecast_value: number | null;
  previous_value: number | null;
  source: string;
}

export interface CalendarResponse {
  date: string;
  events: CalendarEvent[];
}

export interface CalendarRangeResponse {
  date_from: string;
  date_to: string;
  events: CalendarEvent[];
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  currency: string;
  symbols: string[];
  impact: ImpactLevel | null;
  published_at: string;
  url: string | null;
  sentiment_score: number | null;
}

export interface Symbol {
  symbol: string;
  name: string;
  currency: string;
  exchange: string | null;
}

export interface UsageSummary {
  plan: string;
  requests_used: number;
  requests_limit: number;
  requests_remaining: number;
  reset_at: string;
}

export interface UsageHistoryEntry {
  date: string;
  requests: number;
}

export interface UsageHistoryResponse {
  days: number;
  history: UsageHistoryEntry[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ResponseMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_more: boolean;
}

export interface EventsResponse {
  data: Event[];
  meta: ResponseMeta;
}

// ---- Query param shapes ----

export interface ListEventsParams {
  symbol?: string;
  symbols?: string | string[];
  currency?: string;
  impact?: ImpactLevel;
  event_type?: string;
  source?: string;
  from_date?: string;
  to_date?: string;
  q?: string;
  sentiment?: SentimentLabel;
  min_sentiment?: number;
  max_sentiment?: number;
  sort_by?: string;
  sort_order?: SortOrder;
  page?: number;
  per_page?: number;
}

export interface HistoricalEventsParams {
  symbol?: string;
  from_date?: string;
  to_date?: string;
  format?: HistoricalFormat;
  page?: number;
  per_page?: number;
}

export interface CalendarParams {
  date?: string;
  currency?: string;
  impact?: ImpactLevel;
  include_actual?: boolean;
}

export interface CalendarRangeParams {
  date_from: string;
  date_to: string;
  currency?: string;
  impact?: ImpactLevel;
  include_actual?: boolean;
}

export interface ListNewsParams {
  source?: string;
  currency?: string;
  symbol?: string;
  symbols?: string | string[];
  impact?: ImpactLevel;
  from_date?: string;
  to_date?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface ListSymbolsParams {
  q?: string;
  currency?: string;
  page?: number;
  per_page?: number;
}

export interface UsageHistoryParams {
  days?: number;
}

// ---- Intelligence ----

export interface SurpriseEvent {
  id: string;
  title: string;
  currency: string;
  impact: ImpactLevel;
  release_time: string;
  actual_value: number | null;
  forecast_value: number | null;
  surprise: number | null;
  surprise_pct: number | null;
}

export interface MoverEvent {
  id: string;
  title: string;
  currency: string;
  impact: ImpactLevel;
  release_time: string;
  actual_value: number | null;
  forecast_value: number | null;
  price_change_pct: number | null;
}

export interface IntelligenceParams {
  currency?: string;
  impact?: ImpactLevel;
  from_date?: string;
  to_date?: string;
  limit?: number;
}

// ---- Watchlists ----

export interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  item_type: string;
  item_value: string;
  created_at: string;
}

export interface CreateWatchlistParams {
  name: string;
  description?: string;
}

export interface AddWatchlistItemParams {
  item_type: string;
  item_value: string;
}

export interface WatchlistEventsParams {
  from_date?: string;
  to_date?: string;
  impact?: ImpactLevel;
  page?: number;
  per_page?: number;
}

// ---- Calendar upcoming / range (updated) ----

export interface CalendarUpcomingParams {
  currency?: string;
  impact?: ImpactLevel;
  limit?: number;
}

export interface CalendarRangeNewParams {
  start: string;
  end: string;
  currencies?: string | string[];
  impact?: ImpactLevel;
  limit?: number;
}

// ---- Symbol detail / symbol events ----

export interface SymbolDetail extends Symbol {
  asset_type?: string | null;
}

export interface SymbolEventsParams {
  from_date?: string;
  to_date?: string;
  impact?: ImpactLevel;
  page?: number;
  per_page?: number;
}

// ---- Usage keys ----

export interface UsageKeyEntry {
  key_prefix: string;
  requests_today: number;
  requests_this_month: number;
  last_used_at: string | null;
}

// ---- Sentiment ----

export type SentimentGroupBy = 'currency' | 'country' | 'event_type' | 'sector';

export interface SentimentSummaryGroup {
  group: string;
  event_count: number;
  avg_sentiment: number | null;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  most_recent_event_time: string | null;
}

export interface SentimentSummaryParams {
  currency?: string;
  country?: string;
  from_date?: string;
  to_date?: string;
  group_by?: SentimentGroupBy;
}

export interface SentimentEventsParams {
  currency?: string;
  country?: string;
  sentiment?: SentimentLabel;
  min_score?: number;
  max_score?: number;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
  sort_order?: SortOrder;
}

// ---- Webhooks ----

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'dlq';

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  url: string;
  events: string[];
  filters: Record<string, unknown>;
  impact_filter: string[];
  payload_template: string | null;
  custom_headers: Record<string, string>;
  is_active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  last_failure_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEndpointWithSecret extends WebhookEndpoint {
  /** Signing secret — returned only on create; never persisted client-side. */
  secret: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_id: string;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  attempts: number;
  last_attempt_at: string | null;
  response_status: number | null;
  response_body: string | null;
  next_retry_at: string | null;
  created_at: string;
}

export interface CreateWebhookParams {
  url: string;
  events?: string[];
  filters?: Record<string, unknown>;
  impact_filter?: string[];
  payload_template?: string | null;
  custom_headers?: Record<string, string>;
}

export interface UpdateWebhookParams {
  url?: string;
  events?: string[];
  filters?: Record<string, unknown>;
  is_active?: boolean;
  impact_filter?: string[];
  payload_template?: string | null;
  custom_headers?: Record<string, string>;
}

export interface ListWebhooksParams {
  page?: number;
  per_page?: number;
}

export interface WebhookDeliveriesParams {
  page?: number;
  per_page?: number;
  status?: WebhookDeliveryStatus;
}

export interface WebhookTestResult {
  success: boolean;
  status_code: number | null;
  response_body: string;
  payload: Record<string, unknown>;
}

export interface WebhookBranding {
  /** UUID of the branding record, or null when defaults are returned. */
  id?: string | null;
  user_id: string;
  bot_name: string;
  bot_avatar_url: string | null;
  color_hex: string;
  footer_text: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UpdateWebhookBrandingParams {
  bot_name?: string;
  bot_avatar_url?: string;
  color_hex?: string;
  footer_text?: string;
}

// ---- Notifications ----

export type NotificationChannelType = 'discord' | 'telegram' | 'email';

export interface NotificationChannel {
  id: string;
  user_id: string;
  channel_type: NotificationChannelType;
  name: string;
  config_summary: Record<string, unknown>;
  events: string[];
  filters: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationChannelParams {
  channel_type: NotificationChannelType;
  name?: string;
  config?: Record<string, unknown>;
  events?: string[];
  filters?: Record<string, unknown>;
}

export interface UpdateNotificationChannelParams {
  name?: string;
  config?: Record<string, unknown>;
  events?: string[];
  filters?: Record<string, unknown>;
  is_active?: boolean;
}

export interface ListNotificationChannelsParams {
  page?: number;
  per_page?: number;
}

export interface NotificationChannelTestResult {
  success: boolean;
  channel_type: NotificationChannelType;
  queued: boolean;
  error: string | null;
  payload: Record<string, unknown>;
}

// ===========================================================================
// Legacy / deprecated types
// ===========================================================================
//
// The types below back the `/v1/earnings/*` compatibility methods on
// `QuantGistClient`. The backend currently exposes `/v1/earnings/*`; these
// methods are thin pass-throughs kept so existing SDK consumers continue
// to typecheck.

// ---- Earnings (deprecated) ----

export type BeatMiss = 'beat' | 'miss' | 'in-line';
export type ReportTime = 'before_open' | 'after_close' | 'during_market';

export interface EarningsEvent {
  id: string;
  ticker: string;
  company_name: string;
  report_date: string;
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
  sec_filing_url: string | null;
  sec_accession_number: string | null;
  sec_filed_at: string | null;
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
  from?: string; // deprecated alias for date_from
  to?: string; // deprecated alias for date_to
  date_from?: string;
  date_to?: string;
  sector?: string;
  beat_miss?: BeatMiss;
  cursor?: string;
  limit?: number;
  per_page?: number; // deprecated alias accepted by the SDK and translated to limit
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
  date: string;
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

// ---- Markets (legacy /markets/* endpoints) ----

export interface MarketQuote {
  symbol: string;
  name: string | null;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  change_pct: number | null;
  as_of: string | null;
}

export interface MarketsOverviewResponse {
  data: MarketQuote[];
}

// ---- Changelog ----

export interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
  breaking: boolean;
  changes: string[];
}

export interface ChangelogResponse {
  data: ChangelogEntry[];
}

// ---- Legacy macro-event params shape (deprecated) ----

export interface GetEventsParams {
  from?: string; // deprecated alias for date_from
  to?: string; // deprecated alias for date_to
  date_from?: string;
  date_to?: string;
  country?: string;
  currency?: string;
  impact?: ImpactLevel;
  symbol?: string;
  limit?: number; // deprecated alias for per_page
  per_page?: number;
  page?: number;
}

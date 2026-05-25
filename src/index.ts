export { QuantGistClient } from './client';
export type { QuantGistClientOptions, BaseClient } from './client';

export { V2Resource } from './resources/v2';
export type {
  V2EventsParams,
  V2BacktestParams,
  V2Event,
  V2EventListResponse,
  V2EventDetailResponse,
  V2Vintage,
  V2VintageListResponse,
  CanonicalEvent,
  CanonicalEventsResponse,
} from './resources/v2';

export {
  QuantGistError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  PlanUpgradeRequired,
} from './errors';

export type { UsageEndpointEntry } from './resources/usage';

export type {
  // Core models
  Event,
  EventsResponse,
  ResponseMeta,
  CalendarEvent,
  CalendarResponse,
  CalendarRangeResponse,
  NewsItem,
  Symbol,
  SymbolDetail,
  UsageSummary,
  UsageHistoryEntry,
  UsageHistoryResponse,
  UsageKeyEntry,
  PaginatedResponse,

  // Intelligence models
  SurpriseEvent,
  MoverEvent,
  IntelligenceParams,

  // Watchlist models
  Watchlist,
  WatchlistItem,
  CreateWatchlistParams,
  AddWatchlistItemParams,
  WatchlistEventsParams,

  // Sentiment models
  SentimentGroupBy,
  SentimentSummaryGroup,
  SentimentSummaryParams,
  SentimentEventsParams,

  // Webhook models
  WebhookDeliveryStatus,
  WebhookEndpoint,
  WebhookEndpointWithSecret,
  WebhookDelivery,
  CreateWebhookParams,
  UpdateWebhookParams,
  ListWebhooksParams,
  WebhookDeliveriesParams,
  WebhookTestResult,
  WebhookBranding,
  UpdateWebhookBrandingParams,

  // Notification models
  NotificationChannelType,
  NotificationChannel,
  CreateNotificationChannelParams,
  UpdateNotificationChannelParams,
  ListNotificationChannelsParams,
  NotificationChannelTestResult,

  // Query param types
  Impact,
  ImpactLevel,
  SortOrder,
  SentimentLabel,
  HistoricalFormat,
  ListEventsParams,
  HistoricalEventsParams,
  CalendarParams,
  CalendarRangeParams,
  CalendarUpcomingParams,
  CalendarRangeNewParams,
  ListNewsParams,
  ListSymbolsParams,
  SymbolEventsParams,
  UsageHistoryParams,

  // ----- Legacy / deprecated -----
  // Kept so consumers of the older client (earnings/markets/changelog wrappers)
  // continue to typecheck. Prefer the modern resource-based API.
  BeatMiss,
  ReportTime,
  EarningsEvent,
  EarningsCursorMeta,
  EarningsResponse,
  GetEarningsParams,
  EarningsSummary,
  EarningsSurprise,
  EarningsMover,
  EarningsWeekDay,
  EarningsWeekCalendar,
  EarningsSeasonSummary,
  MarketQuote,
  MarketsOverviewResponse,
  ChangelogEntry,
  ChangelogResponse,
  GetEventsParams,
} from './types';

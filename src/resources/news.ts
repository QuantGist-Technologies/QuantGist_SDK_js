import type { BaseClient } from '../client';
import type {
  AlertCluster,
  CreateNewsWatchlistParams,
  ListNewsAlertsParams,
  ListNewsParams,
  ListRadarParams,
  NewsAlert,
  NewsAlertsResponse,
  NewsItem,
  NewsWatchlist,
  NewsWatchlistsResponse,
  PaginatedResponse,
  RadarResponse,
  TopicPack,
  TopicsResponse,
} from '../types';
import { buildQuery } from '../utils';

// Re-export cluster type so consumers can use it without importing from types directly.
export type { AlertCluster };

export class NewsResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * List news articles with optional filters.
   */
  async list(params?: ListNewsParams): Promise<PaginatedResponse<NewsItem>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<NewsItem>>(`/news${query}`);
  }

  /**
   * List scored, asset-linked News Radar event clusters.
   *
   * Radar clusters aggregate raw headlines under a topic pack
   * (e.g. `iran-war`, `oil-supply`) and carry an `impact_score` plus an
   * `affected_assets` ticker list — designed for traders subscribed to a
   * topic rather than searching raw headlines.
   *
   * Free plan is capped at 10 reads/day; Starter+ is unlimited (subject
   * to the per-plan daily quota).
   */
  async radar(params?: ListRadarParams): Promise<RadarResponse> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<RadarResponse>(`/news/radar${query}`);
  }

  /**
   * List supported News Radar topic packs (`iran-war`, `oil-supply`, ...).
   */
  async topics(): Promise<TopicsResponse> {
    return this.client.request<TopicsResponse>(`/news/topics`);
  }

  /**
   * Return one topic pack's detail. Rejects with a 404 error when the
   * slug is not in the active set.
   */
  async topic(slug: string): Promise<TopicPack> {
    return this.client.request<TopicPack>(`/news/topics/${encodeURIComponent(slug)}`);
  }

  /**
   * List the authenticated user's News Radar watchlists.
   */
  async watchlists(): Promise<NewsWatchlistsResponse> {
    return this.client.request<NewsWatchlistsResponse>('/news/watchlists');
  }

  /**
   * Subscribe to a topic-pack slug. Returns 409 if already subscribed.
   */
  async createWatchlist(params: CreateNewsWatchlistParams): Promise<NewsWatchlist> {
    const query = buildQuery(params as unknown as Record<string, unknown>);
    return this.client.request<NewsWatchlist>(`/news/watchlists${query}`, { method: 'POST' });
  }

  /**
   * Unsubscribe from a topic-pack slug. Returns void on success (204).
   */
  async deleteWatchlist(topicSlug: string): Promise<void> {
    await this.client.request<void>(`/news/watchlists/${encodeURIComponent(topicSlug)}`, {
      method: 'DELETE',
    });
  }

  /**
   * List alerts fired for the authenticated user's watchlists.
   */
  async alerts(params?: ListNewsAlertsParams): Promise<NewsAlertsResponse> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<NewsAlertsResponse>(`/news/alerts${query}`);
  }

  /**
   * Mark one alert as read by alert UUID.
   */
  async ackAlert(alertId: string): Promise<NewsAlert> {
    return this.client.request<NewsAlert>(`/news/alerts/${encodeURIComponent(alertId)}/ack`, {
      method: 'POST',
    });
  }

  /**
   * Mark all unread alerts as read. Returns { acked: N }.
   */
  async ackAllAlerts(): Promise<{ acked: number }> {
    return this.client.request<{ acked: number }>('/news/alerts/ack-all', { method: 'POST' });
  }
}

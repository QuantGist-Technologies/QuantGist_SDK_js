import type { BaseClient } from '../client';
import type {
  ListNewsParams,
  ListRadarParams,
  NewsItem,
  PaginatedResponse,
  RadarResponse,
  TopicPack,
  TopicsResponse,
} from '../types';
import { buildQuery } from '../utils';

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
}

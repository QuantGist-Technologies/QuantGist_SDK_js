import type { BaseClient } from '../client';
import type {
  Event,
  PaginatedResponse,
  SentimentSummaryGroup,
  SentimentSummaryParams,
  SentimentEventsParams,
} from '../types';
import { buildQuery } from '../utils';

export class SentimentResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * Aggregate sentiment statistics grouped by a dimension.
   * Calls GET /v1/sentiment/summary
   *
   * Requires the Starter plan or higher.
   */
  async summary(params?: SentimentSummaryParams): Promise<SentimentSummaryGroup[]> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<SentimentSummaryGroup[]>(`/sentiment/summary${query}`);
  }

  /**
   * Paginated events filtered and sorted by sentiment score.
   * Calls GET /v1/sentiment/events
   *
   * Requires the Starter plan or higher.
   */
  async events(params?: SentimentEventsParams): Promise<PaginatedResponse<Event>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<Event>>(`/sentiment/events${query}`);
  }
}

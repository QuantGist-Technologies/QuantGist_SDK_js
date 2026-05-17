import type { BaseClient } from '../client';
import type { NewsItem, ListNewsParams, PaginatedResponse } from '../types';
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
}

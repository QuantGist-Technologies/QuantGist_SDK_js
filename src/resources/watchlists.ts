import type { BaseClient } from '../client';
import type {
  AddWatchlistItemParams,
  CreateWatchlistParams,
  Event,
  PaginatedResponse,
  Watchlist,
  WatchlistEventsParams,
  WatchlistItem,
} from '../types';
import { buildQuery } from '../utils';

export class WatchlistsResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * List all watchlists for the authenticated user.
   * Calls GET /v1/watchlists
   */
  async list(): Promise<Watchlist[]> {
    return this.client.request<Watchlist[]>('/watchlists');
  }

  /**
   * Create a new watchlist.
   * Calls POST /v1/watchlists
   */
  async create(params: CreateWatchlistParams): Promise<Watchlist> {
    return this.client.request<Watchlist>('/watchlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a watchlist by ID.
   * Calls DELETE /v1/watchlists/{id}
   */
  async delete(watchlistId: string): Promise<void> {
    await this.client.request<void>(`/watchlists/${encodeURIComponent(watchlistId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Add an item (e.g. a symbol or currency) to a watchlist.
   * Calls POST /v1/watchlists/{id}/items
   */
  async addItem(watchlistId: string, params: AddWatchlistItemParams): Promise<WatchlistItem> {
    return this.client.request<WatchlistItem>(
      `/watchlists/${encodeURIComponent(watchlistId)}/items`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    );
  }

  /**
   * Remove an item from a watchlist.
   * Calls DELETE /v1/watchlists/{id}/items/{item_id}
   */
  async removeItem(watchlistId: string, itemId: string): Promise<void> {
    await this.client.request<void>(
      `/watchlists/${encodeURIComponent(watchlistId)}/items/${encodeURIComponent(itemId)}`,
      { method: 'DELETE' },
    );
  }

  /**
   * Retrieve events for all items in a watchlist.
   * Calls GET /v1/watchlists/{id}/events
   */
  async events(
    watchlistId: string,
    params?: WatchlistEventsParams,
  ): Promise<PaginatedResponse<Event>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<Event>>(
      `/watchlists/${encodeURIComponent(watchlistId)}/events${query}`,
    );
  }
}

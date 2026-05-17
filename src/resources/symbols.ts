import type { BaseClient } from '../client';
import type {
  Event,
  ListSymbolsParams,
  PaginatedResponse,
  Symbol,
  SymbolDetail,
  SymbolEventsParams,
} from '../types';
import { buildQuery } from '../utils';

export class SymbolsResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * List available symbols with optional filters.
   * Calls GET /v1/symbols
   */
  async list(params?: ListSymbolsParams): Promise<PaginatedResponse<Symbol>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<Symbol>>(`/symbols${query}`);
  }

  /**
   * Get details for a single symbol.
   * Calls GET /v1/symbols/{symbol}
   */
  async get(symbol: string): Promise<SymbolDetail> {
    return this.client.request<SymbolDetail>(`/symbols/${encodeURIComponent(symbol)}`);
  }

  /**
   * Get events associated with a symbol.
   * Calls GET /v1/symbols/{symbol}/events
   */
  async events(symbol: string, params?: SymbolEventsParams): Promise<PaginatedResponse<Event>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<Event>>(
      `/symbols/${encodeURIComponent(symbol)}/events${query}`,
    );
  }
}

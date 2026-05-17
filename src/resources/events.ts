import type { BaseClient } from '../client';
import type {
  Event,
  ListEventsParams,
  HistoricalEventsParams,
  PaginatedResponse,
} from '../types';
import { buildQuery } from '../utils';

export class EventsResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * List events with optional filters.
   */
  async list(params?: ListEventsParams): Promise<PaginatedResponse<Event>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<Event>>(`/events${query}`);
  }

  /**
   * Retrieve a single event by ID.
   */
  async get(eventId: string): Promise<Event> {
    return this.client.request<Event>(`/events/${encodeURIComponent(eventId)}`);
  }

  /**
   * Retrieve historical events.
   */
  async historical(params?: HistoricalEventsParams): Promise<PaginatedResponse<Event>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<Event>>(`/events/historical${query}`);
  }
}

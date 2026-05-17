import type { BaseClient } from '../client';
import type {
  CalendarEvent,
  CalendarParams,
  CalendarRangeNewParams,
  CalendarResponse,
  CalendarUpcomingParams,
} from '../types';
import { buildQuery } from '../utils';

export class CalendarResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * Get the economic calendar for a specific date (defaults to today).
   * Calls GET /v1/calendar
   */
  async today(params?: CalendarParams): Promise<CalendarResponse> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<CalendarResponse>(`/calendar${query}`);
  }

  /**
   * Get upcoming calendar events.
   * Calls GET /v1/calendar/upcoming
   */
  async upcoming(params?: CalendarUpcomingParams): Promise<CalendarResponse> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<CalendarResponse>(`/calendar/upcoming${query}`);
  }

  /**
   * Get a single calendar event by ID.
   * Calls GET /v1/calendar/{id}
   */
  async get(calendarId: string): Promise<CalendarEvent> {
    return this.client.request<CalendarEvent>(`/calendar/${encodeURIComponent(calendarId)}`);
  }

  /**
   * Get calendar events over a date range.
   * Calls GET /v1/calendar/range
   *
   * @param params.start  Start date ("YYYY-MM-DD"), inclusive.
   * @param params.end    End date ("YYYY-MM-DD"), inclusive.
   * @param params.currencies  Optional list of ISO currency codes.
   * @param params.impact      Optional impact filter.
   * @param params.limit       Maximum events to return (default 200).
   */
  async range(params: CalendarRangeNewParams): Promise<CalendarResponse> {
    const query = buildQuery(params as unknown as Record<string, unknown>);
    return this.client.request<CalendarResponse>(`/calendar/range${query}`);
  }
}

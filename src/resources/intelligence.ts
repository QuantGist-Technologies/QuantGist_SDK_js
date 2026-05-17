import type { BaseClient } from '../client';
import type { IntelligenceParams, MoverEvent, SurpriseEvent } from '../types';
import { buildQuery } from '../utils';

export class IntelligenceResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * Retrieve events with the largest actual-vs-forecast surprises.
   * Calls GET /v1/intelligence/surprises
   */
  async surprises(params?: IntelligenceParams): Promise<SurpriseEvent[]> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<SurpriseEvent[]>(`/intelligence/surprises${query}`);
  }

  /**
   * Retrieve the biggest market movers based on event releases.
   * Calls GET /v1/intelligence/movers
   */
  async movers(params?: IntelligenceParams): Promise<MoverEvent[]> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<MoverEvent[]>(`/intelligence/movers${query}`);
  }
}

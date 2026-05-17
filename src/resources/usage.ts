import type { BaseClient } from '../client';
import type {
  UsageHistoryParams,
  UsageHistoryResponse,
  UsageKeyEntry,
  UsageSummary,
} from '../types';
import { buildQuery } from '../utils';

export interface UsageEndpointEntry {
  endpoint: string;
  requests: number;
  last_called_at: string | null;
}

export class UsageResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * Get current usage summary for the authenticated API key.
   * Calls GET /v1/usage
   */
  async summary(): Promise<UsageSummary> {
    return this.client.request<UsageSummary>('/usage');
  }

  /**
   * Get usage history for the last N days (1–90, default 30).
   * Calls GET /v1/usage/history
   */
  async history(params?: UsageHistoryParams): Promise<UsageHistoryResponse> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<UsageHistoryResponse>(`/usage/history${query}`);
  }

  /**
   * Get per-endpoint request counts for the last N days.
   * Calls GET /v1/usage/endpoints
   */
  async endpoints(params?: UsageHistoryParams): Promise<UsageEndpointEntry[]> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<UsageEndpointEntry[]>(`/usage/endpoints${query}`);
  }

  /**
   * Get usage breakdown by API key.
   * Calls GET /v1/usage/keys
   */
  async keys(): Promise<UsageKeyEntry[]> {
    return this.client.request<UsageKeyEntry[]>('/usage/keys');
  }
}

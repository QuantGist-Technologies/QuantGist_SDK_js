import type { BaseClient } from '../client';
import type {
  CreateWebhookParams,
  ListWebhooksParams,
  PaginatedResponse,
  UpdateWebhookBrandingParams,
  UpdateWebhookParams,
  WebhookBranding,
  WebhookDelivery,
  WebhookDeliveriesParams,
  WebhookEndpoint,
  WebhookEndpointWithSecret,
  WebhookTestResult,
} from '../types';
import { buildQuery } from '../utils';

export class WebhooksResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * Register a new HTTPS webhook endpoint.
   * Calls POST /v1/webhooks
   *
   * Requires the Pro plan or higher. The signing `secret` is returned only
   * on the create response.
   */
  async create(params: CreateWebhookParams): Promise<WebhookEndpointWithSecret> {
    return this.client.request<WebhookEndpointWithSecret>('/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  /**
   * List webhook endpoints for the authenticated user.
   * Calls GET /v1/webhooks
   */
  async list(params?: ListWebhooksParams): Promise<PaginatedResponse<WebhookEndpoint>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<WebhookEndpoint>>(`/webhooks${query}`);
  }

  /**
   * Retrieve a single webhook endpoint by ID.
   * Calls GET /v1/webhooks/{endpoint_id}
   */
  async get(endpointId: string): Promise<WebhookEndpoint> {
    return this.client.request<WebhookEndpoint>(
      `/webhooks/${encodeURIComponent(endpointId)}`,
    );
  }

  /**
   * Update a webhook endpoint.
   * Calls PUT /v1/webhooks/{endpoint_id}
   */
  async update(endpointId: string, params: UpdateWebhookParams): Promise<WebhookEndpoint> {
    return this.client.request<WebhookEndpoint>(
      `/webhooks/${encodeURIComponent(endpointId)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    );
  }

  /**
   * Delete a webhook endpoint and all its delivery history.
   * Calls DELETE /v1/webhooks/{endpoint_id}
   */
  async delete(endpointId: string): Promise<void> {
    await this.client.request<void>(`/webhooks/${encodeURIComponent(endpointId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * List delivery history for a webhook endpoint.
   * Calls GET /v1/webhooks/{endpoint_id}/deliveries
   */
  async deliveries(
    endpointId: string,
    params?: WebhookDeliveriesParams,
  ): Promise<PaginatedResponse<WebhookDelivery>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<WebhookDelivery>>(
      `/webhooks/${encodeURIComponent(endpointId)}/deliveries${query}`,
    );
  }

  /**
   * Dispatch a synthetic test event to a webhook endpoint.
   * Calls POST /v1/webhooks/{endpoint_id}/test
   */
  async test(endpointId: string): Promise<WebhookTestResult> {
    return this.client.request<WebhookTestResult>(
      `/webhooks/${encodeURIComponent(endpointId)}/test`,
      { method: 'POST' },
    );
  }

  /**
   * Get the user's white-label notification branding config.
   * Calls GET /v1/webhooks/branding
   *
   * Returns the default QuantGist branding when no record exists.
   */
  async getBranding(): Promise<WebhookBranding> {
    return this.client.request<WebhookBranding>('/webhooks/branding');
  }

  /**
   * Create or update the user's notification branding (upsert).
   * Calls PUT /v1/webhooks/branding
   *
   * Only provided fields are updated; omitted fields retain their current
   * values (or defaults for a new record).
   */
  async updateBranding(params: UpdateWebhookBrandingParams): Promise<WebhookBranding> {
    return this.client.request<WebhookBranding>('/webhooks/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }
}

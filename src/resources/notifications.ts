import type { BaseClient } from '../client';
import type {
  CreateNotificationChannelParams,
  ListNotificationChannelsParams,
  NotificationChannel,
  NotificationChannelTestResult,
  PaginatedResponse,
  UpdateNotificationChannelParams,
} from '../types';
import { buildQuery } from '../utils';

export class NotificationsResource {
  constructor(private readonly client: BaseClient) {}

  /**
   * List notification channels for the authenticated user.
   * Calls GET /v1/notifications/channels
   *
   * Requires the Starter plan or higher.
   */
  async listChannels(
    params?: ListNotificationChannelsParams,
  ): Promise<PaginatedResponse<NotificationChannel>> {
    const query = buildQuery(params as Record<string, unknown> | undefined);
    return this.client.request<PaginatedResponse<NotificationChannel>>(
      `/notifications/channels${query}`,
    );
  }

  /**
   * Create a new notification channel.
   * Calls POST /v1/notifications/channels
   *
   * Per-plan channel limits are enforced server-side:
   * free = 0, starter = 1, pro = 3, team = unlimited.
   */
  async createChannel(params: CreateNotificationChannelParams): Promise<NotificationChannel> {
    return this.client.request<NotificationChannel>('/notifications/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  /**
   * Retrieve a single notification channel by ID.
   * Calls GET /v1/notifications/channels/{channel_id}
   */
  async getChannel(channelId: string): Promise<NotificationChannel> {
    return this.client.request<NotificationChannel>(
      `/notifications/channels/${encodeURIComponent(channelId)}`,
    );
  }

  /**
   * Update an existing notification channel.
   * Calls PUT /v1/notifications/channels/{channel_id}
   */
  async updateChannel(
    channelId: string,
    params: UpdateNotificationChannelParams,
  ): Promise<NotificationChannel> {
    return this.client.request<NotificationChannel>(
      `/notifications/channels/${encodeURIComponent(channelId)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    );
  }

  /**
   * Delete a notification channel.
   * Calls DELETE /v1/notifications/channels/{channel_id}
   */
  async deleteChannel(channelId: string): Promise<void> {
    await this.client.request<void>(
      `/notifications/channels/${encodeURIComponent(channelId)}`,
      { method: 'DELETE' },
    );
  }

  /**
   * Dispatch a synthetic test notification through a channel.
   * Calls POST /v1/notifications/channels/{channel_id}/test
   */
  async testChannel(channelId: string): Promise<NotificationChannelTestResult> {
    return this.client.request<NotificationChannelTestResult>(
      `/notifications/channels/${encodeURIComponent(channelId)}/test`,
      { method: 'POST' },
    );
  }
}

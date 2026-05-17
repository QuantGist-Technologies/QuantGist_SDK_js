import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall, headerValue } from './setup.js';

describe('notifications resource', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('listChannels() GETs /notifications/channels', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { data: [], meta: { total: 0 } }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    const result = await client.notifications.listChannels();

    expect(result.data).toEqual([]);
    const { url, init } = getFetchCall(mockFetch);
    expect(url).toContain('/notifications/channels');
    expect(headerValue(init, 'X-API-Key')).toBe(TEST_API_KEY);
  });
});

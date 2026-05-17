import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError, QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall, headerValue } from './setup.js';

const FIXTURE_EVENT = {
  id: 'evt_123',
  title: 'US Non-Farm Payrolls',
  country: 'US',
  currency: 'USD',
  release_time: '2024-06-07T12:30:00Z',
  impact: 'high' as const,
};

const FIXTURE_LIST = {
  data: [FIXTURE_EVENT],
  meta: { total: 1, page: 1, per_page: 50 },
};

describe('events resource', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('list({ limit: 5 }) GETs /events?limit=5 with the X-API-Key header', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, FIXTURE_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    const res = await client.events.list({ limit: 5 });

    expect(res.data).toHaveLength(1);
    const { url, init } = getFetchCall(mockFetch);
    expect(url).toContain('/events?limit=5');
    expect(headerValue(init, 'X-API-Key')).toBe(TEST_API_KEY);
  });

  it('list() with multiple filters builds the correct query string', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, FIXTURE_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.events.list({ impact: 'high', currency: 'USD', limit: 25 });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('impact=high');
    expect(url).toContain('currency=USD');
    expect(url).toContain('limit=25');
  });

  it('get(id) GETs /events/{id} and returns the body', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, FIXTURE_EVENT));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    const event = await client.events.get('evt_123');

    expect(event.id).toBe('evt_123');
    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/events/evt_123');
  });

  it('get(id) surfaces a 404 as NotFoundError', async () => {
    stubFetchOnce(
      mockResponse(404, {
        error: 'Not Found',
        detail: 'Event not found',
        request_id: 'req_abc',
      }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await expect(client.events.get('evt_missing')).rejects.toThrow(NotFoundError);
    await expect(client.events.get('evt_missing')).rejects.toThrow('Event not found');
  });

  it('historical() hits /events/historical', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, FIXTURE_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.events.historical({ limit: 10 });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/events/historical?limit=10');
  });
});

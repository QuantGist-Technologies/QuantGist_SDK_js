import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall, headerValue } from './setup.js';

describe('webhooks resource', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('create({ url, events }) POSTs the body to /webhooks with JSON content-type', async () => {
    const mockFetch = stubFetchOnce(
      mockResponse(201, { id: 'wh_1', url: 'https://example.com/hook', secret: 'shh' }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    const params = {
      url: 'https://example.com/hook',
      events: ['event.created', 'event.updated'],
    };
    const result = await client.webhooks.create(params);

    expect(result.id).toBe('wh_1');

    const { url, init } = getFetchCall(mockFetch);
    expect(url).toContain('/webhooks');
    expect(init.method).toBe('POST');
    expect(headerValue(init, 'Content-Type')).toBe('application/json');
    expect(headerValue(init, 'X-API-Key')).toBe(TEST_API_KEY);
    expect(JSON.parse(init.body as string)).toEqual(params);
  });

  it('test(id) POSTs to /webhooks/{id}/test with no body', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { success: true }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.webhooks.test('wh_42');

    const { url, init } = getFetchCall(mockFetch);
    expect(url).toContain('/webhooks/wh_42/test');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('list() GETs /webhooks', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { data: [], meta: {} }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.webhooks.list();

    const { url, init } = getFetchCall(mockFetch);
    expect(url).toMatch(/\/webhooks(\?|$)/);
    // GET = no explicit method set in fetch init
    expect(init.method).toBeUndefined();
  });
});

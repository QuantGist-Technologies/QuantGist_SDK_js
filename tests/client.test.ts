import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError, QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall, headerValue } from './setup.js';

describe('QuantGistClient construction', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('constructs successfully with a valid apiKey and exposes resource namespaces', () => {
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    expect(client.events).toBeDefined();
    expect(client.calendar).toBeDefined();
    expect(client.webhooks).toBeDefined();
    expect(client.notifications).toBeDefined();
    expect(client.sentiment).toBeDefined();
    expect(client.symbols).toBeDefined();
    expect(client.usage).toBeDefined();
    expect(client.watchlists).toBeDefined();
    expect(client.intelligence).toBeDefined();
    expect(client.news).toBeDefined();
  });

  it('throws AuthenticationError when apiKey is missing (empty string)', () => {
    // Cast: the constructor signature requires apiKey, but we want to verify
    // the runtime guard rejects an empty string.
    expect(() => new QuantGistClient({ apiKey: '' } as { apiKey: string })).toThrow(
      AuthenticationError,
    );
  });

  it('throws AuthenticationError when apiKey is undefined', () => {
    expect(
      () => new QuantGistClient({ apiKey: undefined as unknown as string }),
    ).toThrow(AuthenticationError);
  });

  it('sends the X-API-Key header on every request', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { data: [], meta: {} }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.events.list();

    const { init } = getFetchCall(mockFetch);
    expect(headerValue(init, 'X-API-Key')).toBe(TEST_API_KEY);
    expect(headerValue(init, 'Accept')).toBe('application/json');
  });

  it('honors a custom baseUrl and strips trailing slashes', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { data: [], meta: {} }));
    const client = new QuantGistClient({
      apiKey: TEST_API_KEY,
      baseUrl: 'https://staging.quantgist.com/v1/',
    });
    await client.events.list();

    const { url } = getFetchCall(mockFetch);
    expect(url.startsWith('https://staging.quantgist.com/v1/events')).toBe(true);
    // Ensure the trailing slash was stripped (no double slash).
    expect(url).not.toContain('/v1//events');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthenticationError,
  NotFoundError,
  PlanUpgradeRequired,
  QuantGistClient,
  QuantGistError,
  RateLimitError,
} from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce } from './setup.js';

describe('error mapping', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('401 → AuthenticationError with detail message', async () => {
    stubFetchOnce(
      mockResponse(401, { detail: 'Invalid API key', request_id: 'req_1' }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await expect(client.events.list()).rejects.toThrow(AuthenticationError);
    await expect(client.events.list()).rejects.toThrow('Invalid API key');
  });

  it('402 → PlanUpgradeRequired', async () => {
    stubFetchOnce(mockResponse(402, { detail: 'Upgrade required' }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await expect(client.events.list()).rejects.toThrow(PlanUpgradeRequired);
  });

  it('404 → NotFoundError', async () => {
    stubFetchOnce(mockResponse(404, { detail: 'Not found' }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await expect(client.events.get('evt_x')).rejects.toThrow(NotFoundError);
  });

  it('429 → RateLimitError with retryAfter parsed from Retry-After header', async () => {
    stubFetchOnce(
      mockResponse(
        429,
        { detail: 'Rate limit exceeded' },
        { 'Retry-After': '42' },
      ),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    try {
      await client.events.list();
      throw new Error('Expected RateLimitError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfter).toBe(42);
      expect((err as RateLimitError).message).toContain('Rate limit exceeded');
    }
  });

  it('429 with no Retry-After header → RateLimitError with retryAfter undefined', async () => {
    stubFetchOnce(mockResponse(429, { detail: 'Too many requests' }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    try {
      await client.events.list();
      throw new Error('Expected RateLimitError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect((err as RateLimitError).retryAfter).toBeUndefined();
    }
  });

  it('500 → generic QuantGistError carrying status code', async () => {
    stubFetchOnce(mockResponse(500, { detail: 'Internal error' }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    try {
      await client.events.list();
      throw new Error('Expected QuantGistError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(QuantGistError);
      expect((err as QuantGistError).status).toBe(500);
    }
  });
});

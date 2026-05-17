import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall } from './setup.js';

describe('sentiment resource', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('summary() GETs /sentiment/summary', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, []));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.sentiment.summary();

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/sentiment/summary');
  });

  it('summary({ currency }) propagates filters into the query string', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, []));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.sentiment.summary({ currency: 'USD', group_by: 'currency' });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('currency=USD');
    expect(url).toContain('group_by=currency');
  });
});

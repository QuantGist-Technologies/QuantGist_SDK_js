import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall } from './setup.js';

describe('earnings compatibility methods', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('getEarningsUpcoming() forwards to /earnings/upcoming', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { data: [] }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.getEarningsUpcoming(15);

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/earnings/upcoming');
    expect(url).toContain('limit=15');
  });

  it('getEarningsSummary() forwards to ticker summary endpoint', async () => {
    const mockFetch = stubFetchOnce(
      mockResponse(200, { data: { ticker: 'AAPL', total: 4 } }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.getEarningsSummary('AAPL');

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/earnings/AAPL/summary');
  });

  it('getEarningsSurprises() forwards to surprises endpoint', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, []));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.getEarningsSurprises(10);

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/earnings/surprises');
    expect(url).toContain('limit=10');
  });
});

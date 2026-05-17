import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError, QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall } from './setup.js';

describe('earnings deprecation aliases', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('getEarningsUpcoming() forwards to /calendar/upcoming and emits a deprecation warning', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { data: [] }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.getEarningsUpcoming(15);

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/calendar/upcoming');
    expect(url).toContain('limit=15');
    expect(warnSpy).toHaveBeenCalled();
    const warnMessage = String(warnSpy.mock.calls[0]?.[0] ?? '');
    expect(warnMessage).toContain('getEarningsUpcoming');
  });

  it('getEarningsSummary() throws NotFoundError (no backend equivalent)', async () => {
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await expect(client.getEarningsSummary('AAPL')).rejects.toThrow(NotFoundError);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('getEarningsSurprises() throws NotFoundError', async () => {
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await expect(client.getEarningsSurprises()).rejects.toThrow(NotFoundError);
  });
});

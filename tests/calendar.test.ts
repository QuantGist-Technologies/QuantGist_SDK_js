import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanUpgradeRequired, QuantGistClient } from '../src/index.js';
import { TEST_API_KEY, mockResponse, stubFetchOnce, getFetchCall } from './setup.js';

const FIXTURE = { data: [], meta: { total: 0 } };

describe('calendar resource', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('today() GETs /calendar', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, FIXTURE));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.calendar.today();

    const { url } = getFetchCall(mockFetch);
    expect(url).toMatch(/\/calendar(\?|$)/);
  });

  it('upcoming({ limit }) GETs /calendar/upcoming?limit=...', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, FIXTURE));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.calendar.upcoming({ limit: 10 });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/calendar/upcoming');
    expect(url).toContain('limit=10');
  });

  it('range({ start, end }) GETs /calendar/range with both dates in the query', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, FIXTURE));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await client.calendar.range({ start: '2024-06-01', end: '2024-06-30' });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/calendar/range');
    expect(url).toContain('start=2024-06-01');
    expect(url).toContain('end=2024-06-30');
  });

  it('surfaces a 402 plan-required response as PlanUpgradeRequired', async () => {
    stubFetchOnce(
      mockResponse(402, {
        error: 'Payment Required',
        detail: 'Upgrade required',
        request_id: 'req_abc',
      }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });

    await expect(
      client.calendar.range({ start: '2024-06-01', end: '2024-06-30' }),
    ).rejects.toThrow(PlanUpgradeRequired);
  });
});

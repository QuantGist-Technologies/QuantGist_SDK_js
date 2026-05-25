/**
 * Tests for the v2 resource (V2Resource).
 *
 * V2Resource makes direct fetch() calls to the /v2/ base URL rather than
 * routing through client.request(), so tests stub global.fetch and assert
 * on the URL and response forwarding.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuantGistClient } from '../src/index.js';
import {
  TEST_API_KEY,
  mockResponse,
  stubFetchOnce,
  getFetchCall,
  headerValue,
} from './setup.js';

const SAMPLE_V2_EVENT = {
  id: 'v2evt_001',
  source: 'bls',
  event_type: 'economic',
  release_time: '2024-06-07T12:30:00+00:00',
  country: 'US',
  currency: 'USD',
  title: 'US CPI YoY',
  impact: 'high',
  canonical_id: 'US_CPI_YOY',
  actual: '3.3',
  forecast: '3.4',
  previous: '3.4',
  verification_status: 'verified',
  conflict_status: null,
};

const SAMPLE_V2_LIST = {
  data: [SAMPLE_V2_EVENT],
  meta: { total: 1, per_page: 25, cursor_next: null },
  backtest_mode: false,
};

const SAMPLE_V2_BACKTEST = {
  data: [SAMPLE_V2_EVENT],
  meta: { total: 1, per_page: 25, cursor_next: null },
  backtest_mode: true,
};

const SAMPLE_CANONICAL_EVENTS = {
  data: [
    {
      canonical_id: 'US_CPI_YOY',
      title: 'US Consumer Price Index YoY',
      description: null,
      country: 'US',
      currency: 'USD',
      impact: 'high',
      sources: { bls: 'CUUR0000SA0', fred: 'CPIAUCSL' },
    },
  ],
  meta: { total: 1 },
};

describe('QuantGistClient.v2 — construction', () => {
  it('exposes a v2 resource on the client', () => {
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    expect(client.v2).toBeDefined();
  });

  it('derives the v2 base URL by replacing /v1 with /v2 in a custom baseUrl', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_LIST));
    const client = new QuantGistClient({
      apiKey: TEST_API_KEY,
      baseUrl: 'https://staging.quantgist.com/v1',
    });
    await client.v2.events();

    const { url } = getFetchCall(mockFetch);
    expect(url.startsWith('https://staging.quantgist.com/v2/events')).toBe(true);
  });

  it('falls back to the default v2 URL when baseUrl does not contain /v1', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_LIST));
    const client = new QuantGistClient({
      apiKey: TEST_API_KEY,
      baseUrl: 'https://custom.example.com',
    });
    await client.v2.events();

    const { url } = getFetchCall(mockFetch);
    expect(url.startsWith('https://api.quantgist.com/v2/events')).toBe(true);
  });
});

describe('V2Resource.events()', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls /v2/events and returns the list response', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    const result = await client.v2.events();

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/v2/events');
    expect(result.backtest_mode).toBe(false);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].canonical_id).toBe('US_CPI_YOY');
  });

  it('sends the X-API-Key header', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.events();

    const { init } = getFetchCall(mockFetch);
    expect(headerValue(init, 'X-API-Key')).toBe(TEST_API_KEY);
  });

  it('forwards canonical_id and from_date as query params', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.events({ canonicalId: 'US_CPI_YOY', fromDate: '2024-01-01' });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('canonical_id=US_CPI_YOY');
    expect(url).toContain('from_date=2024-01-01');
  });

  it('forwards as_of query param', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.events({ asOf: '2024-06-15' });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('as_of=2024-06-15');
  });

  it('omits undefined params from the query string', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_LIST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.events({ canonicalId: 'US_NFP' });

    const { url } = getFetchCall(mockFetch);
    expect(url).not.toContain('from_date');
    expect(url).not.toContain('to_date');
  });
});

describe('V2Resource.backtest()', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls /v2/backtest and returns backtest_mode=true', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_BACKTEST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    const result = await client.v2.backtest({ canonicalId: 'US_NFP', asOf: '2024-06-15' });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/v2/backtest');
    expect(result.backtest_mode).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('forwards canonical_id and as_of to /v2/backtest', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_V2_BACKTEST));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.backtest({ canonicalId: 'US_CPI_YOY', asOf: '2024-06-15' });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('canonical_id=US_CPI_YOY');
    expect(url).toContain('as_of=2024-06-15');
  });
});

describe('V2Resource.canonicalEvents()', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls /v2/canonical-events and returns the list', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_CANONICAL_EVENTS));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    const result = await client.v2.canonicalEvents();

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/v2/canonical-events');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].canonical_id).toBe('US_CPI_YOY');
  });

  it('forwards country filter to /v2/canonical-events', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, SAMPLE_CANONICAL_EVENTS));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.canonicalEvents({ country: 'US', impact: 'high' });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('country=US');
    expect(url).toContain('impact=high');
  });
});

describe('V2Resource.getEvent() and vintages()', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('getEvent() calls /v2/events/{id}', async () => {
    const mockFetch = stubFetchOnce(
      mockResponse(200, { data: SAMPLE_V2_EVENT }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    const result = await client.v2.getEvent('v2evt_001');

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/v2/events/v2evt_001');
    expect(result.data.id).toBe('v2evt_001');
  });

  it('getEvent() appends ?include_vintages=true when option is set', async () => {
    const mockFetch = stubFetchOnce(
      mockResponse(200, { data: { ...SAMPLE_V2_EVENT, vintages: [] } }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.getEvent('v2evt_001', { includeVintages: true });

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('include_vintages=true');
  });

  it('vintages() calls /v2/events/{id}/vintages', async () => {
    const mockFetch = stubFetchOnce(mockResponse(200, { data: [] }));
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    await client.v2.vintages('v2evt_001');

    const { url } = getFetchCall(mockFetch);
    expect(url).toContain('/v2/events/v2evt_001/vintages');
  });
});

describe('V2Resource.health()', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls /v2/health and returns the status', async () => {
    stubFetchOnce(
      mockResponse(200, { status: 'ok', namespace: 'v2' }),
    );
    const client = new QuantGistClient({ apiKey: TEST_API_KEY });
    const result = await client.v2.health();

    expect(result.status).toBe('ok');
    expect(result.namespace).toBe('v2');
  });
});

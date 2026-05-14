import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  NotFoundError,
  PlanUpgradeRequired,
  QuantGistClient,
  RateLimitError,
} from "../src/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const FIXTURE_EVENT = {
  id: "evt_123",
  title: "US Non-Farm Payrolls",
  country: "US",
  currency: "USD",
  release_time: "2024-06-07T12:30:00Z",
  impact: "high" as const,
  forecast: 185000,
  previous: 175000,
  actual: 272000,
  surprise_score: 0.87,
  affected_symbols: ["XAUUSD", "EURUSD", "DXY"],
  source: "bls.gov",
};

const FIXTURE_EVENTS_RESPONSE = {
  data: [FIXTURE_EVENT],
  meta: {
    total: 1,
    page: 1,
    per_page: 50,
    rate_limit_remaining: 99,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("QuantGistClient", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  // ---- constructor ---------------------------------------------------------

  it("throws AuthenticationError when no apiKey and no env var", () => {
    // ensure env var is absent
    const original = process.env["QUANTGIST_API_KEY"];
    delete process.env["QUANTGIST_API_KEY"];
    try {
      expect(() => new QuantGistClient()).toThrow(AuthenticationError);
    } finally {
      if (original !== undefined) process.env["QUANTGIST_API_KEY"] = original;
    }
  });

  // ---- getEvents() ---------------------------------------------------------

  it("getEvents() with no params returns typed EventsResponse", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse(200, FIXTURE_EVENTS_RESPONSE)),
    );

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    const result = await client.getEvents();

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.id).toBe("evt_123");
    expect(result.data[0]?.impact).toBe("high");
    expect(result.meta.total).toBe(1);
    expect(result.meta.rate_limit_remaining).toBe(99);
  });

  it("getEvents({ impact, symbol }) builds correct query string", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(200, FIXTURE_EVENTS_RESPONSE),
    );
    vi.stubGlobal("fetch", mockFetch);

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await client.getEvents({ impact: "high", symbol: "XAUUSD" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("impact=high");
    expect(calledUrl).toContain("symbol=XAUUSD");
    expect(calledUrl).toContain("/events?");
  });

  it("getEvents() with all params builds full query string", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(200, FIXTURE_EVENTS_RESPONSE),
    );
    vi.stubGlobal("fetch", mockFetch);

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await client.getEvents({
      from: "2024-01-01T00:00:00Z",
      to: "2024-12-31T23:59:59Z",
      country: "US",
      currency: "USD",
      impact: "high",
      symbol: "XAUUSD",
      limit: 25,
      page: 2,
    });

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("from=2024-01-01");
    expect(calledUrl).toContain("to=2024-12-31");
    expect(calledUrl).toContain("country=US");
    expect(calledUrl).toContain("currency=USD");
    expect(calledUrl).toContain("impact=high");
    expect(calledUrl).toContain("symbol=XAUUSD");
    expect(calledUrl).toContain("limit=25");
    expect(calledUrl).toContain("page=2");
  });

  // ---- getEvent() ----------------------------------------------------------

  it("getEvent('evt_123') returns a single Event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse(200, { data: FIXTURE_EVENT })),
    );

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    const event = await client.getEvent("evt_123");

    expect(event.id).toBe("evt_123");
    expect(event.title).toBe("US Non-Farm Payrolls");
    expect(event.release_time).toBe("2024-06-07T12:30:00Z");
    expect(event.affected_symbols).toContain("XAUUSD");
  });

  it("getEvent() calls correct path", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(200, { data: FIXTURE_EVENT }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await client.getEvent("evt_123");

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/events/evt_123");
  });

  // ---- Error mapping -------------------------------------------------------

  it("401 response throws AuthenticationError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(401, { error: "Unauthorized", detail: "Invalid API key", request_id: "req_abc" }),
      ),
    );

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await expect(client.getEvents()).rejects.toThrow(AuthenticationError);
    await expect(client.getEvents()).rejects.toThrow("Invalid API key");
  });

  it("429 response throws RateLimitError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(429, { error: "Too Many Requests", detail: "Rate limit exceeded", request_id: "req_abc" }),
      ),
    );

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await expect(client.getEvents()).rejects.toThrow(RateLimitError);
  });

  it("404 response throws NotFoundError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(404, { error: "Not Found", detail: "Event not found", request_id: "req_abc" }),
      ),
    );

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await expect(client.getEvent("evt_does_not_exist")).rejects.toThrow(NotFoundError);
  });

  it("402 response throws PlanUpgradeRequired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(402, { error: "Payment Required", detail: "Upgrade required", request_id: "req_abc" }),
      ),
    );

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await expect(client.getEvents()).rejects.toThrow(PlanUpgradeRequired);
  });

  // ---- Headers -------------------------------------------------------------

  it("sends User-Agent header in every request", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(200, FIXTURE_EVENTS_RESPONSE),
    );
    vi.stubGlobal("fetch", mockFetch);

    const client = new QuantGistClient({ apiKey: "qg_live_test1234567890123456789012" });
    await client.getEvents();
    await client.getEvent("evt_123").catch(() => {
      // second call may fail due to wrong response shape — we only care about headers
    });

    // check first call
    const firstCallInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = firstCallInit.headers as Record<string, string>;
    expect(headers["User-Agent"]).toMatch(/^quantgist-js\//);
    expect(headers["X-API-Key"]).toBe("qg_live_test1234567890123456789012");
  });

  it("sends X-API-Key header with the provided key", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockResponse(200, FIXTURE_EVENTS_RESPONSE),
    );
    vi.stubGlobal("fetch", mockFetch);

    const client = new QuantGistClient({ apiKey: "qg_live_mykey12345678901234567890" });
    await client.getEvents();

    const callInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = callInit.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("qg_live_mykey12345678901234567890");
  });
});

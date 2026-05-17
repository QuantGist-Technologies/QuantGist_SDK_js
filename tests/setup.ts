import { vi } from 'vitest';

export const TEST_API_KEY = 'qg_test_test1234567890123456789012';

/** Build a JSON `Response` with given status + body. */
export function mockResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** Build a Response with no body (e.g. 204 DELETE). */
export function emptyResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response('', { status, headers });
}

/**
 * Replaces global fetch with a vi.fn() that resolves to a *fresh* clone of
 * `response` for every call. Cloning is required because `Response.json()`
 * can only be consumed once, but tests sometimes invoke the same operation
 * twice (e.g. `await expect(p).rejects.toThrow(...)` chained).
 */
export function stubFetchOnce(response: Response): ReturnType<typeof vi.fn> {
  const mockFetch = vi.fn().mockImplementation(() => Promise.resolve(response.clone()));
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

/** Return the (url, init) tuple for the n-th fetch call (0-indexed). */
export function getFetchCall(
  mockFetch: ReturnType<typeof vi.fn>,
  callIndex = 0,
): { url: string; init: RequestInit } {
  const call = mockFetch.mock.calls[callIndex];
  if (!call) {
    throw new Error(`fetch was not called ${callIndex + 1} time(s)`);
  }
  return { url: call[0] as string, init: (call[1] ?? {}) as RequestInit };
}

/** Read `X-API-Key` (or any header) from a recorded fetch init. */
export function headerValue(init: RequestInit, name: string): string | undefined {
  const headers = (init.headers ?? {}) as Record<string, string>;
  return headers[name];
}

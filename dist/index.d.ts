type Impact = "low" | "medium" | "high";
interface Event {
    id: string;
    title: string;
    country: string;
    currency: string;
    release_time: string;
    impact: Impact;
    forecast: number | null;
    previous: number | null;
    actual: number | null;
    surprise_score: number | null;
    affected_symbols: string[];
    source: string;
}
interface ResponseMeta {
    total: number;
    page: number;
    per_page: number;
    rate_limit_remaining?: number;
}
interface EventsResponse {
    data: Event[];
    meta: ResponseMeta;
}
interface GetEventsParams {
    from?: string;
    to?: string;
    country?: string;
    currency?: string;
    impact?: Impact;
    symbol?: string;
    limit?: number;
    page?: number;
}
interface QuantGistClientOptions {
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
}

declare class QuantGistClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeout;
    constructor(options?: QuantGistClientOptions);
    getEvents(params?: GetEventsParams): Promise<EventsResponse>;
    getEvent(eventId: string): Promise<Event>;
    private get;
    private handleResponse;
}

declare class QuantGistError extends Error {
    readonly statusCode?: number | undefined;
    constructor(message: string, statusCode?: number | undefined);
}
declare class AuthenticationError extends QuantGistError {
    constructor(message?: string);
}
declare class RateLimitError extends QuantGistError {
    constructor(message?: string);
}
declare class NotFoundError extends QuantGistError {
    constructor(message?: string);
}
declare class PlanUpgradeRequired extends QuantGistError {
    constructor(message?: string);
}

export { AuthenticationError, type Event, type EventsResponse, type GetEventsParams, type Impact, NotFoundError, PlanUpgradeRequired, QuantGistClient, type QuantGistClientOptions, QuantGistError, RateLimitError, type ResponseMeta };

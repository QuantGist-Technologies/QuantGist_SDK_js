// src/errors.ts
var QuantGistError = class extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = "QuantGistError";
  }
  statusCode;
};
var AuthenticationError = class extends QuantGistError {
  constructor(message = "Invalid or missing API key") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
};
var RateLimitError = class extends QuantGistError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429);
    this.name = "RateLimitError";
  }
};
var NotFoundError = class extends QuantGistError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
};
var PlanUpgradeRequired = class extends QuantGistError {
  constructor(message = "This feature requires a higher plan") {
    super(message, 402);
    this.name = "PlanUpgradeRequired";
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.quantgist.com/v1";
var SDK_VERSION = "0.1.0";
var QuantGistClient = class {
  apiKey;
  baseUrl;
  timeout;
  constructor(options = {}) {
    this.apiKey = options.apiKey ?? process.env["QUANTGIST_API_KEY"] ?? "";
    if (!this.apiKey) {
      throw new AuthenticationError(
        "API key required. Pass apiKey option or set QUANTGIST_API_KEY env var."
      );
    }
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = options.timeout ?? 3e4;
  }
  async getEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.country) query.set("country", params.country);
    if (params.currency) query.set("currency", params.currency);
    if (params.impact) query.set("impact", params.impact);
    if (params.symbol) query.set("symbol", params.symbol);
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.page != null) query.set("page", String(params.page));
    return this.get(`/events?${query}`);
  }
  async getEvent(eventId) {
    const resp = await this.get(`/events/${eventId}`);
    return resp.data;
  }
  async get(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          "X-API-Key": this.apiKey,
          "User-Agent": `quantgist-js/${SDK_VERSION}`
        },
        signal: controller.signal
      });
      return this.handleResponse(response);
    } finally {
      clearTimeout(timer);
    }
  }
  async handleResponse(response) {
    if (response.ok) return response.json();
    const body = await response.json().catch(() => ({}));
    const detail = body?.detail ?? body?.error ?? "Unknown error";
    switch (response.status) {
      case 401:
        throw new AuthenticationError(detail);
      case 429:
        throw new RateLimitError(detail);
      case 404:
        throw new NotFoundError(detail);
      case 402:
        throw new PlanUpgradeRequired(detail);
      default:
        throw new QuantGistError(detail, response.status);
    }
  }
};

export { AuthenticationError, NotFoundError, PlanUpgradeRequired, QuantGistClient, QuantGistError, RateLimitError };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
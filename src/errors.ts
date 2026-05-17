export class QuantGistError extends Error {
  status: number;

  /** Alias for {@link status}; kept for backwards compatibility with older callers. */
  get statusCode(): number {
    return this.status;
  }

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'QuantGistError';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends QuantGistError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends QuantGistError {
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
  }
}

export class NotFoundError extends QuantGistError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class PlanUpgradeRequired extends QuantGistError {
  constructor(message = 'This feature requires a higher plan') {
    super(message, 402);
    this.name = 'PlanUpgradeRequired';
  }
}

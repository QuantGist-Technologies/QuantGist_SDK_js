export class QuantGistError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "QuantGistError";
  }
}

export class AuthenticationError extends QuantGistError {
  constructor(message = "Invalid or missing API key") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends QuantGistError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

export class NotFoundError extends QuantGistError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class PlanUpgradeRequired extends QuantGistError {
  constructor(message = "This feature requires a higher plan") {
    super(message, 402);
    this.name = "PlanUpgradeRequired";
  }
}

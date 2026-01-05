/**
 * Custom error classes for DevTrackr
 * Matches specification requirements
 */

export class DevTrackrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevTrackrError';
    Object.setPrototypeOf(this, DevTrackrError.prototype);
  }
}

export class DevTrackrAuthError extends DevTrackrError {
  constructor(message: string = 'Authentication failed. Invalid or missing token.') {
    super(message);
    this.name = 'DevTrackrAuthError';
    Object.setPrototypeOf(this, DevTrackrAuthError.prototype);
  }
}

export class DevTrackrRateLimitError extends DevTrackrError {
  public readonly limit: number;
  public readonly remaining: number;
  public readonly resetAt: Date;

  constructor(
    message: string,
    limit: number,
    remaining: number,
    resetAt: Date
  ) {
    super(message);
    this.name = 'DevTrackrRateLimitError';
    this.limit = limit;
    this.remaining = remaining;
    this.resetAt = resetAt;
    Object.setPrototypeOf(this, DevTrackrRateLimitError.prototype);
  }
}

export class DevTrackrNetworkError extends DevTrackrError {
  constructor(message: string = 'Network request failed.') {
    super(message);
    this.name = 'DevTrackrNetworkError';
    Object.setPrototypeOf(this, DevTrackrNetworkError.prototype);
  }
}


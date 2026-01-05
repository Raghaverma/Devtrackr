/**
 * Custom error classes for DevTrackr
 * Matches specification requirements with error codes and retry guidance
 */

export enum DevTrackrErrorCode {
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_MISSING_TOKEN = 'AUTH_MISSING_TOKEN',
  AUTH_INSUFFICIENT_SCOPES = 'AUTH_INSUFFICIENT_SCOPES',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface RetryInfo {
  retryable: boolean;
  retryAfter?: number; // milliseconds
  maxRetries?: number;
}

export class DevTrackrError extends Error {
  public readonly code: DevTrackrErrorCode;
  public readonly retryInfo: RetryInfo;

  constructor(
    message: string,
    code: DevTrackrErrorCode,
    retryInfo: RetryInfo = { retryable: false }
  ) {
    super(message);
    this.name = 'DevTrackrError';
    this.code = code;
    this.retryInfo = retryInfo;
    Object.setPrototypeOf(this, DevTrackrError.prototype);
  }
}

export class DevTrackrAuthError extends DevTrackrError {
  constructor(
    message: string = 'Authentication failed. Invalid or missing token.',
    code: DevTrackrErrorCode = DevTrackrErrorCode.AUTH_INVALID_TOKEN
  ) {
    super(message, code, { retryable: false });
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
    const retryAfter = resetAt.getTime() - Date.now();
    super(
      message,
      DevTrackrErrorCode.RATE_LIMIT_EXCEEDED,
      {
        retryable: true,
        retryAfter: Math.max(0, retryAfter),
        maxRetries: 1, // Only retry after reset
      }
    );
    this.name = 'DevTrackrRateLimitError';
    this.limit = limit;
    this.remaining = remaining;
    this.resetAt = resetAt;
    Object.setPrototypeOf(this, DevTrackrRateLimitError.prototype);
  }
}

export class DevTrackrNetworkError extends DevTrackrError {
  constructor(
    message: string = 'Network request failed.',
    code: DevTrackrErrorCode = DevTrackrErrorCode.NETWORK_ERROR,
    retryable: boolean = true
  ) {
    super(
      message,
      code,
      {
        retryable,
        maxRetries: retryable ? 3 : 0,
      }
    );
    this.name = 'DevTrackrNetworkError';
    Object.setPrototypeOf(this, DevTrackrNetworkError.prototype);
  }
}

export class DevTrackrValidationError extends DevTrackrError {
  constructor(message: string) {
    super(
      message,
      DevTrackrErrorCode.VALIDATION_ERROR,
      { retryable: false }
    );
    this.name = 'DevTrackrValidationError';
    Object.setPrototypeOf(this, DevTrackrValidationError.prototype);
  }
}


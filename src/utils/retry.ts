/**
 * Retry utility with exponential backoff
 * Used for handling rate limits and transient network errors
 */

import { DevTrackrError, DevTrackrRateLimitError } from '../errors';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  retryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 60 seconds
  retryable: (error) => {
    if (error instanceof DevTrackrError) {
      return error.retryInfo.retryable;
    }
    return false;
  },
};

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay; // Up to 30% jitter
  return Math.floor(delay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!opts.retryable(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        throw error;
      }

      // Handle rate limit errors specially
      if (error instanceof DevTrackrRateLimitError) {
        const waitTime = error.retryInfo.retryAfter || opts.baseDelay;
        if (waitTime > 0) {
          await sleep(waitTime);
          continue;
        }
      }

      // Calculate delay for exponential backoff
      const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay);
      await sleep(delay);
    }
  }

  throw lastError;
}




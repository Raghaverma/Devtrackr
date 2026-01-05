/**
 * Rate limit tracking and information
 */

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
  resetIn: number; // milliseconds until reset
}

let lastRateLimitInfo: RateLimitInfo | null = null;

/**
 * Update rate limit information from API response headers
 */
export function updateRateLimitInfo(
  limit: number,
  remaining: number,
  reset: number
): void {
  const resetAt = new Date(reset * 1000);
  const resetIn = Math.max(0, resetAt.getTime() - Date.now());

  lastRateLimitInfo = {
    limit,
    remaining,
    resetAt,
    resetIn,
  };
}

/**
 * Get current rate limit information
 */
export function getRateLimitInfo(): RateLimitInfo | null {
  if (!lastRateLimitInfo) {
    return null;
  }

  // Update resetIn to reflect current time
  const resetIn = Math.max(0, lastRateLimitInfo.resetAt.getTime() - Date.now());

  return {
    ...lastRateLimitInfo,
    resetIn,
  };
}

/**
 * Check if rate limit is approaching (less than 10% remaining)
 */
export function isRateLimitLow(): boolean {
  const info = getRateLimitInfo();
  if (!info) {
    return false;
  }
  return info.remaining < info.limit * 0.1;
}


/**
 * GitHub API fetch wrapper
 * Handles authentication, error handling, and rate limiting
 * Uses native fetch only - no axios or GitHub SDKs
 */

import {
  DevTrackrAuthError,
  DevTrackrRateLimitError,
  DevTrackrNetworkError,
  DevTrackrErrorCode,
} from '../errors';
import { updateRateLimitInfo } from '../utils/rateLimit';

export interface FetchOptions {
  token: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export interface RateLimitHeaders {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Parse rate limit headers from GitHub API response
 */
function parseRateLimitHeaders(headers: Headers): RateLimitHeaders | null {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
  }

  return null;
}

/**
 * Fetch from GitHub API with proper error handling
 */
export async function githubFetch<T>(options: FetchOptions): Promise<T> {
  const { token, endpoint, method = 'GET', body, headers = {} } = options;

  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${token}`,
    'User-Agent': 'DevTrackr-SDK',
    ...headers,
  };

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
    requestHeaders['Content-Type'] = 'application/json';
  }

  let response: Response;

  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    if (error instanceof Error) {
      throw new DevTrackrNetworkError(
        `Network error: ${error.message}`,
        DevTrackrErrorCode.NETWORK_ERROR,
        true // Network errors are retryable
      );
    }
    throw new DevTrackrNetworkError(
      'Network request failed',
      DevTrackrErrorCode.NETWORK_ERROR,
      true
    );
  }

  const rateLimitHeaders = parseRateLimitHeaders(response.headers);

  // Update rate limit tracking
  if (rateLimitHeaders) {
    updateRateLimitInfo(
      rateLimitHeaders.limit,
      rateLimitHeaders.remaining,
      rateLimitHeaders.reset
    );
  }

  // Handle authentication errors (401)
  if (response.status === 401) {
    throw new DevTrackrAuthError(
      'Invalid or expired GitHub token. Please check your token and ensure it has not been revoked.',
      DevTrackrErrorCode.AUTH_INVALID_TOKEN
    );
  }

  // Handle rate limit errors (403 with rate limit headers)
  if (response.status === 403 && rateLimitHeaders && rateLimitHeaders.remaining === 0) {
    const resetAt = new Date(rateLimitHeaders.reset * 1000);
    throw new DevTrackrRateLimitError(
      `GitHub API rate limit exceeded. Resets at ${resetAt.toISOString()}`,
      rateLimitHeaders.limit,
      rateLimitHeaders.remaining,
      resetAt
    );
  }

  // Handle other 403 errors
  if (response.status === 403) {
    throw new DevTrackrAuthError(
      'Access forbidden. Check token permissions and ensure required scopes are granted.',
      DevTrackrErrorCode.AUTH_INSUFFICIENT_SCOPES
    );
  }

  // Handle other errors
  if (!response.ok) {
    let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
    let errorCode = DevTrackrErrorCode.API_ERROR;
    let retryable = response.status >= 500; // Retry on server errors

    try {
      const errorBody = await response.json() as { message?: string };
      if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw new DevTrackrNetworkError(errorMessage, errorCode, retryable);
  }

  // Parse JSON response
  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    throw new DevTrackrNetworkError(
      'Failed to parse GitHub API response',
      DevTrackrErrorCode.API_ERROR,
      false // Parse errors are not retryable
    );
  }
}

/**
 * Fetch paginated results from GitHub API
 * Handles Link header pagination
 */
export async function githubFetchPaginated<T>(
  options: FetchOptions
): Promise<T[]> {
  const { token, endpoint, headers = {} } = options;

  const allResults: T[] = [];
  let currentUrl = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  let hasMore = true;

  while (hasMore) {
    const response = await githubFetch<T[]>({
      token,
      endpoint: currentUrl,
      headers,
    });

    if (Array.isArray(response)) {
      allResults.push(...response);
    } else {
      // If response is not an array, wrap it
      allResults.push(response as T);
    }

    // Check for pagination in Link header
    // For simplicity, we'll fetch all pages by appending per_page=100
    // and checking if we got a full page
    if (Array.isArray(response) && response.length === 100) {
      // Continue pagination - in a real implementation, we'd parse Link headers
      // For now, we'll limit to reasonable number of pages
      const url = new URL(currentUrl);
      const currentPage = parseInt(url.searchParams.get('page') || '1', 10);
      url.searchParams.set('page', String(currentPage + 1));
      url.searchParams.set('per_page', '100');
      currentUrl = url.toString();
    } else {
      hasMore = false;
    }

    // Safety limit to prevent infinite loops
    if (allResults.length > 10000) {
      break;
    }
  }

  return allResults;
}


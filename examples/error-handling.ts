/**
 * Error handling examples for DevTrackr SDK
 */

import { createDevTrackr } from '../src/index';
import {
  DevTrackrAuthError,
  DevTrackrRateLimitError,
  DevTrackrNetworkError,
  DevTrackrValidationError,
} from '../src/index';

async function demonstrateErrorHandling() {
  const token = process.env.GITHUB_TOKEN || 'invalid-token';
  const devtrackr = createDevTrackr({ token });

  // Example 1: Handle validation errors
  try {
    await devtrackr.getProfile('');
  } catch (error) {
    if (error instanceof DevTrackrValidationError) {
      console.log('Validation error caught:', error.message);
      console.log('Error code:', error.code);
      console.log('Retryable:', error.retryInfo.retryable);
    }
  }

  // Example 2: Handle authentication errors
  try {
    await devtrackr.getProfile('octocat');
  } catch (error) {
    if (error instanceof DevTrackrAuthError) {
      console.log('Authentication error:', error.message);
      console.log('Error code:', error.code);
      // Auth errors are not retryable - check your token
    }
  }

  // Example 3: Handle rate limit errors
  try {
    // Make many requests to trigger rate limit
    for (let i = 0; i < 100; i++) {
      await devtrackr.getProfile('octocat');
    }
  } catch (error) {
    if (error instanceof DevTrackrRateLimitError) {
      console.log('Rate limit exceeded!');
      console.log(`Limit: ${error.limit}`);
      console.log(`Remaining: ${error.remaining}`);
      console.log(`Resets at: ${error.resetAt.toISOString()}`);
      
      const waitTime = error.retryInfo.retryAfter;
      if (waitTime) {
        console.log(`Wait ${Math.ceil(waitTime / 1000)} seconds before retrying`);
      }
    }
  }

  // Example 4: Handle network errors with retry logic
  async function fetchWithRetry(username: string, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await devtrackr.getProfile(username);
      } catch (error) {
        if (error instanceof DevTrackrNetworkError) {
          if (error.retryInfo.retryable && attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
  }

  // Example 5: Comprehensive error handling
  async function safeFetch(username: string) {
    try {
      const profile = await devtrackr.getProfile(username);
      return profile;
    } catch (error) {
      if (error instanceof DevTrackrValidationError) {
        console.error('Invalid input:', error.message);
        // Don't retry - fix the input
      } else if (error instanceof DevTrackrAuthError) {
        console.error('Authentication failed:', error.message);
        // Don't retry - check token
      } else if (error instanceof DevTrackrRateLimitError) {
        console.error('Rate limited. Wait until:', error.resetAt);
        // Could implement queue or wait logic here
      } else if (error instanceof DevTrackrNetworkError) {
        if (error.retryInfo.retryable) {
          console.error('Network error (retryable):', error.message);
          // Implement retry logic
        } else {
          console.error('Network error (not retryable):', error.message);
        }
      } else {
        console.error('Unknown error:', error);
      }
      throw error;
    }
  }
}

// demonstrateErrorHandling();




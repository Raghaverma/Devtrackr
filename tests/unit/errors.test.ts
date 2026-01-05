/**
 * Unit tests for error classes
 */

import { describe, it, expect } from 'vitest';
import {
  DevTrackrError,
  DevTrackrAuthError,
  DevTrackrRateLimitError,
  DevTrackrNetworkError,
  DevTrackrValidationError,
  DevTrackrErrorCode,
} from '../../src/errors';

describe('DevTrackrError', () => {
  it('should create error with message and code', () => {
    const error = new DevTrackrError('Test error', DevTrackrErrorCode.NETWORK_ERROR);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(DevTrackrErrorCode.NETWORK_ERROR);
    expect(error.name).toBe('DevTrackrError');
  });

  it('should have retry info', () => {
    const error = new DevTrackrError('Test', DevTrackrErrorCode.NETWORK_ERROR, {
      retryable: true,
      maxRetries: 3,
    });
    expect(error.retryInfo.retryable).toBe(true);
    expect(error.retryInfo.maxRetries).toBe(3);
  });
});

describe('DevTrackrAuthError', () => {
  it('should create auth error with default message', () => {
    const error = new DevTrackrAuthError();
    expect(error.message).toContain('Authentication failed');
    expect(error.code).toBe(DevTrackrErrorCode.AUTH_INVALID_TOKEN);
    expect(error.retryInfo.retryable).toBe(false);
  });

  it('should create auth error with custom message', () => {
    const error = new DevTrackrAuthError('Custom auth error');
    expect(error.message).toBe('Custom auth error');
  });
});

describe('DevTrackrRateLimitError', () => {
  it('should create rate limit error with reset info', () => {
    const resetAt = new Date(Date.now() + 3600000);
    const error = new DevTrackrRateLimitError(
      'Rate limit exceeded',
      5000,
      0,
      resetAt
    );

    expect(error.message).toBe('Rate limit exceeded');
    expect(error.limit).toBe(5000);
    expect(error.remaining).toBe(0);
    expect(error.resetAt).toBe(resetAt);
    expect(error.code).toBe(DevTrackrErrorCode.RATE_LIMIT_EXCEEDED);
    expect(error.retryInfo.retryable).toBe(true);
    expect(error.retryInfo.retryAfter).toBeGreaterThan(0);
  });
});

describe('DevTrackrNetworkError', () => {
  it('should create network error with default message', () => {
    const error = new DevTrackrNetworkError();
    expect(error.message).toContain('Network request failed');
    expect(error.code).toBe(DevTrackrErrorCode.NETWORK_ERROR);
    expect(error.retryInfo.retryable).toBe(true);
  });

  it('should create network error with custom message and retryable flag', () => {
    const error = new DevTrackrNetworkError('Custom error', DevTrackrErrorCode.API_ERROR, false);
    expect(error.message).toBe('Custom error');
    expect(error.code).toBe(DevTrackrErrorCode.API_ERROR);
    expect(error.retryInfo.retryable).toBe(false);
  });
});

describe('DevTrackrValidationError', () => {
  it('should create validation error', () => {
    const error = new DevTrackrValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe(DevTrackrErrorCode.VALIDATION_ERROR);
    expect(error.retryInfo.retryable).toBe(false);
  });
});




/**
 * Integration tests for GitHub API wrappers
 * Mocks fetch at github/fetch.ts level
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUser } from '../../src/github/user';
import { fetchUserRepositories } from '../../src/github/repos';
import { fetchUserLanguageStats } from '../../src/github/languages';
import {
  DevTrackrAuthError,
  DevTrackrRateLimitError,
  DevTrackrNetworkError,
} from '../../src/errors';
import githubUserFixture from '../fixtures/github-user.json';
import githubReposFixture from '../fixtures/github-repos.json';
import githubLanguagesFixture from '../fixtures/github-languages.json';

// Mock global fetch
global.fetch = vi.fn();

describe('GitHub API Wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user data successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': '1234567890',
      }),
      json: async () => githubUserFixture,
    });

    const user = await fetchUser('test-token', 'octocat');

    expect(user.login).toBe('octocat');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/octocat'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token test-token',
        }),
      })
    );
  });

  it('should throw DevTrackrAuthError on 401', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers(),
      json: async () => ({ message: 'Bad credentials' }),
    });

    await expect(fetchUser('invalid-token', 'octocat')).rejects.toThrow(
      DevTrackrAuthError
    );
  });

  it('should throw DevTrackrRateLimitError on rate limit', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1234567890',
      }),
      json: async () => ({ message: 'API rate limit exceeded' }),
    });

    await expect(fetchUser('test-token', 'octocat')).rejects.toThrow(
      DevTrackrRateLimitError
    );

    // Reset mock for second call
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1234567890',
      }),
      json: async () => ({ message: 'API rate limit exceeded' }),
    });

    try {
      await fetchUser('test-token', 'octocat');
      expect.fail('Should have thrown DevTrackrRateLimitError');
    } catch (error) {
      expect(error).toBeInstanceOf(DevTrackrRateLimitError);
      if (error instanceof DevTrackrRateLimitError) {
        expect(error.limit).toBe(5000);
        expect(error.remaining).toBe(0);
        expect(error.resetAt).toBeInstanceOf(Date);
        expect(error.resetAt.getTime()).toBe(1234567890 * 1000);
      }
    }
  });

  it('should throw DevTrackrNetworkError on network failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchUser('test-token', 'octocat')).rejects.toThrow(
      DevTrackrNetworkError
    );
  });

  it('should throw DevTrackrNetworkError on non-ok response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers(),
      json: async () => ({ message: 'Server error' }),
    });

    await expect(fetchUser('test-token', 'octocat')).rejects.toThrow(
      DevTrackrNetworkError
    );
  });
});

describe('fetchUserRepositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch repositories with options', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => githubReposFixture,
    });

    const repos = await fetchUserRepositories('test-token', 'octocat', {
      sort: 'updated',
      direction: 'desc',
      perPage: 10,
    });

    expect(repos).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/octocat/repos'),
      expect.any(Object)
    );
  });
});

describe('fetchUserLanguageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate language stats from repositories', async () => {
    // Mock repositories fetch
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubReposFixture,
      })
      // Mock language fetches for each repo
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubLanguagesFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ TypeScript: 200000 }),
      });

    const repos = githubReposFixture as any[];
    const stats = await fetchUserLanguageStats('test-token', 'octocat', repos);

    expect(stats).toBeDefined();
    expect(typeof stats.JavaScript).toBe('number');
  });
});


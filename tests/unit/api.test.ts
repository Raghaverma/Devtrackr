/**
 * Unit tests for DevTrackr API methods
 * Tests all public API methods with mocked GitHub API responses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDevTrackr } from '../../src/createDevTrackr';
import {
  DevTrackrAuthError,
  DevTrackrRateLimitError,
  DevTrackrNetworkError,
  DevTrackrValidationError,
} from '../../src/errors';
import githubUserFixture from '../fixtures/github-user.json';
import githubReposFixture from '../fixtures/github-repos.json';
import githubCommitsFixture from '../fixtures/github-commits.json';
import githubLanguagesFixture from '../fixtures/github-languages.json';

// Mock global fetch
global.fetch = vi.fn();

describe('createDevTrackr', () => {
  it('should create a DevTrackr instance with valid token', () => {
    const devtrackr = createDevTrackr({ token: 'test-token' });
    expect(devtrackr).toBeDefined();
    expect(typeof devtrackr.getProfile).toBe('function');
    expect(typeof devtrackr.getRepositories).toBe('function');
  });

  it('should throw DevTrackrValidationError for missing token', () => {
    expect(() => {
      createDevTrackr({ token: '' as any });
    }).toThrow(DevTrackrValidationError);

    expect(() => {
      createDevTrackr({ token: null as any });
    }).toThrow(DevTrackrValidationError);
  });

  it('should throw DevTrackrValidationError for invalid token type', () => {
    expect(() => {
      createDevTrackr({ token: 123 as any });
    }).toThrow(DevTrackrValidationError);
  });
});

describe('getProfile', () => {
  let devtrackr: ReturnType<typeof createDevTrackr>;

  beforeEach(() => {
    vi.clearAllMocks();
    devtrackr = createDevTrackr({ token: 'test-token' });
  });

  it('should fetch and normalize user profile', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      }),
      json: async () => githubUserFixture,
    });

    const profile = await devtrackr.getProfile('octocat');

    expect(profile.username).toBe('octocat');
    expect(profile.name).toBe('The Octocat');
    expect(profile.followers).toBe(2000);
    expect(profile.publicRepos).toBe(8);
    expect(profile.profileUrl).toBe('https://github.com/octocat');
  });

  it('should throw DevTrackrValidationError for empty username', async () => {
    await expect(devtrackr.getProfile('')).rejects.toThrow(DevTrackrValidationError);
  });

  it('should throw DevTrackrValidationError for invalid username', async () => {
    await expect(devtrackr.getProfile(null as any)).rejects.toThrow(DevTrackrValidationError);
  });

  it('should throw DevTrackrAuthError on 401', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers(),
      json: async () => ({ message: 'Bad credentials' }),
    });

    await expect(devtrackr.getProfile('octocat')).rejects.toThrow(DevTrackrAuthError);
  });

  it('should throw DevTrackrRateLimitError on rate limit', async () => {
    const resetTime = Math.floor(Date.now() / 1000) + 3600;
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(resetTime),
      }),
      json: async () => ({ message: 'API rate limit exceeded' }),
    });

    try {
      await devtrackr.getProfile('octocat');
      expect.fail('Should have thrown DevTrackrRateLimitError');
    } catch (error) {
      expect(error).toBeInstanceOf(DevTrackrRateLimitError);
      if (error instanceof DevTrackrRateLimitError) {
        expect(error.limit).toBe(5000);
        expect(error.remaining).toBe(0);
        expect(error.resetAt).toBeInstanceOf(Date);
      }
    }
  });
});

describe('getRepositories', () => {
  let devtrackr: ReturnType<typeof createDevTrackr>;

  beforeEach(() => {
    vi.clearAllMocks();
    devtrackr = createDevTrackr({ token: 'test-token' });
  });

  it('should fetch and normalize repositories', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => githubReposFixture,
    });

    const repos = await devtrackr.getRepositories('octocat');

    expect(Array.isArray(repos)).toBe(true);
    expect(repos.length).toBeGreaterThan(0);
    expect(repos[0]).toHaveProperty('name');
    expect(repos[0]).toHaveProperty('stars');
    expect(repos[0]).toHaveProperty('forks');
  });

  it('should handle repository options', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => githubReposFixture,
    });

    await devtrackr.getRepositories('octocat', {
      sort: 'updated',
      direction: 'desc',
      perPage: 10,
      page: 1,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sort=updated'),
      expect.any(Object)
    );
  });

  it('should throw DevTrackrValidationError for empty username', async () => {
    await expect(devtrackr.getRepositories('')).rejects.toThrow(DevTrackrValidationError);
  });
});

describe('getRecentCommits', () => {
  let devtrackr: ReturnType<typeof createDevTrackr>;

  beforeEach(() => {
    vi.clearAllMocks();
    devtrackr = createDevTrackr({ token: 'test-token' });
  });

  it('should fetch and normalize recent commits', async () => {
    // Mock repositories fetch
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubReposFixture,
      })
      // Mock commits fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubCommitsFixture,
      });

    const commits = await devtrackr.getRecentCommits('octocat', { perPage: 30 });

    expect(Array.isArray(commits)).toBe(true);
    if (commits.length > 0) {
      expect(commits[0]).toHaveProperty('repo');
      expect(commits[0]).toHaveProperty('message');
      expect(commits[0]).toHaveProperty('committedAt');
    }
  });

  it('should handle commit options', async () => {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubReposFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubCommitsFixture,
      });

    await devtrackr.getRecentCommits('octocat', {
      perPage: 50,
      since: since.toISOString(),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('since='),
      expect.any(Object)
    );
  });
});

describe('getLanguageStats', () => {
  let devtrackr: ReturnType<typeof createDevTrackr>;

  beforeEach(() => {
    vi.clearAllMocks();
    devtrackr = createDevTrackr({ token: 'test-token' });
  });

  it('should fetch and normalize language statistics', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubReposFixture,
      })
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

    const stats = await devtrackr.getLanguageStats('octocat');

    expect(stats).toHaveProperty('totalBytes');
    expect(stats).toHaveProperty('languages');
    expect(Array.isArray(stats.languages)).toBe(true);
    if (stats.languages.length > 0) {
      expect(stats.languages[0]).toHaveProperty('name');
      expect(stats.languages[0]).toHaveProperty('percentage');
      expect(stats.languages[0]).toHaveProperty('color');
    }
  });
});

describe('getContributionStats', () => {
  let devtrackr: ReturnType<typeof createDevTrackr>;

  beforeEach(() => {
    vi.clearAllMocks();
    devtrackr = createDevTrackr({ token: 'test-token' });
  });

  it('should calculate contribution statistics', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubReposFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubCommitsFixture,
      });

    const stats = await devtrackr.getContributionStats('octocat');

    expect(stats).toHaveProperty('totalCommits');
    expect(stats).toHaveProperty('activeDays');
    expect(stats).toHaveProperty('avgCommitsPerWeek');
    expect(stats).toHaveProperty('longestStreak');
    expect(stats).toHaveProperty('currentStreak');
    expect(typeof stats.totalCommits).toBe('number');
  });
});

describe('getActivityTimeline', () => {
  let devtrackr: ReturnType<typeof createDevTrackr>;

  beforeEach(() => {
    vi.clearAllMocks();
    devtrackr = createDevTrackr({ token: 'test-token' });
  });

  it('should create activity timeline', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubReposFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => githubCommitsFixture,
      });

    const timeline = await devtrackr.getActivityTimeline('octocat', { days: 90 });

    expect(Array.isArray(timeline)).toBe(true);
    if (timeline.length > 0) {
      expect(timeline[0]).toHaveProperty('date');
      expect(timeline[0]).toHaveProperty('commits');
      expect(typeof timeline[0].commits).toBe('number');
    }
  });
});

describe('getRateLimitInfo', () => {
  let devtrackr: ReturnType<typeof createDevTrackr>;

  beforeEach(() => {
    vi.clearAllMocks();
    devtrackr = createDevTrackr({ token: 'test-token' });
  });

  it('should return null when no requests have been made', () => {
    const info = devtrackr.getRateLimitInfo();
    expect(info).toBeNull();
  });

  it('should return rate limit info after making a request', async () => {
    const resetTime = Math.floor(Date.now() / 1000) + 3600;
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': String(resetTime),
      }),
      json: async () => githubUserFixture,
    });

    await devtrackr.getProfile('octocat');
    const info = devtrackr.getRateLimitInfo();

    expect(info).not.toBeNull();
    if (info) {
      expect(info.limit).toBe(5000);
      expect(info.remaining).toBe(4999);
      expect(info.resetAt).toBeInstanceOf(Date);
      expect(info.resetIn).toBeGreaterThan(0);
    }
  });
});


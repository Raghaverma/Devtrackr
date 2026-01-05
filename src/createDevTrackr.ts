/**
 * DevTrackr factory function
 * Creates a DevTrackr instance with all required methods
 */

import { DevTrackrConfig, DevTrackrInstance, RateLimitInfo } from './types';
import { DevTrackrValidationError } from './errors';
import { getRateLimitInfo } from './utils/rateLimit';

function validateUsername(username: string): void {
  if (!username) {
    throw new DevTrackrValidationError('Username is required and cannot be empty.');
  }
  if (typeof username !== 'string') {
    throw new DevTrackrValidationError('Username must be a string.');
  }
  if (username.trim().length === 0) {
    throw new DevTrackrValidationError('Username cannot be whitespace only.');
  }
  // GitHub usernames can contain alphanumeric and hyphens, but not start/end with hyphen
  // This is a basic validation - GitHub API will reject invalid usernames anyway
  if (username.length > 39) {
    throw new DevTrackrValidationError('Username cannot exceed 39 characters (GitHub limit).');
  }
}
import { fetchUser } from './github/user';
import { fetchUserRepositories } from './github/repos';
import { fetchUserCommits } from './github/commits';
import { fetchUserLanguageStats } from './github/languages';
import { normalizeProfile } from './normalize/profile';
import { normalizeRepositories } from './normalize/repos';
import { normalizeCommits } from './normalize/commits';
import { normalizeLanguageStats } from './normalize/languages';
import {
  calculateContributionStats,
  createActivityTimeline,
} from './normalize/activity';
import type {
  Profile,
  Repository,
  RecentCommit,
  LanguageStats,
  ContributionStats,
  ActivityTimeline,
  RepositoryOptions,
  CommitOptions,
  ActivityTimelineOptions,
} from './types';

export function createDevTrackr(config: DevTrackrConfig): DevTrackrInstance {
  const { token } = config;

  if (!token) {
    throw new DevTrackrValidationError('GitHub token is required. Provide a token in the config object.');
  }

  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new DevTrackrValidationError('GitHub token must be a non-empty string.');
  }

  return {
    async getProfile(username: string): Promise<Profile> {
      validateUsername(username);
      const githubUser = await fetchUser(token, username);
      return normalizeProfile(githubUser);
    },

    async getRepositories(
      username: string,
      options?: RepositoryOptions
    ): Promise<Repository[]> {
      validateUsername(username);
      const githubRepos = await fetchUserRepositories(token, username, options);
      return normalizeRepositories(githubRepos);
    },

    async getRecentCommits(
      username: string,
      options?: CommitOptions
    ): Promise<RecentCommit[]> {
      validateUsername(username);
      // First fetch repositories to get commits from
      const repositories = await fetchUserRepositories(token, username, {
        sort: 'updated',
        direction: 'desc',
        perPage: 10,
      });

      const githubCommits = await fetchUserCommits(
        token,
        username,
        repositories,
        options
      );

      return normalizeCommits(githubCommits);
    },

    async getLanguageStats(username: string): Promise<LanguageStats> {
      validateUsername(username);
      // Fetch all repositories
      const repositories = await fetchUserRepositories(token, username, {
        perPage: 100,
      });

      // Fetch language stats
      const githubLanguageStats = await fetchUserLanguageStats(
        token,
        username,
        repositories
      );

      return normalizeLanguageStats(githubLanguageStats);
    },

    async getContributionStats(username: string): Promise<ContributionStats> {
      validateUsername(username);
      // Fetch repositories
      const repositories = await fetchUserRepositories(token, username, {
        perPage: 100,
      });

      // Fetch commits from repositories
      const githubCommits = await fetchUserCommits(
        token,
        username,
        repositories,
        { perPage: 1000 } // Get more commits for accurate stats
      );

      const normalizedCommits = normalizeCommits(githubCommits);
      return calculateContributionStats(normalizedCommits);
    },

    async getActivityTimeline(
      username: string,
      options?: ActivityTimelineOptions
    ): Promise<ActivityTimeline> {
      validateUsername(username);
      // Fetch repositories
      const repositories = await fetchUserRepositories(token, username, {
        perPage: 100,
      });

      // Fetch commits
      const githubCommits = await fetchUserCommits(
        token,
        username,
        repositories,
        { perPage: 1000 }
      );

      const normalizedCommits = normalizeCommits(githubCommits);
      const days = options?.days || 365;
      return createActivityTimeline(normalizedCommits, days);
    },

    getRateLimitInfo(): RateLimitInfo | null {
      return getRateLimitInfo();
    },
  };
}


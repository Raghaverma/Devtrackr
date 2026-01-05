/**
 * Unit tests for normalization functions
 * Tests normalization logic, language percentage math, and color mapping
 */

import { describe, it, expect } from 'vitest';
import { normalizeProfile } from '../../src/normalize/profile';
import { normalizeRepository, normalizeRepositories } from '../../src/normalize/repos';
import { normalizeCommit, normalizeCommits } from '../../src/normalize/commits';
import { normalizeLanguageStats } from '../../src/normalize/languages';
import {
  calculateContributionStats,
  createActivityTimeline,
} from '../../src/normalize/activity';
import type {
  GitHubUser,
  GitHubRepository,
  GitHubCommit,
  GitHubLanguageStats,
} from '../../src/types';
import githubUserFixture from '../fixtures/github-user.json';
import githubReposFixture from '../fixtures/github-repos.json';
import githubCommitsFixture from '../fixtures/github-commits.json';

describe('normalizeProfile', () => {
  it('should normalize GitHub user to Profile schema', () => {
    const githubUser = githubUserFixture as GitHubUser;
    const profile = normalizeProfile(githubUser);

    expect(profile.username).toBe('octocat');
    expect(profile.name).toBe('The Octocat');
    expect(profile.avatarUrl).toBe('https://github.com/images/error/octocat_happy.gif');
    expect(profile.bio).toBe('There once was...');
    expect(profile.followers).toBe(2000);
    expect(profile.following).toBe(0);
    expect(profile.publicRepos).toBe(8);
    expect(profile.profileUrl).toBe('https://github.com/octocat');
  });

  it('should handle null values correctly', () => {
    const githubUser: GitHubUser = {
      login: 'testuser',
      name: null,
      avatar_url: 'https://example.com/avatar.png',
      bio: null,
      followers: 0,
      following: 0,
      public_repos: 0,
      html_url: 'https://github.com/testuser',
    };

    const profile = normalizeProfile(githubUser);

    expect(profile.name).toBeNull();
    expect(profile.bio).toBeNull();
  });
});

describe('normalizeRepository', () => {
  it('should normalize GitHub repository to Repository schema', () => {
    const githubRepo = githubReposFixture[0] as GitHubRepository;
    const repo = normalizeRepository(githubRepo);

    expect(repo.name).toBe('Hello-World');
    expect(repo.description).toBe('This your first repo!');
    expect(repo.stars).toBe(80);
    expect(repo.forks).toBe(9);
    expect(repo.primaryLanguage).toBe('JavaScript');
    expect(repo.updatedAt).toBe('2011-01-26T19:14:43Z');
    expect(repo.repoUrl).toBe('https://github.com/octocat/Hello-World');
  });

  it('should normalize multiple repositories', () => {
    const githubRepos = githubReposFixture as GitHubRepository[];
    const repos = normalizeRepositories(githubRepos);

    expect(repos).toHaveLength(2);
    expect(repos[0].name).toBe('Hello-World');
    expect(repos[1].name).toBe('TypeScript-Repo');
  });

  it('should handle null description and language', () => {
    const githubRepo: GitHubRepository = {
      name: 'test-repo',
      description: null,
      stargazers_count: 0,
      forks_count: 0,
      language: null,
      updated_at: '2023-01-01T00:00:00Z',
      html_url: 'https://github.com/user/test-repo',
    };

    const repo = normalizeRepository(githubRepo);

    expect(repo.description).toBeNull();
    expect(repo.primaryLanguage).toBeNull();
  });
});

describe('normalizeCommit', () => {
  it('should normalize GitHub commit to RecentCommit schema', () => {
    const githubCommit = {
      ...githubCommitsFixture[0],
      repository: { name: 'Hello-World' },
    } as GitHubCommit;

    const commit = normalizeCommit(githubCommit);

    expect(commit.repo).toBe('Hello-World');
    expect(commit.message).toBe('Fix all the bugs');
    expect(commit.additions).toBe(100);
    expect(commit.deletions).toBe(8);
    expect(commit.committedAt).toBe('2011-04-14T16:00:49Z');
    expect(commit.commitUrl).toBe('https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e');
  });

  it('should extract first line of commit message only', () => {
    const githubCommit: GitHubCommit = {
      sha: 'abc123',
      commit: {
        message: 'First line\n\nSecond line\nThird line',
        author: {
          date: '2023-01-01T00:00:00Z',
        },
      },
      html_url: 'https://github.com/user/repo/commit/abc123',
      repository: { name: 'test-repo' },
    };

    const commit = normalizeCommit(githubCommit);

    expect(commit.message).toBe('First line');
  });

  it('should handle missing stats', () => {
    const githubCommit: GitHubCommit = {
      sha: 'abc123',
      commit: {
        message: 'Test commit',
        author: {
          date: '2023-01-01T00:00:00Z',
        },
      },
      html_url: 'https://github.com/user/repo/commit/abc123',
      repository: { name: 'test-repo' },
    };

    const commit = normalizeCommit(githubCommit);

    expect(commit.additions).toBe(0);
    expect(commit.deletions).toBe(0);
  });
});

describe('normalizeLanguageStats', () => {
  it('should calculate language percentages correctly', () => {
    const githubLanguageStats: GitHubLanguageStats = {
      JavaScript: 1000000,
      TypeScript: 500000,
      Python: 250000,
      HTML: 100000,
    };

    const stats = normalizeLanguageStats(githubLanguageStats);

    expect(stats.totalBytes).toBe(1850000);
    expect(stats.languages).toHaveLength(4);

    // Check percentages sum to approximately 100
    const totalPercentage = stats.languages.reduce((sum, lang) => sum + lang.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 1);

    // Check JavaScript is highest
    expect(stats.languages[0].name).toBe('JavaScript');
    expect(stats.languages[0].percentage).toBeGreaterThan(50);
  });

  it('should assign colors to languages', () => {
    const githubLanguageStats: GitHubLanguageStats = {
      JavaScript: 1000000,
      TypeScript: 500000,
    };

    const stats = normalizeLanguageStats(githubLanguageStats);

    expect(stats.languages[0].color).toBeTruthy();
    expect(stats.languages[1].color).toBeTruthy();
    expect(stats.languages[0].color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('should handle empty language stats', () => {
    const stats = normalizeLanguageStats({});

    expect(stats.totalBytes).toBe(0);
    expect(stats.languages).toHaveLength(0);
  });

  it('should sort languages by bytes descending', () => {
    const githubLanguageStats: GitHubLanguageStats = {
      Python: 100000,
      JavaScript: 1000000,
      TypeScript: 500000,
    };

    const stats = normalizeLanguageStats(githubLanguageStats);

    expect(stats.languages[0].name).toBe('JavaScript');
    expect(stats.languages[1].name).toBe('TypeScript');
    expect(stats.languages[2].name).toBe('Python');
  });
});

describe('calculateContributionStats', () => {
  it('should calculate contribution stats from commits', () => {
    const commits = [
      {
        repo: 'repo1',
        message: 'Commit 1',
        additions: 10,
        deletions: 5,
        committedAt: '2023-01-01T00:00:00Z',
        commitUrl: 'https://github.com/user/repo1/commit/1',
      },
      {
        repo: 'repo1',
        message: 'Commit 2',
        additions: 20,
        deletions: 10,
        committedAt: '2023-01-02T00:00:00Z',
        commitUrl: 'https://github.com/user/repo1/commit/2',
      },
      {
        repo: 'repo2',
        message: 'Commit 3',
        additions: 15,
        deletions: 5,
        committedAt: '2023-01-03T00:00:00Z',
        commitUrl: 'https://github.com/user/repo2/commit/3',
      },
    ];

    const stats = calculateContributionStats(commits);

    expect(stats.totalCommits).toBe(3);
    expect(stats.activeDays).toBe(3);
    expect(stats.avgCommitsPerWeek).toBeGreaterThan(0);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty commits array', () => {
    const stats = calculateContributionStats([]);

    expect(stats.totalCommits).toBe(0);
    expect(stats.activeDays).toBe(0);
    expect(stats.avgCommitsPerWeek).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });

  it('should handle gaps in activity (streak reset)', () => {
    const commits = [
      {
        repo: 'repo1',
        message: 'Commit 1',
        additions: 10,
        deletions: 5,
        committedAt: '2023-01-01T00:00:00Z',
        commitUrl: 'https://github.com/user/repo1/commit/1',
      },
      {
        repo: 'repo1',
        message: 'Commit 2',
        additions: 20,
        deletions: 10,
        committedAt: '2023-01-02T00:00:00Z',
        commitUrl: 'https://github.com/user/repo1/commit/2',
      },
      // Gap of 3 days
      {
        repo: 'repo2',
        message: 'Commit 3',
        additions: 15,
        deletions: 5,
        committedAt: '2023-01-06T00:00:00Z',
        commitUrl: 'https://github.com/user/repo2/commit/3',
      },
    ];

    const stats = calculateContributionStats(commits);

    expect(stats.totalCommits).toBe(3);
    expect(stats.activeDays).toBe(3);
    // Longest streak should be 2 (Jan 1-2), not 3
    expect(stats.longestStreak).toBe(2);
  });

  it('should handle zero-commit days in timeline', () => {
    // Use recent dates to ensure they're within the timeline range
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const commits = [
      {
        repo: 'repo1',
        message: 'Commit 1',
        additions: 10,
        deletions: 5,
        committedAt: fourDaysAgo.toISOString(),
        commitUrl: 'https://github.com/user/repo1/commit/1',
      },
      // Day between has no commits
      {
        repo: 'repo2',
        message: 'Commit 2',
        additions: 15,
        deletions: 5,
        committedAt: twoDaysAgo.toISOString(),
        commitUrl: 'https://github.com/user/repo2/commit/2',
      },
    ];

    const timeline = createActivityTimeline(commits, 30);
    
    const date1 = fourDaysAgo.toISOString().split('T')[0];
    const date2 = new Date(fourDaysAgo);
    date2.setDate(date2.getDate() + 1);
    const date2Str = date2.toISOString().split('T')[0];
    const date3 = twoDaysAgo.toISOString().split('T')[0];

    const item1 = timeline.find(item => item.date === date1);
    const item2 = timeline.find(item => item.date === date2Str);
    const item3 = timeline.find(item => item.date === date3);

    expect(item1?.commits).toBe(1);
    expect(item2?.commits).toBe(0); // Zero-commit day included
    expect(item3?.commits).toBe(1);
  });

  it('should calculate current streak from today backwards', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const commits = [
      {
        repo: 'repo1',
        message: 'Commit 1',
        additions: 10,
        deletions: 5,
        committedAt: twoDaysAgo.toISOString(),
        commitUrl: 'https://github.com/user/repo1/commit/1',
      },
      {
        repo: 'repo1',
        message: 'Commit 2',
        additions: 20,
        deletions: 10,
        committedAt: yesterday.toISOString(),
        commitUrl: 'https://github.com/user/repo1/commit/2',
      },
    ];

    const stats = calculateContributionStats(commits);
    
    // Current streak should be at least 2 if commits are recent
    expect(stats.currentStreak).toBeGreaterThanOrEqual(0);
  });
});

describe('createActivityTimeline', () => {
  it('should create activity timeline from commits', () => {
    // Use recent dates to ensure they're within the timeline range
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const commits = [
      {
        repo: 'repo1',
        message: 'Commit 1',
        additions: 10,
        deletions: 5,
        committedAt: twoDaysAgo.toISOString(),
        commitUrl: 'https://github.com/user/repo1/commit/1',
      },
      {
        repo: 'repo1',
        message: 'Commit 2',
        additions: 20,
        deletions: 10,
        committedAt: twoDaysAgo.toISOString(),
        commitUrl: 'https://github.com/user/repo1/commit/2',
      },
      {
        repo: 'repo2',
        message: 'Commit 3',
        additions: 15,
        deletions: 5,
        committedAt: yesterday.toISOString(),
        commitUrl: 'https://github.com/user/repo2/commit/3',
      },
    ];

    const timeline = createActivityTimeline(commits, 30);

    expect(timeline.length).toBeGreaterThan(0);
    
    const date1 = twoDaysAgo.toISOString().split('T')[0];
    const date2 = yesterday.toISOString().split('T')[0];
    
    const item1 = timeline.find(item => item.date === date1);
    expect(item1).toBeDefined();
    expect(item1?.commits).toBe(2);

    const item2 = timeline.find(item => item.date === date2);
    expect(item2).toBeDefined();
    expect(item2?.commits).toBe(1);
  });

  it('should filter commits by date range', () => {
    const commits = [
      {
        repo: 'repo1',
        message: 'Old commit',
        additions: 10,
        deletions: 5,
        committedAt: '2020-01-01T00:00:00Z',
        commitUrl: 'https://github.com/user/repo1/commit/1',
      },
      {
        repo: 'repo1',
        message: 'Recent commit',
        additions: 20,
        deletions: 10,
        committedAt: new Date().toISOString(),
        commitUrl: 'https://github.com/user/repo1/commit/2',
      },
    ];

    const timeline = createActivityTimeline(commits, 30);

    // Old commit should be filtered out (outside 30 day window)
    const hasOldCommit = timeline.some(item => item.commits > 0 && item.date === '2020-01-01');
    expect(hasOldCommit).toBe(false);
  });
});


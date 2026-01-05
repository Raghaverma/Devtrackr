/**
 * Normalize GitHub commit data to RecentCommit schema
 */

import { RecentCommit, GitHubCommit } from '../types';

export function normalizeCommit(githubCommit: GitHubCommit): RecentCommit {
  return {
    repo: githubCommit.repository.name,
    message: githubCommit.commit.message.split('\n')[0], // First line only
    additions: githubCommit.stats?.additions || 0,
    deletions: githubCommit.stats?.deletions || 0,
    committedAt: githubCommit.commit.author.date,
    commitUrl: githubCommit.html_url,
  };
}

export function normalizeCommits(githubCommits: GitHubCommit[]): RecentCommit[] {
  return githubCommits.map(normalizeCommit);
}


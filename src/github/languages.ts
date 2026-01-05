/**
 * GitHub Languages API endpoints
 */

import { githubFetch } from './fetch';
import { GitHubRepository, GitHubLanguageStats } from '../types';

export async function fetchRepositoryLanguages(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubLanguageStats> {
  return githubFetch<GitHubLanguageStats>({
    token,
    endpoint: `/repos/${owner}/${repo}/languages`,
  });
}

/**
 * Fetch language statistics for all user repositories
 */
export async function fetchUserLanguageStats(
  token: string,
  username: string,
  repositories: GitHubRepository[]
): Promise<GitHubLanguageStats> {
  const allLanguages: GitHubLanguageStats = {};

  // Fetch languages for each repository
  for (const repo of repositories) {
    try {
      const languages = await fetchRepositoryLanguages(
        token,
        username,
        repo.name
      );

      // Aggregate language bytes
      for (const [language, bytes] of Object.entries(languages)) {
        allLanguages[language] = (allLanguages[language] || 0) + bytes;
      }
    } catch {
      // Skip if language fetch fails
      continue;
    }
  }

  return allLanguages;
}


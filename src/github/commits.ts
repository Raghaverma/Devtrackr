/**
 * GitHub Commits API endpoints
 */

import { githubFetch } from './fetch';
import { GitHubCommit, CommitOptions, GitHubRepository } from '../types';

/**
 * Fetch user commits from their repositories
 * Uses author filter to get commits by the user
 */
export async function fetchUserCommits(
  token: string,
  username: string,
  repositories: GitHubRepository[],
  options?: CommitOptions
): Promise<GitHubCommit[]> {
  const params = new URLSearchParams();
  params.set('author', username);
  
  if (options?.perPage) {
    params.set('per_page', String(options.perPage));
  } else {
    params.set('per_page', '30'); // Default to 30 per repo
  }
  if (options?.since) {
    params.set('since', options.since);
  }
  if (options?.until) {
    params.set('until', options.until);
  }

  const queryString = params.toString();
  const allCommits: GitHubCommit[] = [];

  // Fetch commits from repositories (limit to most recent repos for efficiency)
  const reposToCheck = repositories
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10); // Check top 10 most recently updated repos

  for (const repo of reposToCheck) {
    try {
      const [owner, repoName] = repo.html_url.replace('https://github.com/', '').split('/');
      const endpoint = `/repos/${owner}/${repoName}/commits?${queryString}`;
      
      const commits = await githubFetch<GitHubCommit[]>({
        token,
        endpoint,
      });

      // Add repository name to each commit
      // Note: Stats are not included in the commits list endpoint
      // They would require individual API calls per commit (rate limit concern)
      commits.forEach(commit => {
        commit.repository = { name: repo.name };
        // Stats will be undefined - normalized to 0 in normalizeCommit
      });

      allCommits.push(...commits);

      // Limit total commits
      if (allCommits.length >= (options?.perPage || 100)) {
        break;
      }
    } catch {
      // Skip if commit fetch fails
      continue;
    }
  }

  // Sort by date (most recent first) and limit
  allCommits.sort((a, b) => 
    new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
  );

  const limit = options?.perPage || 100;
  return allCommits.slice(0, limit);
}

/**
 * Fetch commits from a specific repository
 */
export async function fetchRepositoryCommits(
  token: string,
  owner: string,
  repo: string,
  options?: CommitOptions
): Promise<GitHubCommit[]> {
  const params = new URLSearchParams();
  
  if (options?.perPage) {
    params.set('per_page', String(options.perPage));
  } else {
    params.set('per_page', '100');
  }
  if (options?.page) {
    params.set('page', String(options.page));
  }
  if (options?.since) {
    params.set('since', options.since);
  }
  if (options?.until) {
    params.set('until', options.until);
  }

  const queryString = params.toString();
  const endpoint = `/repos/${owner}/${repo}/commits${queryString ? `?${queryString}` : ''}`;

  return githubFetch<GitHubCommit[]>({
    token,
    endpoint,
  });
}


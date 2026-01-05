/**
 * Normalize GitHub repository data to Repository schema
 */

import { Repository, GitHubRepository } from '../types';

export function normalizeRepository(githubRepo: GitHubRepository): Repository {
  return {
    name: githubRepo.name,
    description: githubRepo.description,
    stars: githubRepo.stargazers_count,
    forks: githubRepo.forks_count,
    primaryLanguage: githubRepo.language,
    updatedAt: githubRepo.updated_at,
    repoUrl: githubRepo.html_url,
  };
}

export function normalizeRepositories(githubRepos: GitHubRepository[]): Repository[] {
  return githubRepos.map(normalizeRepository);
}


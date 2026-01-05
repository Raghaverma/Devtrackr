/**
 * GitHub Repositories API endpoints
 */

import { githubFetch } from './fetch';
import { GitHubRepository, RepositoryOptions } from '../types';

export async function fetchUserRepositories(
  token: string,
  username: string,
  options?: RepositoryOptions
): Promise<GitHubRepository[]> {
  const params = new URLSearchParams();
  
  if (options?.sort) {
    params.set('sort', options.sort);
  }
  if (options?.direction) {
    params.set('direction', options.direction);
  }
  if (options?.perPage) {
    params.set('per_page', String(options.perPage));
  } else {
    params.set('per_page', '100'); // Default to max per page
  }
  if (options?.page) {
    params.set('page', String(options.page));
  }

  const queryString = params.toString();
  const endpoint = `/users/${username}/repos${queryString ? `?${queryString}` : ''}`;

  return githubFetch<GitHubRepository[]>({
    token,
    endpoint,
  });
}

